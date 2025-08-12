import { randomBytes } from 'crypto';
import { UltraHonkBackend, } from "@aztec/bb.js";
import inscriptionCircuit from '../../open_vote_network_circuits/inscription/target/inscription.json';
import votingCircuit from "../../open_vote_network_circuits/voting/target/voting.json";
import { Noir } from "@noir-lang/noir_js";
import { CompiledCircuit, InputMap } from '@noir-lang/types';


export type Hex = `0x${string}`;

interface InscriptionInputs{
  // Privatge Inputs
  random_value: string,

  // Public Inputs
  generator: string,    
  encrypted_random_value: string
}

interface VotingInputs{
  vote_degree: string,
  public_generator: string,    
  encrypted_vote: string
}

// const FIELD_BYTE_LEN: number = 32;
const BYTES32_HEX_LEN = 64;

export function u8ToHex(u8: Uint8Array): `0x${string}` {
  const hex = Array.from(u8, b => b.toString(16).padStart(2, '0')).join('');
  return (`0x${hex}`) as `0x${string}`;
}

function bytesToBigInt(bytes: Uint8Array): bigint {
  const hex = '0x' + Array.from(bytes, (b: number) => b.toString(16).padStart(2, '0')).join('');
  return BigInt(hex);
}

function toBytes32(value: bigint | number | string): Hex {
  const v = BigInt(value);
  if (v < 0n) throw new Error('toBytes32: negative values not supported');
  const hex = v.toString(16).padStart(BYTES32_HEX_LEN, '0');
  return (`0x${hex}`) as Hex;
}

export class CryptoMath {
    public generator: bigint = 3n; 
    public generatorBytes: string = toBytes32(this.generator);
    public FIELD: bigint =
  21888242871839275222246405745257275088548364400416034343698204186575808495617n;

  private static _instance: CryptoMath | undefined;
  private constructor() {}
  static get instance(): CryptoMath {
    if (!this._instance) this._instance = new CryptoMath();
    return this._instance;
  }

  getRandomValue(): bigint {
    // let x: bigint = (2n ** 32n -1n);
    // TODO: change to 32
    const buf: Uint8Array = randomBytes(4);
    let x: bigint = bytesToBigInt(buf) % this.FIELD;
    return x;
  }

  modExp(
    base: bigint | number | string,
    exponent: bigint | number | string,
  ): bigint {
    let b = BigInt(base) % this.FIELD;
    let e = BigInt(exponent);
    if (e < 0n) throw new Error('modExp: negative exponent not supported');

    let result: bigint = 1n;
    while (e > 0n) {
      if (e & 1n) result = (result * b) % this.FIELD;
      b = (b * b) % this.FIELD;
      e >>= 1n;
    }
    return result;
  }

  modMul(
    a: bigint | number | string,
    b: bigint | number | string,
  ): bigint {
    return BigInt(a) * BigInt(b) % this.FIELD;
  }

  toBytes32(value: bigint | number | string): Hex {
    return toBytes32(value);
  }

  generateEmptyProof(): Hex {
    return '0x';
  }

  async generateInscriptionProof(random_value: string,
     encrypted_random_value: string,
     showLog:(content: string) => void): Promise<{ proof: Uint8Array, publicInputs: string[] }> {
        try {
            const noir = new Noir(inscriptionCircuit as CompiledCircuit);
            const honk = new UltraHonkBackend(inscriptionCircuit.bytecode, { threads: 1 });
            const inputs: InscriptionInputs = { random_value, generator: this.generatorBytes, encrypted_random_value };

            showLog("Generating witness... ⏳");
            console.log(`With inputs: ${JSON.stringify(inputs)}`)
            const { witness } = await noir.execute(inputs as unknown as InputMap);
            showLog("Generated witness... ✅");

            showLog("Generating proof... ⏳");
            const { proof, publicInputs } = await honk.generateProof(witness, { keccak: true });
            const offChainProof = await honk.generateProof(witness);
            showLog("Generated proof... ✅");
            showLog("Verifying proof... ⏳");
            const isValid = await honk.verifyProof(offChainProof);
            showLog(`Proof is valid: ${isValid} ✅`);

            return { proof, publicInputs };
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async generateVotingProof(vote: string,
        encrypted_vote: string,
        showLog:(content: string) => void): Promise<{ proof: Uint8Array, publicInputs: string[] }> {
        try {
            const noir = new Noir(votingCircuit as CompiledCircuit);
            const honk = new UltraHonkBackend(votingCircuit.bytecode, { threads: 1 });
            const inputs: VotingInputs = { vote_degree: vote, public_generator: this.generatorBytes, encrypted_vote };

            showLog("Generating witness... ⏳");
            console.log(`With inputs: ${JSON.stringify(inputs)}`)
            const { witness } = await noir.execute(inputs as unknown as InputMap);
            showLog("Generated witness... ✅");

            showLog("Generating proof... ⏳");
            const { proof, publicInputs } = await honk.generateProof(witness, { keccak: true });
            const offChainProof = await honk.generateProof(witness);
            showLog("Generated proof... ✅");
            showLog("Verifying proof... ⏳");
            const isValid = await honk.verifyProof(offChainProof);
            showLog(`Proof is valid: ${isValid} ✅`);

            return { proof, publicInputs };
        } catch (error) {
            console.log(error);
            throw error;
        }
    }
}

export default CryptoMath.instance;

export function getRandomValue(): bigint {
  return CryptoMath.instance.getRandomValue();
}

export function modExp(
  base: bigint | number | string,
  exponent: bigint | number | string,
): bigint {
  return CryptoMath.instance.modExp(base, exponent);
}

export function modMul(
  a: bigint | number | string,
  b: bigint | number | string,
): bigint {
  return CryptoMath.instance.modMul(a, b);
}

export function generateEmptyProof(): Hex {
  return CryptoMath.instance.generateEmptyProof();
}

export async function  generateInscriptionProof(random_value: string, encrypted_random_value: string, showLog:(content: string) => void): Promise<{ proof: Uint8Array, publicInputs: string[] }> {
  return CryptoMath.instance.generateInscriptionProof(random_value, encrypted_random_value, showLog);
}

export async function  generateVotingProof(vote: string, encrypted_vote: string, showLog:(content: string) => void): Promise<{ proof: Uint8Array, publicInputs: string[] }> {
  return CryptoMath.instance.generateVotingProof(vote, encrypted_vote, showLog);
}

export function bigIntToBytes32(value: bigint | number | string): Hex {
  return CryptoMath.instance.toBytes32(value);
}
