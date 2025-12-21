# 10、故障排除指南

本指南帮助你解决在使用 Foundry 进行智能合约测试时遇到的常见问题。

## 编译问题

### 1. Solidity 版本不匹配

**问题**: 
```
Error: Source file requires different compiler version
```

**解决方案**:
```toml
# foundry.toml
[profile.default]
solc = "0.8.19"  # 指定具体版本
auto_detect_solc = false  # 禁用自动检测
```

**或者使用版本范围**:
```solidity
pragma solidity ^0.8.19;  // 确保合约和配置一致
```

### 2. 依赖库路径问题

**问题**:
```
Error: Source "lib/forge-std/src/Test.sol" not found
```

**解决方案**:
```bash
# 重新安装依赖
forge install foundry-rs/forge-std

# 或者更新子模块
git submodule update --init --recursive

# 检查 foundry.toml 配置
```

```toml
[profile.default]
libs = ["lib"]  # 确保库路径正确
```

### 3. 导入路径错误

**问题**:
```
Error: Source "contracts/MyContract.sol" not found
```

**解决方案**:
```solidity
// ❌ 错误的导入
import "contracts/MyContract.sol";

// ✅ 正确的导入
import "../src/MyContract.sol";
import {MyContract} from "../src/MyContract.sol";
```

### 4. 编译器内存不足

**问题**:
```
Error: Compiler run out of memory
```

**解决方案**:
```toml
# foundry.toml
[profile.default]
optimizer = false  # 暂时禁用优化
via_ir = false     # 禁用 IR 编译
```

或者增加系统内存，使用更强大的机器编译。

## 测试执行问题

### 1. 测试函数未被识别

**问题**: 测试函数不执行

**解决方案**:
```solidity
// ❌ 错误的命名
function testcase_deposit() public { }

// ✅ 正确的命名
function test_Deposit() public { }
function testFuzz_Deposit(uint256 amount) public { }
```

### 2. setUp 函数问题

**问题**: setUp 不执行或执行多次

**解决方案**:
```solidity
contract MyTest is Test {
    // ✅ 正确的 setUp
    function setUp() public {
        // 初始化代码
    }
    
    // ❌ 错误的命名
    function setup() public { }  // 小写s
    function SetUp() public { }  // 大写S
}
```

### 3. Gas 限制问题

**问题**:
```
Error: Transaction ran out of gas
```

**解决方案**:
```bash
# 增加 gas 限制
forge test --gas-limit 30000000

# 或在 foundry.toml 中设置
```

```toml
[profile.default]
gas_limit = 30000000
```

### 4. 时间相关测试失败

**问题**: 时间戳测试不稳定

**解决方案**:
```solidity
function test_TimeBasedFunction() public {
    // ❌ 不稳定的时间测试
    uint256 startTime = block.timestamp;
    
    // ✅ 使用 vm.warp 控制时间
    vm.warp(1641070800); // 固定时间戳
    
    // 执行测试逻辑
    
    vm.warp(block.timestamp + 1 days); // 推进时间
}
```

## 作弊码 (Cheatcode) 问题

### 1. vm.expectRevert 不工作

**问题**: expectRevert 没有捕获到预期的 revert

**解决方案**:
```solidity
// ❌ 错误用法
vm.expectRevert();
someFunction();
anotherFunction(); // 这会导致问题

// ✅ 正确用法
vm.expectRevert();
someFunction(); // 只能调用一个函数

// 或者使用具体的错误消息
vm.expectRevert("Specific error message");
someFunction();

// 对于自定义错误
vm.expectRevert(abi.encodeWithSelector(CustomError.selector, param1, param2));
someFunction();
```

### 2. vm.prank 作用域问题

**问题**: prank 影响了多个调用

**解决方案**:
```solidity
// ❌ 可能出现问题
vm.prank(user);
contract1.function1();
contract2.function2(); // 这个调用可能不是以 user 身份

// ✅ 明确控制作用域
vm.startPrank(user);
contract1.function1();
contract2.function2();
vm.stopPrank();

// 或者每次单独使用
vm.prank(user);
contract1.function1();

vm.prank(user);
contract2.function2();
```

### 3. 存储操作问题

**问题**: vm.store 或 vm.load 不工作

**解决方案**:
```solidity
// 确保使用正确的存储槽
function test_StorageManipulation() public {
    // 获取正确的存储槽
    bytes32 slot = keccak256(abi.encode(user, 0)); // mapping(address => uint256) 在槽 0
    
    // 设置存储值
    vm.store(address(token), slot, bytes32(uint256(1000)));
    
    // 验证
    assertEq(token.balanceOf(user), 1000);
}
```

## 模糊测试问题

### 1. 过多的假设导致测试跳过

**问题**:
```
[PASS] testFuzz_Function(uint256) (runs: 0, μ: 0, ~: 0)
```

**解决方案**:
```solidity
// ❌ 过于严格的假设
function testFuzz_BadAssumptions(uint256 x) public {
    vm.assume(x > 1000);
    vm.assume(x < 1001);  // 几乎不可能满足
    vm.assume(x % 7 == 0);
    // ...
}

// ✅ 使用 bound 代替过多 assume
function testFuzz_GoodBounding(uint256 x) public {
    x = bound(x, 1000, 10000);
    vm.assume(x % 7 == 0);  // 只保留必要的假设
    // ...
}
```

### 2. 模糊测试输入导致意外错误

**问题**: 模糊测试因为意外的输入失败

**解决方案**:
```solidity
function testFuzz_SafeInputHandling(address user, uint256 amount) public {
    // 过滤无效输入
    vm.assume(user != address(0));
    vm.assume(user != address(this));
    amount = bound(amount, 1, type(uint128).max); // 避免溢出
    
    // 处理可能的异常
    try token.transfer(user, amount) returns (bool success) {
        assertTrue(success);
    } catch {
        // 记录但不失败
        console.log("Transfer failed for:", user, amount);
    }
}
```

### 3. 模糊测试性能问题

**问题**: 模糊测试运行太慢

**解决方案**:
```toml
# foundry.toml
[profile.ci]
fuzz = { runs = 100 }  # CI 环境减少运行次数

[profile.default]
fuzz = { runs = 256 }  # 开发环境适中

[profile.deep]
fuzz = { runs = 10000 } # 深度测试
```

## 分叉测试问题

### 1. RPC 连接问题

**问题**:
```
Error: Failed to get account for 0x... from RPC
```

**解决方案**:
```bash
# 检查 RPC URL 是否正确
forge test --fork-url https://eth-mainnet.alchemyapi.io/v2/YOUR_KEY

# 使用环境变量
export MAINNET_RPC_URL="https://eth-mainnet.alchemyapi.io/v2/YOUR_KEY"
forge test --fork-url $MAINNET_RPC_URL

# 或在 foundry.toml 中配置
```

```toml
[rpc_endpoints]
mainnet = "${MAINNET_RPC_URL}"
```

### 2. 分叉区块号问题

**问题**: 分叉的区块太新或太旧

**解决方案**:
```solidity
function setUp() public {
    // 分叉到特定区块
    vm.createFork("mainnet", 18000000);
    
    // 或者分叉到最新区块然后回滚
    vm.createFork("mainnet");
    vm.rollFork(18000000);
}
```

### 3. 分叉状态不一致

**问题**: 分叉后状态不符合预期

**解决方案**:
```solidity
function test_ForkStateVerification() public {
    // 验证分叉状态
    assertEq(block.number, 18000000, "Wrong block number");
    
    // 检查关键合约状态
    IERC20 usdc = IERC20(0xA0b86a33E6F9e7B7c3e5F5C7C5A5a5a5a5a5a5a5);
    assertGt(usdc.totalSupply(), 0, "USDC should have supply");
    
    // 验证账户余额
    address vitalik = 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045;
    assertGt(vitalik.balance, 0, "Vitalik should have ETH");
}
```

## 不变量测试问题

### 1. 不变量测试不运行

**问题**: invariant_ 函数不执行

**解决方案**:
```solidity
contract InvariantTest is Test {
    function setUp() public {
        // 必须设置目标合约
        targetContract(address(myContract));
        
        // 或设置目标选择器
        bytes4[] memory selectors = new bytes4[](2);
        selectors[0] = MyContract.deposit.selector;
        selectors[1] = MyContract.withdraw.selector;
        
        targetSelector(FuzzSelector({
            addr: address(myContract),
            selectors: selectors
        }));
    }
    
    // 不变量函数必须是 public 或 external
    function invariant_TotalSupply() public view {
        // 不变量逻辑
    }
}
```

### 2. 不变量测试失败难以调试

**问题**: 不变量失败但不知道具体原因

**解决方案**:
```solidity
function invariant_DetailedChecking() public {
    uint256 totalSupply = token.totalSupply();
    uint256 userSum = 0;
    
    // 详细检查每个组件
    for (uint i = 0; i < users.length; i++) {
        uint256 balance = token.balanceOf(users[i]);
        userSum += balance;
        
        // 记录详细信息
        console.log("User", i, "balance:", balance);
    }
    
    console.log("Total supply:", totalSupply);
    console.log("User sum:", userSum);
    
    assertEq(totalSupply, userSum, "Supply mismatch");
}
```

## 环境和配置问题

### 1. 环境变量未加载

**问题**: 环境变量在测试中为空

**解决方案**:
```bash
# 确保 .env 文件存在且格式正确
# .env
MAINNET_RPC_URL=https://eth-mainnet.alchemyapi.io/v2/your_key
PRIVATE_KEY=0x...

# 加载环境变量
source .env
forge test

# 或使用 --env-file 参数
forge test --env-file .env
```

```solidity
// 在测试中访问环境变量
function test_EnvironmentVariable() public {
    string memory rpcUrl = vm.envString("MAINNET_RPC_URL");
    assertGt(bytes(rpcUrl).length, 0, "RPC URL should be set");
}
```

### 2. 配置文件问题

**问题**: foundry.toml 配置不生效

**解决方案**:
```bash
# 检查配置文件语法
forge config

# 验证配置是否正确加载
forge config --json
```

```toml
# 确保配置文件格式正确
[profile.default]
src = "src"
out = "out"
libs = ["lib"]

# 注意：不要使用 tab，使用空格
```

### 3. 缓存问题

**问题**: 修改后测试结果没有更新

**解决方案**:
```bash
# 清除缓存
forge clean

# 强制重新编译
forge build --force

# 清除特定缓存
rm -rf cache/
rm -rf out/
```

## 性能问题

### 1. 测试运行太慢

**问题**: 测试执行时间过长

**解决方案**:
```bash
# 并行运行测试
forge test --jobs 4

# 只运行特定测试
forge test --match-test "test_Fast"

# 跳过慢速测试
forge test --no-match-path "test/slow/*"
```

```toml
# 优化配置
[profile.default]
optimizer = true
optimizer_runs = 200

[profile.ci]
fuzz = { runs = 100 }  # CI 中减少模糊测试次数
```

### 2. 内存使用过高

**问题**: 测试消耗过多内存

**解决方案**:
```solidity
// 避免创建大型数组
function test_MemoryEfficient() public {
    // ❌ 内存密集
    uint256[] memory largeArray = new uint256[](1000000);
    
    // ✅ 分批处理
    for (uint256 i = 0; i < 1000; i++) {
        uint256[] memory batch = new uint256[](1000);
        // 处理批次
    }
}
```

## 调试技巧

### 1. 使用详细输出

```bash
# 不同详细级别
forge test -v          # 基本输出
forge test -vv         # 显示所有日志
forge test -vvv        # 显示失败测试的跟踪
forge test -vvvv       # 显示所有测试的跟踪
```

### 2. 使用断点调试

```solidity
function test_WithBreakpoints() public {
    uint256 value = calculateValue();
    
    // 设置断点
    vm.breakpoint("checkpoint1");
    
    value = modifyValue(value);
    
    vm.breakpoint("checkpoint2");
    
    assertEq(value, expectedValue);
}
```

### 3. 记录状态信息

```solidity
function test_WithStateLogging() public {
    console.log("=== Test Start ===");
    console.log("Initial state:");
    logContractState();
    
    performOperation();
    
    console.log("After operation:");
    logContractState();
    
    console.log("=== Test End ===");
}

function logContractState() internal view {
    console.log("Total supply:", token.totalSupply());
    console.log("Contract balance:", address(contract).balance);
}
```

## 常见错误信息解析

### 1. Stack too deep

**错误**: `CompilerError: Stack too deep`

**解决方案**:
```solidity
// ❌ 局部变量太多
function complexFunction() public {
    uint256 var1 = 1;
    uint256 var2 = 2;
    // ... 太多局部变量
    uint256 var20 = 20;
}

// ✅ 使用结构体或分解函数
struct FunctionParams {
    uint256 var1;
    uint256 var2;
    // ...
}

function complexFunction() public {
    FunctionParams memory params;
    _processParams(params);
}
```

### 2. Arithmetic over/underflow

**错误**: `panic: arithmetic underflow or overflow (0x11)`

**解决方案**:
```solidity
// 使用 unchecked 块（如果溢出是预期的）
function safeOperation(uint256 a, uint256 b) public pure returns (uint256) {
    unchecked {
        return a - b; // 允许下溢
    }
}

// 或添加检查
function checkedOperation(uint256 a, uint256 b) public pure returns (uint256) {
    require(a >= b, "Underflow");
    return a - b;
}
```

### 3. Call failed

**错误**: `Error: call failed`

**解决方案**:
```solidity
// 检查调用是否成功
(bool success, bytes memory data) = target.call(callData);
require(success, string(data));

// 或使用 try-catch
try target.someFunction() {
    // 成功处理
} catch Error(string memory reason) {
    console.log("Call failed:", reason);
} catch (bytes memory lowLevelData) {
    console.logBytes(lowLevelData);
}
```

## 获取帮助

### 1. 官方资源
- [Foundry Book](https://book.getfoundry.sh/)
- [GitHub Issues](https://github.com/foundry-rs/foundry/issues)
- [Discord 社区](https://discord.gg/foundry-rs)

### 2. 社区资源
- Stack Overflow (标签: foundry, forge)
- Ethereum Stack Exchange
- Reddit r/ethdev

### 3. 诊断命令
```bash
# 检查 Foundry 版本
forge --version
cast --version

# 验证配置
forge config

# 检查依赖
forge tree

# 运行特定测试并获取详细输出
forge test --match-test "specific_test" -vvvv
```

通过这个故障排除指南，你应该能够解决大多数在使用 Foundry 时遇到的问题。记住，当遇到问题时，首先检查错误消息，然后查看相关的配置和代码，最后寻求社区帮助。

## 下一步

解决了常见问题后，继续学习：

1. [高级技巧](./11-advanced-techniques.md)
2. [社区资源](./12-community-resources.md)
3. [总结和展望](./13-conclusion.md)
