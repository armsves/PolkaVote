import { Barretenberg, Fr } from "@aztec/bb.js";

const BLINDING_FACTOR = 420;

async function gmPc(): Promise<void> {
    const bb: Barretenberg = await Barretenberg.new();
    const buffer = new ArrayBuffer(8);
    const buf = new DataView(buffer, 0);
    buf.setInt8(1, 42);
    var uint8array = new Uint8Array(buf.buffer);
    bb.pedersenCommit([Fr.fromBuffer(uint8array)], BLINDING_FACTOR);
}

console.log(await gmPc());

