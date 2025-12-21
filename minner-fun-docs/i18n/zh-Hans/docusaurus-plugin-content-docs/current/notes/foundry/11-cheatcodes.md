# 11、Foundry Cheatcodes

Cheatcodes 为您提供强大的测试工具来操纵 EVM 状态、模拟数据等。

## 什么是 Cheatcodes？

Cheatcodes 是 Foundry 测试中 `vm` 对象暴露的特殊函数。它们允许您操纵区块链状态、模拟调用以及执行在生产环境中不可能的其他测试操作。

## 常用 Cheatcodes

### 时间操作

#### `vm.warp(uint256)`
将 `block.timestamp` 设置为特定值：

```solidity
vm.warp(1641070800); // 设置为 2022 年 1 月 2 日
```

#### `vm.roll(uint256)`
将 `block.number` 设置为特定值：

```solidity
vm.roll(123456);
```

### 账户操作

#### `vm.prank(address)`
以不同地址执行下一次调用：

```solidity
vm.prank(alice);
token.transfer(bob, 100); // 此调用来自 alice
```

#### `vm.startPrank(address)`
所有后续调用都来自指定地址，直到 `vm.stopPrank()`：

```solidity
vm.startPrank(alice);
token.approve(spender, 100);
token.transfer(bob, 50);
vm.stopPrank();
```

#### `vm.deal(address, uint256)`
设置地址的 ETH 余额：

```solidity
vm.deal(alice, 100 ether);
```

### 预期断言

#### `vm.expectRevert()`
预期下一次调用会回滚：

```solidity
vm.expectRevert("Insufficient balance");
token.transfer(bob, 1000);
```

#### `vm.expectEmit()`
预期触发某个事件：

```solidity
vm.expectEmit(true, true, false, true);
emit Transfer(alice, bob, 100);
token.transfer(bob, 100);
```

### 模拟

#### `vm.mockCall(address, bytes, bytes)`
模拟调用的返回数据：

```solidity
vm.mockCall(
    address(oracle),
    abi.encodeWithSelector(Oracle.getPrice.selector),
    abi.encode(100)
);
```

## 测试示例

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

## 最佳实践

1. **使用 `setUp()`**：在 `setUp()` 函数中初始化测试状态
2. **清除 pranks**：在 `vm.startPrank()` 后始终使用 `vm.stopPrank()`
3. **测试边界情况**：使用 cheatcodes 测试边界条件
4. **记录复杂设置**：为 cheatcode 的使用添加注释以提高清晰度

## 资源

- [Cheatcodes 参考](https://book.getfoundry.sh/cheatcodes/)
- [Forge 标准库](https://book.getfoundry.sh/reference/forge-std/)

