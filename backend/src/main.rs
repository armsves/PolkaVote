use alloy::{
    network::EthereumWallet,
    primitives::{FixedBytes, address},
    providers::ProviderBuilder,
    signers::local::PrivateKeySigner,
    sol,
};
use axum::{
    Router,
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::post,
};
use std::sync::{Arc, Mutex};
use tokio::net::TcpListener;

sol! {
    // SPDX-License-Identifier: MIT
    pragma solidity ^0.8.28;

    #[sol(rpc)]
    contract PrivateVoting {
        struct Proposal {
            uint64 id;
            address creator;
            string description;
            uint64 voting_system;
            uint64 start_date;
            uint64 end_date;
            bool finished;
            uint64 result;
        }

        struct Vote {
            address voter;
            uint64 timestamp;
            uint64 proposal_nonce;
            uint64 voter_nonce;
            bool vote;
        }

        mapping(uint64 => Proposal) public proposals;
        mapping(uint64 => mapping(address => mapping(uint64 => bool))) public hasVoted;
        mapping(uint64 => Vote[]) public proposalVotes;

        uint64[] public proposalIds;
        uint64 public proposalCount;

        event ProposalCreated(uint64 indexed id, address indexed creator);
        event VoteCast(address indexed voter, uint64 indexed proposal_nonce, bool vote);

        function vote(
            address voter,
            uint64 timestamp,
            uint64 proposal_nonce,
            uint64 voter_nonce,
            bool _vote
        ) public returns (bool) {
            require(voter == msg.sender, "Invalid voter");
            require(!hasVoted[proposal_nonce][voter][voter_nonce], "Already voted");
            require(proposals[proposal_nonce].id != 0, "Proposal not found");
            require(!proposals[proposal_nonce].finished, "Voting ended");

            proposalVotes[proposal_nonce].push(Vote({
                voter: voter,
                timestamp: timestamp,
                proposal_nonce: proposal_nonce,
                voter_nonce: voter_nonce,
                vote: _vote
            }));

            hasVoted[proposal_nonce][voter][voter_nonce] = true;
            emit VoteCast(voter, proposal_nonce, _vote);
            return true;
        }

        function accountVoted(
            uint64 id,
            address voter,
            uint64 proposal_nonce
        ) view public returns (bool) {
            return hasVoted[proposal_nonce][voter][id];
        }

        function createProposal(
            uint64 id,
            address creator,
            string memory description,
            uint64 voting_system,
            uint64 start_date,
            uint64 end_date,
            bool finished,
            uint64 result
        ) public {
            require(creator == msg.sender, "Invalid creator");
            require(proposals[id].id == 0, "Proposal exists");

            proposals[id] = Proposal({
                id: id,
                creator: creator,
                description: description,
                voting_system: voting_system,
                start_date: start_date,
                end_date: end_date,
                finished: finished,
                result: result
            });

            proposalIds.push(id);
            proposalCount++;
            emit ProposalCreated(id, creator);
        }

        function getProposals() public view returns (Proposal[] memory) {
            Proposal[] memory result = new Proposal[](proposalCount);
            for (uint256 i = 0; i < proposalIds.length; i++) {
                result[i] = proposals[proposalIds[i]];
            }
            return result;
        }

        function getProposal(uint64 id) public view returns (Proposal memory) {
            require(proposals[id].id != 0, "Proposal not found");
            return proposals[id];
        }

        function getProposalVotes(uint64 proposal_nonce) public view returns (Vote[] memory) {
            return proposalVotes[proposal_nonce];
        }

        function finishProposal(uint64 id, int64 result) public {
            require(proposals[id].id != 0, "Proposal not found");
            require(proposals[id].creator == msg.sender, "Not creator");
            require(!proposals[id].finished, "Already finished");

            proposals[id].finished = true;
            proposals[id].result = result;
        }
    }
}

#[derive(Debug, Clone, Default)]
pub struct AppState {
    votes: Arc<Mutex<Vec<i64>>>,
}
pub async fn vote(State(state): State<AppState>, Path(p): Path<i64>) -> impl IntoResponse {
    state.votes.lock().unwrap().push(p);
    (StatusCode::OK, "Vote successfully counted").into_response()
}

pub async fn submit_votes_onchain(
    State(state): State<AppState>,
    Path(p): Path<u64>,
) -> Result<impl IntoResponse, String> {
    let pk: PrivateKeySigner = std::env::var("PK").unwrap().parse().unwrap();
    let wallet = EthereumWallet::new(pk);
    let provider = ProviderBuilder::new()
        .wallet(wallet)
        .connect_http("".parse().unwrap());
    let contract = PrivateVoting::new(
        address!("0x0000000000000000000000000000000000000000"),
        provider,
    );
    let sum: i64  = { state.votes.lock().unwrap().iter().sum() };
    let result: FixedBytes<32> = contract
        .finishProposal(p, sum)
        .send()
        .await
        .unwrap()
        .watch()
        .await
        .unwrap();

    Ok((StatusCode::OK, result.to_string()))
}

#[tokio::main]
async fn main() {
    let state: AppState = AppState::default();

    let app: Router = Router::new()
        .route(
            "/submit_votes/{proposal_number}",
            post(submit_votes_onchain),
        )
        .route("/vote/{vote}", post(vote))
        .with_state(state);
    let listener = TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
