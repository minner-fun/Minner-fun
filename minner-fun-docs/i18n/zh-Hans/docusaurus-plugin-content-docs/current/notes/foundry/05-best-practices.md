# 5、Foundry 测试最佳实践

## 测试组织和结构

### 项目结构最佳实践

```
test/
├── unit/                    # 单元测试
│   ├── Token.t.sol
│   └── Vault.t.sol
├── integration/             # 集成测试
│   ├── VaultIntegration.t.sol
│   └── TokenVaultFlow.t.sol
├── fuzz/                    # 模糊测试
│   ├── VaultFuzz.t.sol
│   └── TokenFuzz.t.sol
├── invariant/               # 不变量测试
│   ├── VaultInvariant.t.sol
│   └── handlers/
│       └── VaultHandler.sol
├── fork/                    # 分叉测试
│   └── MainnetFork.t.sol
├── utils/                   # 测试工具
│   ├── TestHelper.sol
│   └── MockContracts.sol
└── Base.t.sol               # 基础测试合约
```

### 基础测试合约

```solidity
// Base.t.sol - 所有测试的基础合约
abstract contract BaseTest is Test {
    // 常用地址
    address internal constant ALICE = address(0x1);
    address internal constant BOB = address(0x2);
    address internal constant CHARLIE = address(0x3);
    address internal constant ATTACKER = address(0x4);
    
    // 常用常量
    uint256 internal constant INITIAL_BALANCE = 10000 ether;
    uint256 internal constant PRECISION = 1e18;
    uint256 internal constant TOLERANCE = 1e15; // 0.1%
    
    // 事件定义
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    
    // 修饰符
    modifier pranking(address user) {
        vm.startPrank(user);
        _;
        vm.stopPrank();
    }
    
    // 通用辅助函数
    function _dealAndApprove(
        IERC20 token,
        address user,
        uint256 amount,
        address spender
    ) internal {
        deal(address(token), user, amount);
        vm.prank(user);
        token.approve(spender, amount);
    }
    
    function _expectRevertWithMessage(string memory message) internal {
        vm.expectRevert(bytes(message));
    }
}
```

## 命名约定

### 测试函数命名

```solidity
contract VaultTest is BaseTest {
    // ✅ 好的命名
    function test_DepositIncreasesUserBalance() public { }
    function test_WithdrawDecreasesTotalSupply() public { }
    function test_RevertWhen_DepositAmountIsZero() public { }
    function test_RevertWhen_InsufficientBalance() public { }
    
    // 模糊测试
    function testFuzz_DepositWithdrawRoundTrip(uint256 amount) public { }
    
    // 不变量测试
    function invariant_TotalSupplyEqualsUserShares() public { }
    
    // 分叉测试
    function testFork_InteractWithUniswap() public { }
    
    // ❌ 不好的命名
    function test1() public { }
    function testDeposit() public { } // 太模糊
    function test_deposit_works() public { } // 不描述具体行为
}
```

### 变量命名

```solidity
function test_DepositIncreasesUserBalance() public {
    // ✅ 描述性变量名
    uint256 depositAmount = 100 ether;
    uint256 userBalanceBefore = token.balanceOf(ALICE);
    uint256 vaultBalanceBefore = token.balanceOf(address(vault));
    
    vm.prank(ALICE);
    vault.deposit(depositAmount);
    
    uint256 userBalanceAfter = token.balanceOf(ALICE);
    uint256 vaultBalanceAfter = token.balanceOf(address(vault));
    
    assertEq(userBalanceAfter, userBalanceBefore - depositAmount);
    assertEq(vaultBalanceAfter, vaultBalanceBefore + depositAmount);
}
```

## 测试数据管理

### 使用常量和配置

```solidity
contract VaultTestConfig {
    // 测试配置
    struct TestConfig {
        uint256 initialBalance;
        uint256 depositAmount;
        uint256 withdrawAmount;
        address[] users;
    }
    
    function getDefaultConfig() internal pure returns (TestConfig memory) {
        address[] memory users = new address[](4);
        users[0] = address(0x1);
        users[1] = address(0x2);
        users[2] = address(0x3);
        users[3] = address(0x4);
        
        return TestConfig({
            initialBalance: 10000 ether,
            depositAmount: 1000 ether,
            withdrawAmount: 500 ether,
            users: users
        });
    }
    
    function getStressTestConfig() internal pure returns (TestConfig memory) {
        // 压力测试配置
        TestConfig memory config = getDefaultConfig();
        config.initialBalance = 1000000 ether;
        config.depositAmount = 100000 ether;
        return config;
    }
}
```

### 测试数据工厂

```solidity
library TestDataFactory {
    function createUsers(uint256 count) internal pure returns (address[] memory) {
        address[] memory users = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            users[i] = address(uint160(i + 1));
        }
        return users;
    }
    
    function createTokenAmounts(
        uint256 count,
        uint256 baseAmount
    ) internal pure returns (uint256[] memory) {
        uint256[] memory amounts = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            amounts[i] = baseAmount * (i + 1);
        }
        return amounts;
    }
}
```

## 断言最佳实践

### 使用适当的断言

```solidity
function test_AssertionBestPractices() public {
    uint256 amount = 100 ether;
    
    // ✅ 使用具体的断言函数
    assertEq(vault.balanceOf(ALICE), amount, "User balance should equal deposit");
    assertGt(vault.totalSupply(), 0, "Total supply should be greater than 0");
    assertLe(amount, INITIAL_BALANCE, "Amount should not exceed initial balance");
    
    // ✅ 使用近似相等处理精度问题
    uint256 expectedValue = 999999999999999999; // 接近 1 ether
    uint256 actualValue = 1 ether;
    assertApproxEqAbs(actualValue, expectedValue, 1, "Values should be approximately equal");
    
    // ✅ 使用相对误差
    assertApproxEqRel(actualValue, expectedValue, 0.001e18, "Values should be within 0.1%");
    
    // ❌ 避免使用 assertTrue 进行数值比较
    // assertTrue(vault.balanceOf(ALICE) == amount); // 不好
}
```

### 错误消息最佳实践

```solidity
function test_ErrorMessageBestPractices() public {
    uint256 amount = 100 ether;
    
    // ✅ 提供有意义的错误消息
    assertEq(
        vault.balanceOf(ALICE), 
        amount, 
        "User should receive shares equal to deposit amount"
    );
    
    // ✅ 包含实际值和期望值
    assertEq(
        vault.balanceOf(ALICE),
        amount,
        string.concat(
            "Expected balance: ", vm.toString(amount),
            ", Actual balance: ", vm.toString(vault.balanceOf(ALICE))
        )
    );
    
    // ✅ 使用上下文信息
    assertGt(
        token.balanceOf(address(vault)),
        0,
        "Vault should hold tokens after deposit"
    );
}
```

## 模糊测试最佳实践

### 输入验证和边界

```solidity
function testFuzz_DepositWithValidation(uint256 amount) public {
    // ✅ 使用 bound 限制输入范围
    amount = bound(amount, 1, INITIAL_BALANCE);
    
    // ✅ 或使用 vm.assume 过滤输入
    // vm.assume(amount > 0 && amount <= INITIAL_BALANCE);
    
    _dealAndApprove(token, ALICE, amount, address(vault));
    
    vm.prank(ALICE);
    vault.deposit(amount);
    
    assertEq(vault.balanceOf(ALICE), amount);
}

function testFuzz_TransferWithAssumptions(
    address from,
    address to,
    uint256 amount
) public {
    // ✅ 使用 assume 过滤无效输入
    vm.assume(from != address(0));
    vm.assume(to != address(0));
    vm.assume(from != to);
    vm.assume(amount > 0);
    vm.assume(amount <= type(uint128).max); // 避免溢出
    
    _dealAndApprove(token, from, amount, to);
    
    vm.prank(from);
    bool success = token.transfer(to, amount);
    
    assertTrue(success);
    assertEq(token.balanceOf(to), amount);
}
```

### 属性测试

```solidity
function testFuzz_DepositWithdrawProperty(uint256 depositAmount) public {
    depositAmount = bound(depositAmount, 1, INITIAL_BALANCE);
    
    _dealAndApprove(token, ALICE, depositAmount, address(vault));
    
    uint256 balanceBefore = token.balanceOf(ALICE);
    
    // 存款
    vm.prank(ALICE);
    vault.deposit(depositAmount);
    
    // 立即全部取出
    uint256 shares = vault.balanceOf(ALICE);
    vm.prank(ALICE);
    vault.withdraw(shares);
    
    uint256 balanceAfter = token.balanceOf(ALICE);
    
    // 属性：存取后余额应该相等（忽略精度损失）
    assertApproxEqAbs(
        balanceAfter, 
        balanceBefore, 
        1, 
        "Balance should be preserved in deposit-withdraw cycle"
    );
}
```

## 不变量测试最佳实践

### 有意义的不变量

```solidity
contract VaultInvariantTest is BaseTest {
    VaultHandler public handler;
    
    function setUp() public {
        token = new Token();
        vault = new Vault(address(token));
        handler = new VaultHandler(vault, token);
        
        targetContract(address(handler));
    }
    
    // ✅ 核心业务不变量
    function invariant_TotalSupplyEqualsUserShares() public {
        assertEq(
            vault.totalSupply(),
            handler.getTotalUserShares(),
            "Total supply must equal sum of user shares"
        );
    }
    
    // ✅ 资产保护不变量
    function invariant_VaultHoldsEnoughTokens() public {
        uint256 vaultBalance = token.balanceOf(address(vault));
        uint256 totalSupply = vault.totalSupply();
        
        assertGe(
            vaultBalance,
            totalSupply,
            "Vault must hold at least as many tokens as total shares"
        );
    }
    
    // ✅ 数学不变量
    function invariant_SharesNeverExceedTokens() public {
        assertLe(
            vault.totalSupply(),
            token.balanceOf(address(vault)),
            "Shares should never exceed token balance"
        );
    }
}
```

### 处理器模式

```solidity
contract VaultHandler is BaseTest {
    Vault public vault;
    Token public token;
    
    address[] public users;
    uint256 public totalUserShares;
    
    constructor(Vault _vault, Token _token) {
        vault = _vault;
        token = _token;
        
        // 创建测试用户
        users.push(ALICE);
        users.push(BOB);
        users.push(CHARLIE);
    }
    
    function deposit(uint256 amount, uint256 userIndex) public {
        // 限制参数范围
        amount = bound(amount, 1, 1000 ether);
        userIndex = bound(userIndex, 0, users.length - 1);
        
        address user = users[userIndex];
        
        // 准备代币
        deal(address(token), user, amount);
        
        vm.prank(user);
        token.approve(address(vault), amount);
        
        // 执行存款
        vm.prank(user);
        vault.deposit(amount);
        
        // 更新跟踪状态
        totalUserShares += amount;
    }
    
    function withdraw(uint256 sharePercent, uint256 userIndex) public {
        userIndex = bound(userIndex, 0, users.length - 1);
        sharePercent = bound(sharePercent, 1, 100);
        
        address user = users[userIndex];
        uint256 userShares = vault.balanceOf(user);
        
        if (userShares == 0) return;
        
        uint256 sharesToWithdraw = (userShares * sharePercent) / 100;
        
        vm.prank(user);
        vault.withdraw(sharesToWithdraw);
        
        // 更新跟踪状态
        totalUserShares -= sharesToWithdraw;
    }
    
    function getTotalUserShares() public view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < users.length; i++) {
            total += vault.balanceOf(users[i]);
        }
        return total;
    }
}
```

## 测试隔离和清理

### 正确的 setUp 和 tearDown

```solidity
contract VaultTest is BaseTest {
    Token public token;
    Vault public vault;
    
    function setUp() public {
        // ✅ 每个测试都有干净的状态
        token = new Token();
        vault = new Vault(address(token));
        
        // 设置初始状态
        _setupUsers();
    }
    
    function _setupUsers() internal {
        address[] memory users = new address[](3);
        users[0] = ALICE;
        users[1] = BOB;
        users[2] = CHARLIE;
        
        for (uint256 i = 0; i < users.length; i++) {
            deal(address(token), users[i], INITIAL_BALANCE);
            vm.prank(users[i]);
            token.approve(address(vault), type(uint256).max);
        }
    }
    
    // ✅ 测试之间相互独立
    function test_FirstTest() public {
        vm.prank(ALICE);
        vault.deposit(100 ether);
        assertEq(vault.balanceOf(ALICE), 100 ether);
    }
    
    function test_SecondTest() public {
        // 这个测试不受第一个测试影响
        assertEq(vault.balanceOf(ALICE), 0);
        
        vm.prank(BOB);
        vault.deposit(200 ether);
        assertEq(vault.balanceOf(BOB), 200 ether);
    }
}
```

## 错误处理测试

### 全面的错误测试

```solidity
contract ErrorHandlingTest is BaseTest {
    function test_RevertConditions() public {
        // ✅ 测试所有 revert 条件
        
        // 零值存款
        vm.prank(ALICE);
        vm.expectRevert("Amount must be greater than 0");
        vault.deposit(0);
        
        // 余额不足
        vm.prank(ALICE);
        vm.expectRevert("ERC20: insufficient balance");
        vault.deposit(INITIAL_BALANCE + 1);
        
        // 未授权提取
        vm.prank(ALICE);
        vm.expectRevert("ERC20: insufficient balance");
        vault.withdraw(1);
        
        // 提取超过拥有的份额
        vm.prank(ALICE);
        vault.deposit(100 ether);
        
        vm.prank(ALICE);
        vm.expectRevert();
        vault.withdraw(101 ether);
    }
    
    function test_CustomErrors() public {
        // ✅ 测试自定义错误
        vm.expectRevert(
            abi.encodeWithSelector(
                InsufficientBalance.selector,
                0,
                100 ether
            )
        );
        vault.withdrawWithCustomError(100 ether);
    }
}
```

## 性能和 Gas 测试

### Gas 使用监控

```solidity
contract GasTest is BaseTest {
    function test_DepositGasUsage() public {
        uint256 gasBefore = gasleft();
        
        vm.prank(ALICE);
        vault.deposit(100 ether);
        
        uint256 gasUsed = gasBefore - gasleft();
        
        // ✅ 设置合理的 gas 限制
        assertLt(gasUsed, 100000, "Deposit should use less than 100k gas");
        
        // ✅ 记录 gas 使用情况
        console.log("Deposit gas used:", gasUsed);
    }
    
    function test_BatchOperationGasEfficiency() public {
        uint256 singleOpGas = _measureSingleDeposit();
        uint256 batchOpGas = _measureBatchDeposit(10);
        
        // ✅ 验证批量操作的效率
        uint256 expectedBatchGas = singleOpGas * 10;
        uint256 gasEfficiency = ((expectedBatchGas - batchOpGas) * 100) / expectedBatchGas;
        
        console.log("Gas efficiency:", gasEfficiency, "%");
        assertGt(gasEfficiency, 20, "Batch operation should be at least 20% more efficient");
    }
    
    function _measureSingleDeposit() internal returns (uint256) {
        uint256 gasBefore = gasleft();
        vm.prank(ALICE);
        vault.deposit(10 ether);
        return gasBefore - gasleft();
    }
    
    function _measureBatchDeposit(uint256 count) internal returns (uint256) {
        uint256[] memory amounts = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            amounts[i] = 10 ether;
        }
        
        uint256 gasBefore = gasleft();
        vm.prank(ALICE);
        vault.batchDeposit(amounts);
        return gasBefore - gasleft();
    }
}
```

## 文档和注释

### 测试文档

```solidity
/**
 * @title VaultTest
 * @notice 全面的 Vault 合约测试套件
 * @dev 包含单元测试、集成测试、边界测试和攻击场景测试
 * 
 * 测试覆盖范围：
 * - 基础存取款功能
 * - 多用户交互
 * - 边界条件和错误处理
 * - 通胀攻击防护
 * - Gas 使用优化
 */
contract VaultTest is BaseTest {
    /**
     * @notice 测试基础存款功能
     * @dev 验证：
     *      1. 用户代币余额正确减少
     *      2. vault 代币余额正确增加
     *      3. 用户获得正确数量的份额
     *      4. 总供应量正确更新
     */
    function test_BasicDeposit() public {
        // 实现...
    }
    
    /**
     * @notice 测试通胀攻击场景
     * @dev 攻击步骤：
     *      1. 攻击者存入最小金额（1 wei）
     *      2. 攻击者直接转账大量代币给 vault
     *      3. 受害者存款时由于精度损失获得 0 份额
     *      4. 攻击者提取时获得大部分资金
     * 
     * 预期结果：攻击者能够获利，受害者损失资金
     */
    function test_InflationAttack() public {
        // 实现...
    }
}
```

## 持续改进

### 测试度量和监控

```solidity
contract TestMetrics is BaseTest {
    uint256 public totalTests;
    uint256 public passedTests;
    uint256 public totalGasUsed;
    
    modifier trackTest() {
        totalTests++;
        uint256 gasBefore = gasleft();
        _;
        totalGasUsed += gasBefore - gasleft();
        passedTests++;
    }
    
    function test_WithMetrics() public trackTest {
        // 测试实现
        vault.deposit(100 ether);
        assertEq(vault.totalSupply(), 100 ether);
    }
    
    function printTestSummary() public view {
        console.log("=== Test Summary ===");
        console.log("Total tests:", totalTests);
        console.log("Passed tests:", passedTests);
        console.log("Success rate:", (passedTests * 100) / totalTests, "%");
        console.log("Average gas per test:", totalGasUsed / totalTests);
    }
}
```

## 下一步

掌握最佳实践后，继续学习：

1. [性能优化](./06-performance-optimization.md)
2. [CI/CD 集成](./07-cicd-integration.md)
3. [安全测试](./08-security-testing.md)
