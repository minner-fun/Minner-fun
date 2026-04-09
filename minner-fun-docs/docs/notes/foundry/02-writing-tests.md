# 2、编写测试用例指南

## 测试合约基础结构

### 基本模板

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test, console} from "forge-std/Test.sol";
import {YourContract} from "../src/YourContract.sol";

contract YourContractTest is Test {
    YourContract public yourContract;
    
    // 测试用户地址
    address public constant ALICE = address(0x1);
    address public constant BOB = address(0x2);
    address public constant CHARLIE = address(0x3);
    
    // 测试常量
    uint256 public constant INITIAL_BALANCE = 1000 ether;
    
    function setUp() public {
        // 部署合约
        yourContract = new YourContract();
        
        // 设置测试环境
        vm.deal(ALICE, INITIAL_BALANCE);
        vm.deal(BOB, INITIAL_BALANCE);
    }
    
    function test_BasicFunction() public {
        // 测试逻辑
    }
}
```

## 断言函数 (Assertions)

### 基本断言

```solidity
// 相等性断言
assertEq(a, b);                    // a == b
assertEq(a, b, "error message");   // 带错误消息

// 不等性断言
assertNotEq(a, b);                 // a != b

// 大小比较
assertGt(a, b);                    // a > b
assertGe(a, b);                    // a >= b
assertLt(a, b);                    // a < b
assertLe(a, b);                    // a <= b

// 布尔断言
assertTrue(condition);             // condition == true
assertFalse(condition);            // condition == false

// 近似相等（用于处理精度问题）
assertApproxEqAbs(a, b, maxDelta);     // |a - b| <= maxDelta
assertApproxEqRel(a, b, maxPercentDelta); // |a - b| <= max(a,b) * maxPercentDelta / 1e18
```

### 高级断言示例

```solidity
function test_ApproximateEquality() public {
    uint256 expected = 1000;
    uint256 actual = 999;
    
    // 绝对误差：允许 ±2 的误差
    assertApproxEqAbs(actual, expected, 2, "Values should be approximately equal");
    
    // 相对误差：允许 0.1% 的误差
    assertApproxEqRel(actual, expected, 0.001e18, "Values should be within 0.1%");
}
```

## 测试类型

### 1. 单元测试

测试单个函数的功能：

```solidity
function test_Deposit() public {
    uint256 amount = 100 ether;
    
    vm.prank(ALICE);
    vault.deposit(amount);
    
    assertEq(vault.balanceOf(ALICE), amount);
    assertEq(vault.totalSupply(), amount);
}
```

### 2. 集成测试

测试多个组件的交互：

```solidity
function test_DepositAndWithdraw() public {
    uint256 depositAmount = 100 ether;
    
    // 存款
    vm.prank(ALICE);
    vault.deposit(depositAmount);
    
    // 提取
    uint256 shares = vault.balanceOf(ALICE);
    vm.prank(ALICE);
    vault.withdraw(shares);
    
    assertEq(vault.balanceOf(ALICE), 0);
    assertEq(vault.totalSupply(), 0);
}
```

### 3. 边界测试

测试边界条件和异常情况：

```solidity
function test_ZeroDeposit() public {
    vm.prank(ALICE);
    vm.expectRevert("Amount must be greater than 0");
    vault.deposit(0);
}

function test_InsufficientBalance() public {
    address poorUser = address(0x999);
    
    vm.prank(poorUser);
    vm.expectRevert("ERC20: insufficient balance");
    vault.deposit(100 ether);
}
```

## 使用 vm 作弊码 (Cheatcodes)

### 身份模拟

```solidity
// 模拟特定地址调用
vm.prank(ALICE);
contract.someFunction();

// 模拟多次调用
vm.startPrank(ALICE);
contract.function1();
contract.function2();
vm.stopPrank();
```

### 时间操作

```solidity
// 设置时间戳
vm.warp(1641070800); // 2022-01-01 00:00:00 UTC

// 前进时间
vm.warp(block.timestamp + 365 days);

// 设置区块号
vm.roll(1000000);
```

### 余额和状态

```solidity
// 设置 ETH 余额
vm.deal(ALICE, 100 ether);

// 设置存储槽
vm.store(address(token), bytes32(uint256(0)), bytes32(uint256(1000)));

// 设置代码
vm.etch(address(0x123), bytecode);
```

### 期望行为

```solidity
// 期望 revert
vm.expectRevert();
contract.failingFunction();

// 期望特定 revert 消息
vm.expectRevert("Custom error message");
contract.failingFunction();

// 期望事件
vm.expectEmit(true, true, false, true);
emit Transfer(from, to, amount);
contract.transfer(to, amount);
```

## 测试模式

### 1. AAA 模式 (Arrange-Act-Assert)

```solidity
function test_Transfer() public {
    // Arrange - 准备测试数据
    uint256 amount = 100 ether;
    vm.deal(ALICE, amount);
    
    // Act - 执行操作
    vm.prank(ALICE);
    bool success = token.transfer(BOB, amount);
    
    // Assert - 验证结果
    assertTrue(success);
    assertEq(token.balanceOf(BOB), amount);
    assertEq(token.balanceOf(ALICE), 0);
}
```

### 2. Given-When-Then 模式

```solidity
function test_WithdrawAfterDeposit() public {
    // Given - 给定初始条件
    uint256 depositAmount = 100 ether;
    vm.prank(ALICE);
    vault.deposit(depositAmount);
    
    // When - 当执行某个操作时
    uint256 shares = vault.balanceOf(ALICE);
    vm.prank(ALICE);
    vault.withdraw(shares);
    
    // Then - 那么应该有预期结果
    assertEq(vault.balanceOf(ALICE), 0);
    assertEq(vault.totalSupply(), 0);
}
```

## 测试数据管理

### 使用常量

```solidity
contract TokenTest is Test {
    // 测试常量
    uint256 public constant INITIAL_SUPPLY = 1_000_000 ether;
    uint256 public constant TRANSFER_AMOUNT = 1000 ether;
    string public constant TOKEN_NAME = "Test Token";
    string public constant TOKEN_SYMBOL = "TT";
    
    // 地址常量
    address public constant OWNER = address(0x1);
    address public constant USER1 = address(0x2);
    address public constant USER2 = address(0x3);
}
```

### 辅助函数

```solidity
contract VaultTest is Test {
    // 创建辅助函数来减少重复代码
    function _depositFor(address user, uint256 amount) internal {
        vm.prank(user);
        vault.deposit(amount);
    }
    
    function _withdrawFor(address user, uint256 shares) internal {
        vm.prank(user);
        vault.withdraw(shares);
    }
    
    function _printBalances(string memory description) internal view {
        console.log("=== %s ===", description);
        console.log("ALICE balance:", token.balanceOf(ALICE));
        console.log("BOB balance:", token.balanceOf(BOB));
        console.log("Vault balance:", token.balanceOf(address(vault)));
    }
}
```

## 事件测试

### 基本事件测试

```solidity
function test_TransferEmitsEvent() public {
    uint256 amount = 100 ether;
    
    // 期望事件被触发
    vm.expectEmit(true, true, false, true);
    emit Transfer(ALICE, BOB, amount);
    
    vm.prank(ALICE);
    token.transfer(BOB, amount);
}
```

### 复杂事件测试

```solidity
function test_MultipleEvents() public {
    // 期望多个事件
    vm.expectEmit(true, true, false, true);
    emit Approval(ALICE, address(vault), 100 ether);
    
    vm.expectEmit(true, true, false, true);
    emit Transfer(ALICE, address(vault), 100 ether);
    
    vm.expectEmit(true, false, false, true);
    emit Deposit(ALICE, 100 ether);
    
    vm.prank(ALICE);
    vault.deposit(100 ether);
}
```

## 错误处理测试

### 基本错误测试

```solidity
function test_RevertOnZeroAmount() public {
    vm.expectRevert("Amount cannot be zero");
    vault.deposit(0);
}

function test_RevertOnInsufficientBalance() public {
    vm.prank(ALICE);
    vm.expectRevert("Insufficient balance");
    token.transfer(BOB, 1000 ether); // ALICE 没有这么多代币
}
```

### 自定义错误测试

```solidity
// 合约中定义自定义错误
error InsufficientBalance(uint256 available, uint256 required);

// 测试自定义错误
function test_CustomError() public {
    vm.expectRevert(
        abi.encodeWithSelector(
            InsufficientBalance.selector,
            0,
            100 ether
        )
    );
    vault.withdraw(100 ether);
}
```

## Gas 测试

### 基本 Gas 测试

```solidity
function test_DepositGasUsage() public {
    uint256 gasBefore = gasleft();
    
    vm.prank(ALICE);
    vault.deposit(100 ether);
    
    uint256 gasUsed = gasBefore - gasleft();
    console.log("Deposit gas used:", gasUsed);
    
    assertLt(gasUsed, 100000, "Deposit should use less than 100k gas");
}
```

### Gas 快照

```solidity
function test_GasSnapshot() public {
    vm.prank(ALICE);
    uint256 gasUsed = gasleft();
    vault.deposit(100 ether);
    gasUsed = gasUsed - gasleft();
    
    // 创建 gas 快照
    vm.snapshot();
    assertEq(gasUsed, 85432); // 具体的 gas 值
}
```

## 状态测试

### 状态验证

```solidity
function test_StateConsistency() public {
    // 初始状态验证
    assertEq(vault.totalSupply(), 0);
    assertEq(token.balanceOf(address(vault)), 0);
    
    // 执行操作
    vm.prank(ALICE);
    vault.deposit(100 ether);
    
    // 状态变化验证
    assertEq(vault.totalSupply(), 100 ether);
    assertEq(vault.balanceOf(ALICE), 100 ether);
    assertEq(token.balanceOf(address(vault)), 100 ether);
    assertEq(token.balanceOf(ALICE), INITIAL_BALANCE - 100 ether);
}
```

## 测试组织

### 按功能分组

```solidity
contract VaultTest is Test {
    // ============ 基础功能测试 ============
    
    function test_BasicDeposit() public { }
    function test_BasicWithdraw() public { }
    
    // ============ 边界情况测试 ============
    
    function test_ZeroDeposit() public { }
    function test_MaxDeposit() public { }
    
    // ============ 权限测试 ============
    
    function test_OnlyOwnerCanPause() public { }
    function test_UnauthorizedAccess() public { }
    
    // ============ 攻击场景测试 ============
    
    function test_ReentrancyAttack() public { }
    function test_InflationAttack() public { }
}
```

### 使用描述性注释

```solidity
/**
 * @notice 测试基础存款功能
 * @dev 验证用户可以成功存款并获得正确的份额
 */
function test_BasicDeposit() public {
    // 测试逻辑
}

/**
 * @notice 测试通胀攻击场景
 * @dev 验证合约能够抵御通胀攻击
 * 攻击步骤：
 * 1. 攻击者存入最小金额
 * 2. 攻击者直接转账大量代币给合约
 * 3. 受害者存款获得0份额
 */
function test_InflationAttack() public {
    // 攻击逻辑
}
```

## 下一步

学会了基础测试编写后，你可以继续学习：

1. [模糊测试和不变量测试](./03-advanced-testing.md)
2. [调试技巧和工具](./04-debugging-tools.md)
3. [测试最佳实践](./05-best-practices.md)
4. [性能优化](./06-performance-optimization.md)
