# 12、Introduction to Foundry

Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.

## What is Foundry?

Foundry consists of:

- **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools).
- **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data.
- **Anvil**: Local Ethereum node, akin to Ganache, Hardhat Network.
- **Chisel**: Fast, utilitarian, and verbose solidity REPL.

## Why Foundry?

### Speed
Foundry is written in Rust and runs tests significantly faster than JavaScript-based frameworks.

### Testing in Solidity
Write your tests in Solidity instead of JavaScript. This allows you to:
- Test your contracts in the same language they're written in
- Get better type safety
- Avoid context switching between languages

### Advanced Features
- Fuzzing
- Symbolic execution
- Gas snapshots
- Coverage reports

## Installation

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

## Quick Start

Create a new project:

```bash
forge init my-project
cd my-project
forge build
forge test
```

## Resources

- [Official Documentation](https://book.getfoundry.sh/)
- [GitHub Repository](https://github.com/foundry-rs/foundry)
- [Community Discord](https://discord.gg/foundry)

