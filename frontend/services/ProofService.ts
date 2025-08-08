import { UltraHonkBackend, } from "@aztec/bb.js";
// import circuit from "../../circuits/target/panagram.json";
// import circuit from "../../../circuits/target/noir_panagram.json";
import inscriptionCircuit from "../../open_vote_network_circuits/inscription/target/inscription.json";
import votingCircuit from "../../open_vote_network_circuits/voting/target/voting.json"
// @ts-ignore
import { Noir } from "@noir-lang/noir_js";

import { CompiledCircuit } from '@noir-lang/types'
import { InputMap, InputValue } from '@noir-lang/noirc_abi';;

import { ANSWER_HASH } from "./constants";

interface InscriptionInputs{
    public_generator: string,
    random_value: string,
    encrypted_random_value: string
}

interface VotingInputs {
    public_generator: string,
    vote_degree: string,
    encrypted_vote: string
}

async function generateVotingProof(inputs: VotingInputs): Promise<{ proof: Uint8Array, publicInputs: string[] }> {
    if (!isValidInputMap(inputs)) {
        throw new Error("Invalid inputs");
    }
    return await generateProof(inputs, votingCircuit as CompiledCircuit);
}

async function generateInscriptionProof(inputs: InscriptionInputs): Promise<{ proof: Uint8Array, publicInputs: string[] }> {
    if (!isValidInputMap(inputs)) {
        throw new Error("Invalid inputs");
    }
    return await generateProof(inputs, inscriptionCircuit as CompiledCircuit);
}

function isValidInputMap(input: any): input is InputMap {
  return typeof input === 'object' && input !== null && !Array.isArray(input);
}

async function generateProof(inputs: InputMap, circuit: CompiledCircuit): Promise<{ proof: Uint8Array, publicInputs: string[] }> {
  try {
    const noir = new Noir(circuit as CompiledCircuit);
    const honk = new UltraHonkBackend(circuit.bytecode, { threads: 1 });
    // const inputs = { guess_hash: guess, address: address, answer_double_hash: ANSWER_HASH };

    console.log("Generating witness... ⏳");
    console.log(`With inputs: ${JSON.stringify(inputs)}`)
    const { witness } = await noir.execute(inputs);
    console.log("Generated witness... ✅");

    console.log("Generating proof... ⏳");
    const { proof, publicInputs } = await honk.generateProof(witness, { keccak: true });
    const offChainProof = await honk.generateProof(witness);
    console.log("Generated proof... ✅");
    console.log("Verifying proof... ⏳");
    const isValid = await honk.verifyProof(offChainProof);
    console.log(`Proof is valid: ${isValid} ✅`);

    // no longer needed for bb:)
    // const cleanProof = proof.slice(4); // remove first 4 bytes (buffer size)
    return { proof, publicInputs };
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export { generateInscriptionProof, generateVotingProof}