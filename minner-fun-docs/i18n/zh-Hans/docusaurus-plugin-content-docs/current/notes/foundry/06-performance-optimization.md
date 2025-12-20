# 性能优化指南

## 测试执行性能优化

### 编译优化

#### foundry.toml 配置

```toml
[profile.default]
# 编译器优化
optimizer = true
optimizer_runs = 200
via_ir = false

# 缓存优化
cache = true
cache_path = "cache"
force = false

# 并行编译
solc_version = "0.8.19"
auto_detect_solc = false

# 减少编译时间
skip = ["test/**/*Integration*", "test/**/fork/*"]  # 跳过某些测试

[profile.ci]
# CI 环境的优化配置
optimizer = true
optimizer_runs = 1000
via_ir = true
```

#### 选择性编译

```bash
# 只编译特定文件
forge build --contracts src/Vault.sol

# 跳过测试编译
forge build --skip test

# 强制重新编译
forge build --force

# 使用特定 Solidity 版本
forge build --use solc:0.8.19
```

### 测试执行优化

#### 并行测试执行

```bash
# 启用并行测试（默认）
forge test

# 指定并行工作线程数
forge test --jobs 4

# 禁用并行测试（调试时有用）
forge test --jobs 1
```

#### 选择性测试运行

```bash
# 只运行特定模式的测试
forge test --match-test "test_Basic"

# 排除某些测试
forge test --no-match-test "testFuzz_"

# 只运行特定合约的测试
forge test --match-contract "VaultTest"

# 运行特定路径的测试
forge test --match-path "test/unit/*"
```

### 模糊测试优化

#### 配置优化

```toml
[fuzz]
# 平衡测试覆盖率和执行时间
runs = 256              # 默认值，可根据需要调整
max_test_rejects = 65536 # 减少无效输入的处理时间

# 使用固定种子提高重现性
seed = '0x1'

# 优化字典使用
dictionary_weight = 40
include_storage = true
include_push_bytes = true
```

#### 高效的模糊测试

```solidity
contract OptimizedFuzzTest is Test {
    // ✅ 使用 bound 而不是 assume
    function testFuzz_EfficientBounding(uint256 amount) public {
        // 更高效：直接限制范围
        amount = bound(amount, 1, 1000 ether);
        
        // 避免：使用 assume 会导致更多拒绝
        // vm.assume(amount >= 1 && amount <= 1000 ether);
    }
    
    // ✅ 预计算常量
    uint256 private constant MAX_AMOUNT = 1000 ether;
    uint256 private constant MIN_AMOUNT = 1;
    
    function testFuzz_WithConstants(uint256 amount) public {
        amount = bound(amount, MIN_AMOUNT, MAX_AMOUNT);
        // 测试逻辑...
    }
    
    // ✅ 批量操作测试
    function testFuzz_BatchOperations(uint256[10] memory amounts) public {
        for (uint256 i = 0; i < amounts.length; i++) {
            amounts[i] = bound(amounts[i], MIN_AMOUNT, MAX_AMOUNT);
        }
        
        // 批量测试比单个测试更高效
        vault.batchDeposit(amounts);
    }
}
```

### 不变量测试优化

#### 处理器优化

```solidity
contract OptimizedVaultHandler is Test {
    Vault public vault;
    Token public token;
    
    // ✅ 预分配数组避免动态分配
    address[10] public users;
    uint256 public userCount;
    
    // ✅ 缓存频繁访问的值
    uint256 public cachedTotalSupply;
    uint256 public lastUpdateBlock;
    
    constructor(Vault _vault, Token _token) {
        vault = _vault;
        token = _token;
        
        // 预初始化用户
        for (uint256 i = 0; i < 10; i++) {
            users[i] = address(uint160(i + 1));
            deal(address(token), users[i], 10000 ether);
        }
        userCount = 10;
    }
    
    function deposit(uint256 amount, uint256 userIndex) public {
        amount = bound(amount, 1, 1000 ether);
        userIndex = bound(userIndex, 0, userCount - 1);
        
        address user = users[userIndex];
        
        // ✅ 避免重复的 deal 和 approve
        if (token.allowance(user, address(vault)) < amount) {
            vm.prank(user);
            token.approve(address(vault), type(uint256).max);
        }
        
        vm.prank(user);
        vault.deposit(amount);
        
        _updateCache();
    }
    
    function _updateCache() internal {
        if (block.number != lastUpdateBlock) {
            cachedTotalSupply = vault.totalSupply();
            lastUpdateBlock = block.number;
        }
    }
    
    // ✅ 高效的状态检查
    function getTotalUserShares() public view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < userCount; i++) {
            total += vault.balanceOf(users[i]);
        }
        return total;
    }
}
```

## Gas 优化测试

### Gas 基准测试

```solidity
contract GasBenchmark is Test {
    Vault public vault;
    Token public token;
    
    // Gas 基准数据
    struct GasBenchmark {
        string operation;
        uint256 gasUsed;
        uint256 baseline;
    }
    
    GasBenchmark[] public benchmarks;
    
    function setUp() public {
        token = new Token();
        vault = new Vault(address(token));
    }
    
    function test_GasBenchmarks() public {
        _benchmarkDeposit();
        _benchmarkWithdraw();
        _benchmarkBatchOperations();
        
        _printBenchmarks();
    }
    
    function _benchmarkDeposit() internal {
        uint256 gasBefore = gasleft();
        
        vault.deposit(100 ether);
        
        uint256 gasUsed = gasBefore - gasleft();
        
        benchmarks.push(GasBenchmark({
            operation: "deposit",
            gasUsed: gasUsed,
            baseline: 85000 // 预期基准
        }));
    }
    
    function _benchmarkWithdraw() internal {
        vault.deposit(100 ether);
        uint256 shares = vault.balanceOf(address(this));
        
        uint256 gasBefore = gasleft();
        
        vault.withdraw(shares);
        
        uint256 gasUsed = gasBefore - gasleft();
        
        benchmarks.push(GasBenchmark({
            operation: "withdraw",
            gasUsed: gasUsed,
            baseline: 65000
        }));
    }
    
    function _benchmarkBatchOperations() internal {
        uint256[] memory amounts = new uint256[](10);
        for (uint256 i = 0; i < 10; i++) {
            amounts[i] = (i + 1) * 10 ether;
        }
        
        uint256 gasBefore = gasleft();
        
        vault.batchDeposit(amounts);
        
        uint256 gasUsed = gasBefore - gasleft();
        
        benchmarks.push(GasBenchmark({
            operation: "batchDeposit",
            gasUsed: gasUsed,
            baseline: 650000
        }));
    }
    
    function _printBenchmarks() internal view {
        console.log("=== Gas Benchmarks ===");
        
        for (uint256 i = 0; i < benchmarks.length; i++) {
            GasBenchmark memory benchmark = benchmarks[i];
            
            console.log("Operation:", benchmark.operation);
            console.log("Gas Used:", benchmark.gasUsed);
            console.log("Baseline:", benchmark.baseline);
            
            if (benchmark.gasUsed <= benchmark.baseline) {
                console.log("✅ PASS - Within baseline");
            } else {
                console.log("❌ FAIL - Exceeds baseline by", 
                    benchmark.gasUsed - benchmark.baseline);
            }
            console.log("---");
        }
    }
}
```

### Gas 优化验证

```solidity
contract GasOptimizationTest is Test {
    VaultV1 public vaultV1; // 原版本
    VaultV2 public vaultV2; // 优化版本
    
    function setUp() public {
        Token token = new Token();
        vaultV1 = new VaultV1(address(token));
        vaultV2 = new VaultV2(address(token));
    }
    
    function test_CompareOptimizations() public {
        uint256 gasV1 = _measureOperation(address(vaultV1), "deposit", 100 ether);
        uint256 gasV2 = _measureOperation(address(vaultV2), "deposit", 100 ether);
        
        console.log("V1 Gas:", gasV1);
        console.log("V2 Gas:", gasV2);
        
        uint256 improvement = gasV1 > gasV2 ? 
            ((gasV1 - gasV2) * 100) / gasV1 : 0;
        
        console.log("Gas Improvement:", improvement, "%");
        
        // 验证优化效果
        assertGt(improvement, 5, "Should improve gas usage by at least 5%");
    }
    
    function _measureOperation(
        address target,
        string memory method,
        uint256 amount
    ) internal returns (uint256) {
        uint256 gasBefore = gasleft();
        
        (bool success,) = target.call(
            abi.encodeWithSignature(
                string.concat(method, "(uint256)"), 
                amount
            )
        );
        require(success, "Operation failed");
        
        return gasBefore - gasleft();
    }
}
```

## 内存和存储优化

### 高效的数据结构

```solidity
contract OptimizedTest is Test {
    // ✅ 使用 packed structs
    struct PackedData {
        uint128 amount;     // 16 bytes
        uint64 timestamp;   // 8 bytes  
        uint32 userId;      // 4 bytes
        bool isActive;      // 1 byte
        // Total: 32 bytes (1 slot)
    }
    
    // ❌ 未优化的 struct
    struct UnpackedData {
        uint256 amount;     // 32 bytes
        uint256 timestamp;  // 32 bytes
        uint256 userId;     // 32 bytes
        bool isActive;      // 32 bytes (浪费31字节)
        // Total: 128 bytes (4 slots)
    }
    
    // ✅ 预分配数组
    uint256[100] public preAllocatedArray;
    
    function test_EfficientDataUsage() public {
        // ✅ 使用内存数组而不是存储数组
        uint256[] memory tempArray = new uint256[](10);
        
        for (uint256 i = 0; i < 10; i++) {
            tempArray[i] = i * 2;
        }
        
        // ✅ 批量操作而不是单个操作
        _processArray(tempArray);
    }
    
    function _processArray(uint256[] memory arr) internal pure {
        // 批量处理逻辑
        for (uint256 i = 0; i < arr.length; i++) {
            // 处理每个元素
        }
    }
}
```

### 存储访问优化

```solidity
contract StorageOptimizationTest is Test {
    mapping(address => uint256) public balances;
    mapping(address => bool) public authorized;
    
    function test_OptimizedStorageAccess() public {
        address user = address(0x1);
        
        // ✅ 缓存存储读取
        uint256 currentBalance = balances[user];
        bool isAuthorized = authorized[user];
        
        // 使用缓存的值进行多次操作
        if (isAuthorized && currentBalance > 0) {
            // 操作逻辑
            currentBalance += 100;
        }
        
        // ✅ 批量存储写入
        balances[user] = currentBalance;
        
        // ❌ 避免重复存储访问
        // if (balances[user] > 0 && authorized[user]) {
        //     balances[user] += 100;
        // }
    }
}
```

## 测试数据优化

### 高效的测试数据生成

```solidity
contract EfficientDataGeneration is Test {
    // ✅ 预计算测试数据
    uint256[] private preComputedAmounts;
    address[] private preComputedAddresses;
    
    function setUp() public {
        _preComputeTestData();
    }
    
    function _preComputeTestData() internal {
        // 预计算常用的测试数据
        preComputedAmounts = new uint256[](100);
        preComputedAddresses = new address[](100);
        
        for (uint256 i = 0; i < 100; i++) {
            preComputedAmounts[i] = (i + 1) * 1 ether;
            preComputedAddresses[i] = address(uint160(i + 1));
        }
    }
    
    function test_WithPreComputedData() public {
        // ✅ 使用预计算的数据
        for (uint256 i = 0; i < 10; i++) {
            address user = preComputedAddresses[i];
            uint256 amount = preComputedAmounts[i];
            
            _performOperation(user, amount);
        }
    }
    
    function _performOperation(address user, uint256 amount) internal {
        // 测试操作
    }
}
```

### 智能的测试用例生成

```solidity
contract SmartTestGeneration is Test {
    // ✅ 使用位运算生成测试用例
    function test_BitManipulationForTestCases() public {
        // 生成 2^n 的测试用例
        for (uint256 i = 0; i < 10; i++) {
            uint256 amount = 1 << i; // 2^i
            _testWithAmount(amount);
        }
    }
    
    // ✅ 使用数学序列生成测试数据
    function test_MathematicalSequences() public {
        // 斐波那契数列
        uint256 a = 1;
        uint256 b = 1;
        
        for (uint256 i = 0; i < 10; i++) {
            _testWithAmount(a);
            uint256 temp = a + b;
            a = b;
            b = temp;
        }
    }
    
    function _testWithAmount(uint256 amount) internal {
        // 测试逻辑
    }
}
```

## 分叉测试优化

### 高效的分叉管理

```solidity
contract OptimizedForkTest is Test {
    uint256 private mainnetFork;
    uint256 private optimismFork;
    
    // ✅ 缓存分叉状态
    mapping(uint256 => bool) private forkInitialized;
    
    function setUp() public {
        // 延迟创建分叉
        mainnetFork = vm.createFork(vm.envString("MAINNET_RPC_URL"));
        optimismFork = vm.createFork(vm.envString("OPTIMISM_RPC_URL"));
    }
    
    function test_MainnetFork() public {
        _initializeFork(mainnetFork);
        
        // 主网测试逻辑
        _testOnMainnet();
    }
    
    function test_OptimismFork() public {
        _initializeFork(optimismFork);
        
        // Optimism 测试逻辑
        _testOnOptimism();
    }
    
    function _initializeFork(uint256 forkId) internal {
        if (!forkInitialized[forkId]) {
            vm.selectFork(forkId);
            
            // ✅ 设置特定区块以获得一致的状态
            vm.rollFork(18000000);
            
            // 初始化分叉特定的状态
            _setupForkState();
            
            forkInitialized[forkId] = true;
        } else {
            vm.selectFork(forkId);
        }
    }
    
    function _setupForkState() internal {
        // 分叉特定的设置
    }
    
    function _testOnMainnet() internal {
        // 主网测试
    }
    
    function _testOnOptimism() internal {
        // Optimism 测试
    }
}
```

### 分叉缓存策略

```bash
# 使用本地缓存减少网络请求
export FOUNDRY_ETH_RPC_URL="http://localhost:8545"

# 使用 Anvil 作为本地缓存节点
anvil --fork-url $MAINNET_RPC_URL --fork-block-number 18000000
```

## 持续集成优化

### GitHub Actions 优化

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
      with:
        submodules: recursive
    
    - name: Install Foundry
      uses: foundry-rs/foundry-toolchain@v1
      with:
        version: nightly
    
    # ✅ 缓存编译结果
    - name: Cache Foundry
      uses: actions/cache@v3
      with:
        path: |
          cache
          out
        key: foundry-${{ runner.os }}-${{ hashFiles('foundry.toml') }}-${{ hashFiles('lib/**') }}
    
    # ✅ 并行测试执行
    - name: Run tests
      run: |
        forge test --jobs 4
    
    # ✅ 分离不同类型的测试
    - name: Run unit tests
      run: forge test --match-path "test/unit/*" --jobs 4
    
    - name: Run integration tests
      run: forge test --match-path "test/integration/*" --jobs 2
      
    # ✅ 条件性运行昂贵的测试
    - name: Run fork tests
      if: github.event_name == 'push' && github.ref == 'refs/heads/main'
      run: forge test --match-path "test/fork/*" --jobs 1
      env:
        MAINNET_RPC_URL: ${{ secrets.MAINNET_RPC_URL }}
```

### 本地开发优化

```bash
#!/bin/bash
# scripts/test-fast.sh

# ✅ 快速测试脚本
echo "Running fast tests..."

# 只运行单元测试
forge test --match-path "test/unit/*" --jobs 4

# 跳过慢速测试
forge test --no-match-path "test/fork/*" --no-match-path "test/invariant/*"

echo "Fast tests completed!"
```

## 性能监控和分析

### 测试性能分析

```solidity
contract PerformanceAnalysis is Test {
    struct TestMetrics {
        string testName;
        uint256 gasUsed;
        uint256 executionTime;
        uint256 memoryUsed;
    }
    
    TestMetrics[] public metrics;
    
    modifier measurePerformance(string memory testName) {
        uint256 startTime = block.timestamp;
        uint256 startGas = gasleft();
        
        _;
        
        uint256 gasUsed = startGas - gasleft();
        uint256 executionTime = block.timestamp - startTime;
        
        metrics.push(TestMetrics({
            testName: testName,
            gasUsed: gasUsed,
            executionTime: executionTime,
            memoryUsed: _estimateMemoryUsage()
        }));
    }
    
    function test_WithPerformanceTracking() public 
        measurePerformance("test_WithPerformanceTracking") 
    {
        // 测试逻辑
        for (uint256 i = 0; i < 100; i++) {
            vault.deposit(1 ether);
        }
    }
    
    function _estimateMemoryUsage() internal pure returns (uint256) {
        // 简单的内存使用估算
        return gasleft() / 100; // 粗略估算
    }
    
    function printPerformanceReport() public view {
        console.log("=== Performance Report ===");
        
        for (uint256 i = 0; i < metrics.length; i++) {
            TestMetrics memory metric = metrics[i];
            
            console.log("Test:", metric.testName);
            console.log("Gas Used:", metric.gasUsed);
            console.log("Execution Time:", metric.executionTime);
            console.log("Memory Used:", metric.memoryUsed);
            console.log("---");
        }
    }
}
```

## 最佳实践总结

1. **编译优化**: 使用适当的编译器设置和缓存
2. **测试选择**: 运行相关的测试，跳过不必要的测试
3. **数据优化**: 预计算测试数据，使用高效的数据结构
4. **并行执行**: 利用并行测试执行能力
5. **资源管理**: 合理管理内存和存储访问
6. **分叉优化**: 智能管理分叉测试和缓存
7. **持续监控**: 跟踪和分析测试性能

## 下一步

了解性能优化后，继续学习：

1. [CI/CD 集成](./07-cicd-integration.md)
2. [安全测试](./08-security-testing.md)
3. [实战案例](./09-real-world-examples.md)
