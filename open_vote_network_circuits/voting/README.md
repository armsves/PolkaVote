# Noir Panagram

# Forge Dependencies Setup
``` bash
forge install openzeppelin/openzeppelin-contracts
```

``` bash
forge remappings > remappings.txt
```

## Verifier Generation
From `voting` directory run:

1. Build the the Nargo files
``` bash 
nargo build
```

2. Generate verification keys:
``` bash
bb write_vk --oracle_hash keccak -b ./target/voting.json -o ./target
```

3. Generate a Solidity Verifier:
``` bash
bb write_solidity_verifier -k ./target/vk -o ../verifier_contracts/VotingVerifier.sol
```

## Dependencies
Ensure that the specific version of Nargo is install on the running machine:
``` bash
nargo --version
nargo version = 1.0.0-beta.6
noirc version = 1.0.0-beta.6+e796dfd67726cbc28eb9991782533b211025928d
(git version hash: e796dfd67726cbc28eb9991782533b211025928d, is dirty: false)
```

Ensure that the specific version of bb (berratenberg) is installed on the running machine
``` bash
bb --version
0.84.0
```


## Deployment
```bash
forge script script/DeployVotingSystem.s.sol:DeployVotingSystem \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  -vvvv
```

``` bash
forge script script/DeployPanagram.s.sol:DeployPanagram \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --optimize true \
  --optimizer-runs 200
```