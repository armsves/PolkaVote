import { UltraHonkBackend } from '@aztec/bb.js';
import { Noir, type CompiledCircuit } from '@noir-lang/noir_js';
import rawCircuit from "../../../homomorphic_voting_circuit/target/circuit.json";
import { keccak256, recoverPublicKey } from 'viem';

export async function generateNoirProof({
    proposalId,
    address,
    is_upvote,
    signMessageAsync,
}: {
    proposalId: number;
    address: string;
    is_upvote: boolean;
    signMessageAsync: (args: { message: string }) => Promise<string>;
}) {
    const compiledCircuit = rawCircuit as unknown as CompiledCircuit;
    const noir = new Noir(compiledCircuit);
    const backend = new UltraHonkBackend(compiledCircuit.bytecode);

    const timestamp = (0n).toString();
    //const proposalId = 0;
    const userId = 0;
    const message = `${timestamp},${proposalId},${address},${userId},${is_upvote}`;
    const signature = await signMessageAsync({ message });
    const sigBytesFull = Buffer.from(signature.slice(2), "hex");
    const signatureBytes = Array.from(sigBytesFull.slice(0, 64));
    const messageHex = Buffer.from(message, "hex");
    const hashed = keccak256(messageHex);
    const pubkey = await recoverPublicKey({ hash: hashed, signature });
    const pubKeyHex = Array.from(Buffer.from(pubkey.replace(/^0x/, ""), "hex"));
    const uncompressed = pubKeyHex.slice(1);
    const x = uncompressed.slice(0, 32);
    const y = uncompressed.slice(32, 64);
    let hashHex = Array.from(Buffer.from(hashed.replace(/^0x/, ""), "hex"));

    const input = {
        public_key_x: x,
        public_key_y: y,
        is_upvote,
        message_hash: hashHex,
        signature: signatureBytes,
    };

    const { witness } = await noir.execute(input);
    const proofData = await backend.generateProof(witness);
    const isValid = await backend.verifyProof(proofData);

    return { witness, proofData, isValid };
}