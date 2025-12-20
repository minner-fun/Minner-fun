# 调试技巧和工具

## 基础调试技巧

### 使用 console.log

```solidity
import {console} from "forge-std/console.sol";

contract DebuggingTest is Test {
    function test_WithLogging() public {
        uint256 value = 42;
        address user = address(0x1);
        
        // 基础日志输出
        console.log("Testing with value:", value);
        console.log("User address:", user);
        
        // 格式化输出
        console.log("Value %d for user %s", value, user);
        
        // 布尔值输出
        console.log("Condition is:", value > 40);
        
        // 字节输出
        console.logBytes(abi.encode(value));
        console.logBytes32(bytes32(value));
    }
}
```

### 详细的测试输出级别

```bash
# 不同的详细级别
forge test -v          # 显示失败测试的错误
forge test -vv         # 显示所有测试的日志
forge test -vvv        # 显示失败测试的执行跟踪
forge test -vvvv       # 显示所有测试的执行跟踪
forge test -vvvvv      # 显示所有测试的执行跟踪和设置跟踪
```

## 高级调试功能

### 使用 vm.breakpoint

```solidity
function test_WithBreakpoint() public {
    uint256 value = calculateSomething();
    
    // 设置断点进行调试
    vm.breakpoint("checkpoint1");
    
    value = modifyValue(value);
    
    vm.breakpoint("checkpoint2");
    
    assertEq(value, expectedValue);
}
```

### 追踪函数调用

```solidity
function test_TraceExecution() public {
    // 开始追踪
    vm.startStateDiffRecording();
    
    vault.deposit(100 ether);
    
    // 获取状态差异
    VmSafe.AccountAccess[] memory accountAccesses = vm.stopAndReturnStateDiff();
    
    // 分析状态变化
    for (uint i = 0; i < accountAccesses.length; i++) {
        console.log("Account:", accountAccesses[i].account);
        console.log("Kind:", uint(accountAccesses[i].kind));
    }
}
```

## 错误诊断

### 分析 Revert 原因

```solidity
function test_DiagnoseRevert() public {
    try vault.deposit(0) {
        fail("Should have reverted");
    } catch Error(string memory reason) {
        // 捕获 require 消息
        console.log("Revert reason:", reason);
        assertEq(reason, "Amount must be greater than 0");
    } catch Panic(uint errorCode) {
        // 捕获 panic 错误（如溢出）
        console.log("Panic code:", errorCode);
    } catch (bytes memory lowLevelData) {
        // 捕获低级错误
        console.logBytes(lowLevelData);
    }
}
```

### 自定义错误调试

```solidity
// 合约中定义自定义错误
error InsufficientBalance(uint256 available, uint256 required);

function test_CustomErrorDebugging() public {
    try vault.withdraw(1000 ether) {
        fail("Should have reverted");
    } catch (bytes memory data) {
        // 解码自定义错误
        bytes4 selector = bytes4(data);
        if (selector == InsufficientBalance.selector) {
            (uint256 available, uint256 required) = abi.decode(
                data[4:], 
                (uint256, uint256)
            );
            console.log("Available:", available);
            console.log("Required:", required);
        }
    }
}
```

## Gas 分析和优化

### Gas 报告

```bash
# 生成 gas 报告
forge test --gas-report

# 保存 gas 报告到文件
forge test --gas-report > gas-report.txt

# 按合约分组的 gas 报告
forge test --gas-report --json > gas-report.json
```

### Gas 快照测试

```solidity
function test_GasSnapshot() public {
    // 测试操作的 gas 使用
    uint256 gasBefore = gasleft();
    
    vault.deposit(100 ether);
    
    uint256 gasUsed = gasBefore - gasleft();
    
    // 创建 gas 快照
    assertEq(gasUsed, 85432, "Gas usage should match snapshot");
}
```

### Gas 优化验证

```solidity
contract GasOptimizationTest is Test {
    VaultV1 public vaultV1;
    VaultV2 public vaultV2; // 优化版本
    
    function test_CompareGasUsage() public {
        uint256 gasV1 = measureGas(address(vaultV1), "deposit", 100 ether);
        uint256 gasV2 = measureGas(address(vaultV2), "deposit", 100 ether);
        
        console.log("V1 gas:", gasV1);
        console.log("V2 gas:", gasV2);
        console.log("Savings:", gasV1 - gasV2);
        
        assertLt(gasV2, gasV1, "V2 should use less gas");
    }
    
    function measureGas(
        address target, 
        string memory method, 
        uint256 amount
    ) internal returns (uint256) {
        uint256 gasBefore = gasleft();
        
        (bool success,) = target.call(
            abi.encodeWithSignature(string.concat(method, "(uint256)"), amount)
        );
        require(success);
        
        return gasBefore - gasleft();
    }
}
```

## 状态检查和验证

### 存储槽检查

```solidity
function test_StorageInspection() public {
    vault.deposit(100 ether);
    
    // 检查特定存储槽
    bytes32 totalSupplySlot = bytes32(uint256(0)); // 假设 totalSupply 在槽 0
    bytes32 value = vm.load(address(vault), totalSupplySlot);
    
    console.log("Total supply from storage:");
    console.logBytes32(value);
    
    assertEq(uint256(value), vault.totalSupply());
}
```

### 余额和状态一致性检查

```solidity
function test_StateConsistencyCheck() public {
    address[] memory users = new address[](3);
    users[0] = address(0x1);
    users[1] = address(0x2);
    users[2] = address(0x3);
    
    // 执行一系列操作
    for (uint i = 0; i < users.length; i++) {
        vm.prank(users[i]);
        vault.deposit((i + 1) * 100 ether);
    }
    
    // 检查状态一致性
    checkStateConsistency(users);
}

function checkStateConsistency(address[] memory users) internal view {
    uint256 totalUserShares = 0;
    uint256 totalUserTokens = 0;
    
    for (uint i = 0; i < users.length; i++) {
        uint256 shares = vault.balanceOf(users[i]);
        uint256 tokens = token.balanceOf(users[i]);
        
        totalUserShares += shares;
        totalUserTokens += tokens;
        
        console.log("User", i, "shares:", shares);
        console.log("User", i, "tokens:", tokens);
    }
    
    console.log("Total user shares:", totalUserShares);
    console.log("Vault total supply:", vault.totalSupply());
    console.log("Vault token balance:", token.balanceOf(address(vault)));
    
    // 验证一致性
    assertEq(totalUserShares, vault.totalSupply(), "Shares inconsistency");
}
```

## 事件分析

### 事件捕获和分析

```solidity
function test_EventAnalysis() public {
    // 记录事件
    vm.recordLogs();
    
    vault.deposit(100 ether);
    vault.withdraw(50 ether);
    
    // 获取日志
    Vm.Log[] memory logs = vm.getRecordedLogs();
    
    console.log("Total events:", logs.length);
    
    for (uint i = 0; i < logs.length; i++) {
        console.log("Event", i, "topics:");
        for (uint j = 0; j < logs[i].topics.length; j++) {
            console.logBytes32(logs[i].topics[j]);
        }
        console.log("Data:");
        console.logBytes(logs[i].data);
    }
}
```

### 特定事件验证

```solidity
function test_SpecificEventVerification() public {
    vm.recordLogs();
    
    vault.deposit(100 ether);
    
    Vm.Log[] memory logs = vm.getRecordedLogs();
    
    // 查找特定事件
    bool foundDepositEvent = false;
    for (uint i = 0; i < logs.length; i++) {
        // Deposit 事件的签名
        if (logs[i].topics[0] == keccak256("Deposit(address,uint256)")) {
            foundDepositEvent = true;
            
            // 解码事件数据
            address depositor = address(uint160(uint256(logs[i].topics[1])));
            uint256 amount = abi.decode(logs[i].data, (uint256));
            
            console.log("Deposit event found:");
            console.log("Depositor:", depositor);
            console.log("Amount:", amount);
            
            assertEq(depositor, address(this));
            assertEq(amount, 100 ether);
        }
    }
    
    assertTrue(foundDepositEvent, "Deposit event not found");
}
```

## 分叉测试调试

### 主网分叉调试

```solidity
contract ForkDebuggingTest is Test {
    uint256 mainnetFork;
    
    function setUp() public {
        // 创建主网分叉
        mainnetFork = vm.createFork("https://eth-mainnet.alchemyapi.io/v2/YOUR_KEY");
        vm.selectFork(mainnetFork);
        
        // 设置区块号
        vm.rollFork(18000000);
    }
    
    function test_ForkStateDebugging() public {
        address usdcAddress = 0xA0b86a33E6F9e7B7c3e5F5C7C5A5a5a5a5a5a5a5;
        IERC20 usdc = IERC20(usdcAddress);
        
        // 检查分叉状态
        console.log("USDC total supply:", usdc.totalSupply());
        console.log("Block number:", block.number);
        console.log("Block timestamp:", block.timestamp);
        
        // 模拟大户操作
        address whale = 0x....; // USDC 大户地址
        uint256 whaleBalance = usdc.balanceOf(whale);
        console.log("Whale balance:", whaleBalance);
        
        // 使用大户身份进行测试
        vm.prank(whale);
        usdc.transfer(address(this), 1000e6);
        
        assertEq(usdc.balanceOf(address(this)), 1000e6);
    }
}
```

## 调试工具和技巧

### 使用 Chisel 进行快速测试

```bash
# 启动 Chisel REPL
chisel

# 在 Chisel 中测试代码片段
➜ uint256 a = 100;
➜ uint256 b = 200;
➜ a + b
Type: uint256
├ Hex: 0x012c
└ Decimal: 300
```

### 使用 Cast 进行链上调试

```bash
# 调用合约函数
cast call 0x... "balanceOf(address)" 0x...

# 发送交易
cast send 0x... "deposit(uint256)" 100000000000000000000 --private-key 0x...

# 获取存储值
cast storage 0x... 0

# 解码交易数据
cast 4byte-decode 0xa9059cbb000000000000000000000000...

# 获取事件日志
cast logs --from-block 18000000 --to-block 18000100 "Transfer(address,address,uint256)"
```

### 自定义调试辅助函数

```solidity
contract DebugHelper {
    function debugVaultState(Vault vault, Token token, address[] memory users) 
        internal 
        view 
    {
        console.log("=== Vault State Debug ===");
        console.log("Vault total supply:", vault.totalSupply());
        console.log("Vault token balance:", token.balanceOf(address(vault)));
        
        uint256 totalUserShares = 0;
        for (uint i = 0; i < users.length; i++) {
            uint256 shares = vault.balanceOf(users[i]);
            uint256 tokens = token.balanceOf(users[i]);
            totalUserShares += shares;
            
            console.log("User", i, "- Address:", users[i]);
            console.log("  Shares:", shares);
            console.log("  Tokens:", tokens);
        }
        
        console.log("Total user shares:", totalUserShares);
        console.log("Shares consistency:", vault.totalSupply() == totalUserShares);
        console.log("========================");
    }
    
    function debugTransactionTrace() internal {
        console.log("Block number:", block.number);
        console.log("Block timestamp:", block.timestamp);
        console.log("Gas left:", gasleft());
        console.log("Caller:", msg.sender);
        console.log("Origin:", tx.origin);
    }
}
```

## 性能调试

### 识别性能瓶颈

```solidity
function test_PerformanceBottleneck() public {
    uint256 iterations = 1000;
    
    // 测试循环性能
    uint256 gasBefore = gasleft();
    
    for (uint i = 0; i < iterations; i++) {
        vault.deposit(1 ether);
    }
    
    uint256 gasAfter = gasleft();
    uint256 gasPerIteration = (gasBefore - gasAfter) / iterations;
    
    console.log("Gas per deposit:", gasPerIteration);
    
    // 与基准比较
    assertLt(gasPerIteration, 50000, "Each deposit should use less than 50k gas");
}
```

### 内存使用分析

```solidity
function test_MemoryUsage() public {
    // 测试大数组操作
    uint256[] memory largeArray = new uint256[](1000);
    
    uint256 gasBefore = gasleft();
    
    for (uint i = 0; i < largeArray.length; i++) {
        largeArray[i] = i * 2;
    }
    
    uint256 gasUsed = gasBefore - gasleft();
    console.log("Memory operation gas:", gasUsed);
}
```

## 调试最佳实践

1. **渐进式调试**: 从简单的 console.log 开始，逐步使用更复杂的工具
2. **保留调试代码**: 在测试中保留有用的调试输出
3. **使用描述性日志**: 让日志输出更有意义
4. **分层调试**: 在不同层次（函数、合约、系统）进行调试
5. **自动化检查**: 创建自动化的状态一致性检查

## 下一步

掌握调试技巧后，继续学习：

1. [测试最佳实践](./05-best-practices.md)
2. [性能优化](./06-performance-optimization.md)
3. [CI/CD 集成](./07-cicd-integration.md)
