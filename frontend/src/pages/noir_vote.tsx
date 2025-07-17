'use client';

import { UltraHonkBackend } from '@aztec/bb.js';
import { Noir, type CompiledCircuit } from '@noir-lang/noir_js';
import rawCircuit from "../../../voting_circuit/target/circuit.json";
import { useState } from "react";
import { useAccount, useSignMessage } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { recoverPublicKey } from 'viem';
import { keccak256 } from 'viem';


export default function NoirVoteApp() {
  const [logs, setLogs] = useState<string[]>([]);
  const [results, setResults] = useState<string[]>([]);
  const [witness, setWitness] = useState<string[]>([]);
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const show = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    content: string
  ) => setter((prev) => [...prev, content]);

  const generateProof = async (is_upvote: boolean) => {
    if (!address) {
      show(setLogs, "❌ Wallet not connected.");
      return;
    }

    try {
      const compiledCircuit = rawCircuit as unknown as CompiledCircuit;
      const noir = new Noir(compiledCircuit);
      const backend = new UltraHonkBackend(compiledCircuit.bytecode);

      const timestamp = (BigInt(Date.now()) * 1000000n).toString();
      // TODO: Get proposal id from page
      const proposalId = 0;
      // TODO: Get user id from page
      const userId = 0;
      // [u8; 20]          
      const message = `${timestamp},${proposalId},${address},${userId},${is_upvote}`;
      // Sign Message
      const result = await getSignatureAndPublicKey(message, signMessageAsync);

      if (result) {
        const { publicKeyX, publicKeyY, message, signatureBytes } = result;

        const input = {
          public_key_x: publicKeyX,
          public_key_y: publicKeyY,
          is_upvote,
          message_hash: message,
          signature: signatureBytes,
        };

        // Generate Witness
        const { witness } = await noir.execute(input);
        setWitness([JSON.stringify(witness)]);
        show(setLogs, `Generated witness ✅`);

        // Prove witeness/message constraints
        const proof = await backend.generateProof(witness);
        show(setLogs, `Generated proof ✅`);

        const proofString = Buffer.from(proof.proof).toString("base64");
        setResults([proofString]);
      }
    } catch (e) {
      show(setLogs, "❌ Error");
      show(setLogs, `${e}`);
      console.error(e);
    }
  };

  
  const getSignatureAndPublicKey = async (
  message: string,
  signMessageAsync: ReturnType<typeof useSignMessage>["signMessageAsync"]
) => {
    if (!isConnected || !address) {
      console.error("❌ Wallet not connected");
      return;
    }

    try {
      const signature = await signMessageAsync({ message });
      
      const sigBytesFull = Buffer.from(signature.slice(2), "hex"); // 65 bytes
      const signatureBytes = Array.from(sigBytesFull.slice(0, 64));

      const messageHex = Buffer.from(message, "hex");
      show(setLogs, `message: ${message}`);
      
      const hashed = keccak256(messageHex);
      show(setLogs, `hashed: ${hashed}`);
      
      const pubkey = await recoverPublicKey({ hash: hashed, signature });
      const pubKeyHex = Array.from(Buffer.from(pubkey.replace(/^0x/, ""), "hex"));
     

      const uncompressed = pubKeyHex.slice(1); // drop 0x04 prefix
      const x = uncompressed.slice(0, 32);
      const y = uncompressed.slice(32, 64);
      
      show(setLogs, (`x ${x}`));
      show(setLogs, (`x l ${x.length}`));
      show(setLogs, (`y ${y}`));
      show(setLogs, (`y l ${y.length}`));

      let hashHex = Array.from(Buffer.from(hashed.replace(/^0x/, ""), "hex"));

      return {
        publicKeyX: x,
        publicKeyY: y,
        message: hashHex,
        signatureBytes,
      };
    } catch (err) {
      console.error("Error signing or recovering:", err);
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Noir Voting Proof</h1>

      <div style={{ marginBottom: "1rem" }}>
        <ConnectButton />
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <button
          onClick={() => generateProof(true)}
          disabled={!isConnected}
          style={{ marginRight: "1rem" }}
        >
          ✅ Vote Yay
        </button>
        <button
          onClick={() => generateProof(false)}
          disabled={!isConnected}
        >
          ❌ Vote Nay
        </button>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ flex: 1, border: "1px solid black", padding: "10px" }}>
          <h2>Logs</h2>
          {logs.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
        <div style={{ flex: 1, border: "1px solid black", padding: "10px" }}>
          <h2>Proof</h2>
          {results.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
        <div style={{ flex: 1, border: "1px solid black", padding: "10px" }}>
          <h2>Witness</h2>
          {witness.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
