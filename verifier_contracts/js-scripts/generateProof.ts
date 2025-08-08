import { Barretenberg, Fr, UltraHonkBackend } from "@aztec/bb.js";
import { ethers } from "ethers";
import { InputMap, Noir } from "@noir-lang/noir_js";

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// const circuitPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../circuits/target/noir_panagram.json");
const circuitPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)),
                     "../../open_vote_network_circuits/inscription/target/inscription.json");
const circuit = JSON.parse(fs.readFileSync(circuitPath, 'utf8'));


interface InscriptionInputs{
  // Privatge Inputs
  random_value: string,

  // Public Inputs
  generator: string,    
  encrypted_random_value: string
}

export default async function generateProof() {
  // Initialize Barretenberg
  const bb = await Barretenberg.new();

  // Get the inputs from the args
  const inputs = process.argv.slice(2);

  try {
    const noir = new Noir(circuit);
    const honk = new UltraHonkBackend(circuit.bytecode, { threads: 1 });

    const input: InscriptionInputs = {
      // Private Inputs
      random_value: inputs[0],
      // Public Inputs
      generator: inputs[1],
      encrypted_random_value: inputs[2],
    };
    
    const { witness } = await noir.execute(input as unknown as InputMap);

    const originalLog = console.log; // Save original
    // Override to silence all logs
    console.log = () => {};

    const { proof, publicInputs } = await honk.generateProof(witness, { keccak: true });
    const offChainProof = await honk.generateProof(witness);
    const isValid = await honk.verifyProof(offChainProof);
    // Restore original console.log
    console.log = originalLog;

    const res = ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes", "bytes32[]"],
        [proof, publicInputs]
      );
    return res;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

(async () => {
    generateProof()
    .then((res) => {
      process.stdout.write(res);
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
})();