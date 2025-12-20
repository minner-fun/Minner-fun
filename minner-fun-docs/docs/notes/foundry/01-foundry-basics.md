# Foundry Basics Guide

## What is Foundry?

Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust. It consists of four main components:

- **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools)
- **Cast**: Swiss army knife for interacting with EVM smart contracts
- **Anvil**: Local Ethereum node (akin to Ganache, Hardhat Network)
- **Chisel**: Fast, utilitarian, and verbose Solidity REPL

## Installing Foundry

### Installation on Windows

1. **Using Foundryup (Recommended)**:
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

2. **Using Scoop**:
```bash
scoop install foundry
```

3. **Build from Source**:
```bash
git clone https://github.com/foundry-rs/foundry
cd foundry
cargo install --path ./cli --bins --locked
```

### Verify Installation

```bash
forge --version
cast --version
anvil --version
```

## Project Structure

Standard directory structure of a Foundry project:

```
my-project/
├── foundry.toml          # Foundry configuration file
├── src/                  # Contract source directory
│   └── Counter.sol
├── test/                 # Test files directory
│   └── Counter.t.sol
├── script/               # Deployment scripts directory
│   └── Counter.s.sol
├── lib/                  # Dependencies directory
│   └── forge-std/
└── out/                  # Compilation output directory
    └── Counter.sol/
        └── Counter.json
```

## Creating a New Project

```bash
# Create new project
forge init my-project
cd my-project

# Create project using template
forge init --template https://github.com/foundry-rs/forge-template my-project
```

## Basic Configuration

### foundry.toml Configuration File

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
test = "test"
cache_path = "cache"

# Compiler settings
solc = "0.8.19"
optimizer = true
optimizer_runs = 200
via_ir = false

# Test settings
verbosity = 2
fuzz = { runs = 256 }
invariant = { runs = 256, depth = 15 }

# Formatting settings
[fmt]
line_length = 120
tab_width = 4
bracket_spacing = true

# RPC endpoints
[rpc_endpoints]
mainnet = "https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_API_KEY}"
sepolia = "https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}"

# Etherscan API keys
[etherscan]
mainnet = { key = "${ETHERSCAN_API_KEY}" }
sepolia = { key = "${ETHERSCAN_API_KEY}" }
```

## Basic Commands

### Compilation

```bash
# Compile project
forge build

# Clean compilation cache
forge clean

# Check code format
forge fmt --check

# Format code
forge fmt
```

### Testing

```bash
# Run all tests
forge test

# Run specific test file
forge test --match-path test/Counter.t.sol

# Run specific test function
forge test --match-test test_Increment

# Show verbose output
forge test -vv

# Show gas report
forge test --gas-report

# Run coverage testing
forge coverage
```

### Dependency Management

```bash
# Install dependency
forge install OpenZeppelin/openzeppelin-contracts

# Update dependencies
forge update

# Remove dependency
forge remove openzeppelin-contracts
```

## Your First Test Contract

### Example Contract (src/Counter.sol)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Counter {
    uint256 public number;

    function setNumber(uint256 newNumber) public {
        number = newNumber;
    }

    function increment() public {
        number++;
    }
}
```

### Test Contract (test/Counter.t.sol)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test, console} from "forge-std/Test.sol";
import {Counter} from "../src/Counter.sol";

contract CounterTest is Test {
    Counter public counter;

    function setUp() public {
        counter = new Counter();
    }

    function test_Increment() public {
        counter.increment();
        assertEq(counter.number(), 1);
    }

    function testFuzz_SetNumber(uint256 x) public {
        counter.setNumber(x);
        assertEq(counter.number(), x);
    }
}
```

## Test Naming Conventions

Foundry uses specific naming conventions to identify tests:

1. **Test Functions**: Must start with `test`
   - `test_BasicFunction()`
   - `testRevert_InvalidInput()`
   - `testFuzz_RandomInput(uint256 x)`

2. **Test Files**: Usually end with `.t.sol`
   - `Counter.t.sol`
   - `Token.test.sol`

3. **Test Contracts**: Usually end with `Test`
   - `CounterTest`
   - `TokenTest`

## Environment Variables

Create a `.env` file to manage sensitive information:

```bash
# .env file
PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key
ALCHEMY_API_KEY=your_alchemy_api_key
```

Reference in foundry.toml:

```toml
[rpc_endpoints]
mainnet = "https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_API_KEY}"
```

## Common Issues

### 1. Compilation Errors

```bash
# Check Solidity version
forge --version

# Update foundry
foundryup

# Clean cache
forge clean
```

### 2. Test Failures

```bash
# Increase verbosity
forge test -vvv

# Run specific test
forge test --match-test test_specific_function -vvv
```

### 3. Dependency Issues

```bash
# Reinstall dependencies
forge install

# Check dependency versions
forge tree
```

## Next Steps

Now that you understand the basics of Foundry, you can learn:

1. [Writing Tests](./02-writing-tests.md) - Learn how to write effective tests
2. [Advanced Testing](./03-advanced-testing.md) - Master fuzzing, invariant testing, etc.
3. [Debugging Tools](./04-debugging-tools.md) - Learn debugging techniques and tools
4. [Best Practices](./05-best-practices.md) - Understand testing best practices

## References

- [Foundry Book](https://book.getfoundry.sh/) - Official documentation
- [Foundry GitHub](https://github.com/foundry-rs/foundry) - Source code and issue tracking
- [Forge Std](https://github.com/foundry-rs/forge-std) - Standard testing library

