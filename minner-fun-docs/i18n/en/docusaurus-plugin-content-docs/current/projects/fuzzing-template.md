# Fuzzing Template

A practical template for fuzzing smart contracts using Foundry.

## Overview

Fuzzing (or property-based testing) automatically generates random inputs to test your contracts against invariants.

## Project Structure

```
fuzzing-template/
├── src/
│   ├── Token.sol
│   └── Vault.sol
├── test/
│   ├── Token.t.sol
│   ├── TokenFuzz.t.sol
│   └── VaultInvariant.t.sol
└── foundry.toml
```

## Configuration

### foundry.toml

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]

[fuzz]
runs = 1000
max_test_rejects = 100000

[invariant]
runs = 256
depth = 15
fail_on_revert = true
```

## Fuzzing Tests

### Basic Fuzzing

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/Token.sol";

contract TokenFuzzTest is Test {
    Token token;
    
    function setUp() public {
        token = new Token("Test", "TST", 1000000);
    }
    
    /// forge-config: default.fuzz.runs = 10000
    function testFuzzTransfer(address to, uint256 amount) public {
        // Assume valid inputs
        vm.assume(to != address(0));
        vm.assume(to != address(this));
        vm.assume(amount <= token.balanceOf(address(this)));
        
        uint256 balanceBefore = token.balanceOf(address(this));
        
        token.transfer(to, amount);
        
        // Invariants
        assertEq(
            token.balanceOf(address(this)),
            balanceBefore - amount
        );
        assertEq(token.balanceOf(to), amount);
    }
}
```

### Invariant Testing

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/Vault.sol";

contract VaultHandler is Test {
    Vault public vault;
    address[] public actors;
    
    constructor(Vault _vault) {
        vault = _vault;
    }
    
    function deposit(uint256 actorIndex, uint256 amount) public {
        actorIndex = bound(actorIndex, 0, actors.length - 1);
        amount = bound(amount, 0, 1000 ether);
        
        address actor = actors[actorIndex];
        vm.deal(actor, amount);
        
        vm.prank(actor);
        vault.deposit{value: amount}();
    }
    
    function withdraw(uint256 actorIndex, uint256 amount) public {
        actorIndex = bound(actorIndex, 0, actors.length - 1);
        address actor = actors[actorIndex];
        
        uint256 balance = vault.balanceOf(actor);
        amount = bound(amount, 0, balance);
        
        vm.prank(actor);
        vault.withdraw(amount);
    }
}

contract VaultInvariantTest is Test {
    Vault vault;
    VaultHandler handler;
    
    function setUp() public {
        vault = new Vault();
        handler = new VaultHandler(vault);
        
        // Add actors
        handler.actors().push(address(0x1));
        handler.actors().push(address(0x2));
        handler.actors().push(address(0x3));
        
        // Target handler for invariant testing
        targetContract(address(handler));
    }
    
    /// forge-config: default.invariant.runs = 256
    /// forge-config: default.invariant.depth = 15
    function invariant_totalSupplyEqualsBalance() public {
        assertEq(
            vault.totalSupply(),
            address(vault).balance
        );
    }
    
    function invariant_userBalancesLessThanTotal() public {
        for (uint i = 0; i < handler.actors().length; i++) {
            address actor = handler.actors(i);
            assertLe(
                vault.balanceOf(actor),
                vault.totalSupply()
            );
        }
    }
}
```

## Best Practices

### 1. Use `bound()` for Range Constraints

```solidity
function testFuzz(uint256 x) public {
    x = bound(x, 1, 100); // Constrain to [1, 100]
    // ...
}
```

### 2. Use `vm.assume()` for Preconditions

```solidity
function testFuzz(address user) public {
    vm.assume(user != address(0));
    vm.assume(user.code.length == 0);
    // ...
}
```

### 3. Create Handler Contracts

Handler contracts wrap your protocol and provide bounded random actions for invariant testing.

### 4. Define Clear Invariants

Good invariants:
- Total supply equals sum of balances
- Contract balance is greater than or equal to total deposits
- User balance is less than or equal to total supply

### 5. Use Ghost Variables

Track additional state in your handler:

```solidity
contract Handler {
    uint256 public ghost_depositSum;
    uint256 public ghost_withdrawSum;
    
    function deposit(uint256 amount) public {
        // ...
        ghost_depositSum += amount;
    }
}
```

## Running Fuzzing Tests

```bash
# Run fuzzing tests
forge test --match-contract Fuzz

# Run invariant tests
forge test --match-contract Invariant

# Verbose output
forge test --match-contract Invariant -vvvv

# With gas reporting
forge test --match-contract Fuzz --gas-report
```

## Interpreting Results

### Success
```
Test result: ok. 1000 passed
```

### Failure
```
Failing test:
  testFuzzTransfer(address,uint256)
  
Counterexample:
  to=0x0000000000000000000000000000000000000000
  amount=1
```

## Advanced Techniques

### Dictionary-based Fuzzing

```solidity
address[] public dictionary = [
    address(0),
    address(this),
    address(token)
];

function testFuzz(uint256 index) public {
    address target = dictionary[bound(index, 0, dictionary.length - 1)];
    // ...
}
```

### Stateful Fuzzing

Maintain state across fuzz runs to test complex scenarios.

## Resources

- [Foundry Fuzzing Guide](https://book.getfoundry.sh/forge/fuzz-testing)
- [Invariant Testing](https://book.getfoundry.sh/forge/invariant-testing)
- [Trail of Bits Testing Guide](https://secure-contracts.com/)

