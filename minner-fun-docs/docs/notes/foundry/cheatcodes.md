# Foundry Cheatcodes

Cheatcodes give you powerful testing utilities to manipulate the state of the EVM, mock data, and more.

## What are Cheatcodes?

Cheatcodes are special functions exposed by the `vm` object in Foundry tests. They allow you to manipulate the blockchain state, mock calls, and perform other testing operations that would be impossible in production.

## Common Cheatcodes

### Time Manipulation

#### `vm.warp(uint256)`
Set `block.timestamp` to a specific value:

```solidity
vm.warp(1641070800); // Set to Jan 2, 2022
```

#### `vm.roll(uint256)`
Set `block.number` to a specific value:

```solidity
vm.roll(123456);
```

### Account Manipulation

#### `vm.prank(address)`
Perform the next call as a different address:

```solidity
vm.prank(alice);
token.transfer(bob, 100); // This call comes from alice
```

#### `vm.startPrank(address)`
All subsequent calls come from the specified address until `vm.stopPrank()`:

```solidity
vm.startPrank(alice);
token.approve(spender, 100);
token.transfer(bob, 50);
vm.stopPrank();
```

#### `vm.deal(address, uint256)`
Set the ETH balance of an address:

```solidity
vm.deal(alice, 100 ether);
```

### Expectations

#### `vm.expectRevert()`
Expect the next call to revert:

```solidity
vm.expectRevert("Insufficient balance");
token.transfer(bob, 1000);
```

#### `vm.expectEmit()`
Expect an event to be emitted:

```solidity
vm.expectEmit(true, true, false, true);
emit Transfer(alice, bob, 100);
token.transfer(bob, 100);
```

### Mocking

#### `vm.mockCall(address, bytes, bytes)`
Mock the return data of a call:

```solidity
vm.mockCall(
    address(oracle),
    abi.encodeWithSelector(Oracle.getPrice.selector),
    abi.encode(100)
);
```

## Example Test

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/Token.sol";

contract TokenTest is Test {
    Token token;
    address alice = address(1);
    address bob = address(2);

    function setUp() public {
        token = new Token();
        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
    }

    function testTransfer() public {
        vm.prank(alice);
        token.transfer(bob, 100);
        
        assertEq(token.balanceOf(bob), 100);
    }

    function testRevertInsufficientBalance() public {
        vm.expectRevert("Insufficient balance");
        vm.prank(alice);
        token.transfer(bob, 1000);
    }
}
```

## Best Practices

1. **Use `setUp()`**: Initialize your test state in the `setUp()` function
2. **Clear pranks**: Always use `vm.stopPrank()` after `vm.startPrank()`
3. **Test edge cases**: Use cheatcodes to test boundary conditions
4. **Document complex setups**: Comment your cheatcode usage for clarity

## Resources

- [Cheatcodes Reference](https://book.getfoundry.sh/cheatcodes/)
- [Forge Standard Library](https://book.getfoundry.sh/reference/forge-std/)

