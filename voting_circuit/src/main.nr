use dep::std;

global SHA256_WORD_LEN: u32 = 32;

struct Vote {
    // timestamp in nanos
    // timestamp: u128,
    public_key_x: [u8; 32],
    public_key_y: [u8; 32],
    value: i8,
    message_hash: [u8; SHA256_WORD_LEN],
    signature: [u8; 64],
}


fn main(
         public_key_x: [u8; 32],
         public_key_y: [u8; 32],
         is_upvote: bool,
         message_hash: [u8; SHA256_WORD_LEN],
         signature: [u8; 64],
         ) {
    let v = create_vote(public_key_x, public_key_y, is_upvote, message_hash, signature);
    vote(v);
}

fn create_vote(public_key_x: [u8; 32], public_key_y: [u8; 32], is_upvote: bool, message_hash: [u8; SHA256_WORD_LEN], signature: [u8; 64]) -> Vote {
    let mut vote_value: i8 = -1;
    if is_upvote {
        vote_value = 1;
    }
    let vote = Vote { 
        public_key_x,
        public_key_y,
        value: vote_value,
        message_hash,
        signature
    };

    vote
}

fn vote(vote: Vote) {
    let valid_signature = 
        std::ecdsa_secp256k1::verify_signature(vote.public_key_x,  vote.public_key_y, vote.signature, vote.message_hash);
     assert(valid_signature);
    assert((vote.value == 1) | (vote.value == -1));
}


#[test]
fn test_verify() {
    let hashed_message = [13, 82, 120, 60, 76, 186, 215, 235, 175, 126, 185, 67, 252, 100, 143, 82, 130, 165, 32, 112, 68, 47, 193, 141, 141, 209, 109, 219, 47, 203, 175, 102];
    let pub_key_x = [131, 24, 83, 91, 84, 16, 93, 74, 122, 174, 96, 192, 143, 196, 95, 150, 135, 24, 27, 79, 223, 198, 37, 189, 26, 117, 63, 167, 57, 127, 237, 117];
    let pub_key_y = [53, 71, 241, 28, 168, 105, 102, 70, 242, 243, 172, 176, 142, 49, 1, 106, 250, 194, 62, 99, 12, 93, 17, 245, 159, 97, 254, 245, 123, 13, 42, 165];
    let signature = [57, 17, 112, 239, 241, 30, 64, 157, 170, 50, 85, 145, 156, 69, 226, 85, 147, 164, 10, 82, 71, 93, 42, 132, 200, 220, 161, 255, 95, 241, 211, 141, 81, 7, 150, 25, 25, 27, 162, 213, 80, 61, 12, 170, 50, 4, 154, 203, 252, 229, 119, 29, 202, 153, 50, 25, 126, 145, 245, 23, 136, 75, 29, 177];

    let valid_signature = std::ecdsa_secp256k1::verify_signature(pub_key_x, pub_key_y, signature, hashed_message);
    assert(valid_signature);
}
