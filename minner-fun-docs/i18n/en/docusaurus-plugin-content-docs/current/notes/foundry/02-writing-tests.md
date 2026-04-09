# 2、Writing Tests

Learn how to write effective tests for your smart contracts using Foundry.

## Test Contract Structure

A typical test contract follows this structure:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test, console} from "forge-std/Test.sol";
import {MyContract} from "../src/MyContract.sol";

contract MyContractTest is Test {
    MyContract public myContract;
    address public user1;
    address public user2;

    function setUp() public {
        // Setup runs before each test
        myContract = new MyContract();
        user1 = address(0x1);
        user2 = address(0x2);
    }

    function test_BasicFunctionality() public {
        // Test implementation
    }
}
```

## Assertion Functions

Foundry provides various assertion functions through `forge-std/Test.sol`:

### Equality Assertions

```solidity
// Assert equality
assertEq(a, b);
assertEq(a, b, "Custom error message");

// Assert inequality
assertNotEq(a, b);

// For approximate equality (useful for decimals)
assertApproxEqAbs(a, b, maxDelta);
assertApproxEqRel(a, b, maxPercentDelta);
```

### Boolean Assertions

```solidity
// Assert true/false
assertTrue(condition);
assertFalse(condition);
```

### Greater Than / Less Than

```solidity
assertGt(a, b);  // a > b
assertGe(a, b);  // a >= b
assertLt(a, b);  // a < b
assertLe(a, b);  // a <= b
```

## Test Types and Patterns

### Unit Tests

Test individual functions in isolation:

```solidity
function test_Transfer() public {
    token.mint(user1, 100);
    
    vm.prank(user1);
    token.transfer(user2, 50);
    
    assertEq(token.balanceOf(user1), 50);
    assertEq(token.balanceOf(user2), 50);
}
```

### Integration Tests

Test multiple contracts working together:

```solidity
function test_SwapOnUniswap() public {
    // Setup multiple contracts
    token1.approve(address(router), 100);
    router.swapExactTokensForTokens(...);
    // Assert final state
}
```

### Fuzz Tests

Test with random inputs:

```solidity
function testFuzz_Transfer(uint256 amount) public {
    vm.assume(amount <= token.totalSupply());
    
    token.mint(user1, amount);
    vm.prank(user1);
    token.transfer(user2, amount);
    
    assertEq(token.balanceOf(user2), amount);
}
```

## Error Handling and Reverts

### Testing Expected Reverts

```solidity
function test_RevertWhen_InsufficientBalance() public {
    vm.expectRevert("Insufficient balance");
    token.transfer(user2, 1000);
}

// With custom errors
function test_RevertWhen_Unauthorized() public {
    vm.expectRevert(Unauthorized.selector);
    myContract.adminFunction();
}
```

### Testing Require Statements

```solidity
function test_RequireValidInput() public {
    vm.expectRevert("Invalid input");
    myContract.setNumber(0);
}
```

## Event Testing

### Basic Event Testing

```solidity
function test_EmitsTransferEvent() public {
    // Tell Foundry which event to expect
    vm.expectEmit(true, true, false, true);
    
    // Emit the expected event
    emit Transfer(user1, user2, 100);
    
    // Call the function that should emit the event
    token.transfer(user2, 100);
}
```

### Multiple Events

```solidity
function test_EmitsMultipleEvents() public {
    vm.expectEmit(true, true, false, true);
    emit Approval(user1, address(router), 100);
    
    vm.expectEmit(true, true, false, true);
    emit Transfer(user1, user2, 50);
    
    // Function that emits both events
    token.approveAndTransfer(address(router), 100, user2, 50);
}
```

## Cheatcodes for Testing

### Manipulating State

```solidity
// Change msg.sender for next call
vm.prank(user1);
myContract.doSomething();

// Change msg.sender for all subsequent calls
vm.startPrank(user1);
myContract.doSomething();
myContract.doSomethingElse();
vm.stopPrank();

// Deal ETH to address
vm.deal(user1, 10 ether);

// Set contract storage
vm.store(address(token), slot, value);
```

### Time Manipulation

```solidity
// Set block timestamp
vm.warp(1641070800);

// Increase time
vm.warp(block.timestamp + 1 days);

// Set block number
vm.roll(12345678);
```

### Mocking Calls

```solidity
// Mock a call to a contract
vm.mockCall(
    address(oracle),
    abi.encodeWithSelector(Oracle.getPrice.selector),
    abi.encode(1000)
);
```

## Test Organization

### Using setUp for Common Setup

```solidity
function setUp() public {
    // Common setup for all tests
    token = new Token();
    user1 = makeAddr("user1");
    user2 = makeAddr("user2");
    
    vm.deal(user1, 100 ether);
    vm.deal(user2, 100 ether);
}
```

### Helper Functions

```solidity
function _mintAndApprove(address user, uint256 amount) internal {
    token.mint(user, amount);
    vm.prank(user);
    token.approve(address(this), amount);
}

function test_WithHelper() public {
    _mintAndApprove(user1, 100);
    // Continue test
}
```

### Test Modifiers

```solidity
modifier funded(address user) {
    vm.deal(user, 100 ether);
    _;
}

function test_WithModifier() public funded(user1) {
    // user1 now has 100 ETH
}
```

## Advanced Patterns

### Testing Access Control

```solidity
function test_OnlyOwnerCanCall() public {
    vm.prank(owner);
    myContract.adminFunction();  // Should succeed
    
    vm.prank(user1);
    vm.expectRevert("Not owner");
    myContract.adminFunction();  // Should fail
}
```

### Testing State Transitions

```solidity
function test_StateTransition() public {
    assertEq(uint(myContract.state()), uint(State.Pending));
    
    myContract.start();
    assertEq(uint(myContract.state()), uint(State.Active));
    
    myContract.complete();
    assertEq(uint(myContract.state()), uint(State.Completed));
}
```

### Snapshot and Revert

```solidity
function test_WithSnapshot() public {
    uint256 snapshot = vm.snapshot();
    
    // Make some state changes
    myContract.doSomething();
    assertEq(myContract.value(), 100);
    
    // Revert to snapshot
    vm.revertTo(snapshot);
    assertEq(myContract.value(), 0);
}
```

## Best Practices

1. **Test One Thing**: Each test should verify one specific behavior
2. **Clear Names**: Use descriptive test names like `test_RevertWhen_InsufficientBalance`
3. **Arrange-Act-Assert**: Structure tests clearly
4. **Use setUp**: Put common setup in `setUp()` function
5. **Test Edge Cases**: Don't just test happy paths
6. **Add Comments**: Explain complex test logic

## Next Steps

- [Advanced Testing](./03-advanced-testing.md) - Learn about fuzzing and invariant testing
- [Debugging Tools](./04-debugging-tools.md) - Master debugging techniques
- [Best Practices](./05-best-practices.md) - Learn testing best practices

## References

- [Forge Standard Library](https://github.com/foundry-rs/forge-std)
- [Foundry Cheatcodes](https://book.getfoundry.sh/cheatcodes/)

