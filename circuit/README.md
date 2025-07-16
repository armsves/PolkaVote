# Circuits
This document provide the very benefical info inorder to operate around NoirJs and verifier smart contract generation.

## Compile
```bash
nargo compile
```

Make sure you have Rust install on your machine.

Install `Barratengern`, use can find the instruction [here](https://github.com/AztecProtocol/aztec-packages/blob/master/barretenberg/bbup/README.md) 

Generate the verification key. You need to pass the `--oracle_hash keccak` flag when generating vkey and proving to instruct bb to use keccak as the hash function, which is more optimal in Solidity
``` bash
bb write_vk -b ./target/circuit.json -o ./target --oracle_hash keccak
```

For detailed instruction of the circuit compilation and solidity generatation, please checkout the following [docs](https://noir-lang.org/docs/how_to/how-to-solidity-verifier).


Generate the Solidity verifier from the vkey
``` bash
bb write_solidity_verifier -k ./target/vk -o ./target/Verifier.sol
```


<!-- nargo execute <witness-name> -->
bb prove -b ./target/circuit.json -w ./target/age -o ./target --oracle_hash keccak --output_format bytes_and_fields