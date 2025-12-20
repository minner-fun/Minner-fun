# 高级测试技巧

## 模糊测试 (Fuzz Testing)

模糊测试使用随机生成的输入来测试函数，能够发现边界情况和意外的bug。

### 基本模糊测试

```solidity
contract FuzzTest is Test {
    Token public token;
    
    function setUp() public {
        token = new Token();
    }
    
    // 基础模糊测试
    function testFuzz_Transfer(uint256 amount) public {
        // 限制输入范围
        amount = bound(amount, 0, token.totalSupply());
        
        address from = address(0x1);
        address to = address(0x2);
        
        // 给发送者足够的代币
        vm.prank(address(this));
        token.transfer(from, amount);
        
        // 执行转账
        vm.prank(from);
        bool success = token.transfer(to, amount);
        
        // 验证结果
        assertTrue(success);
        assertEq(token.balanceOf(to), amount);
    }
}
```

### 多参数模糊测试

```solidity
function testFuzz_Swap(
    uint256 amountIn,
    uint256 reserveIn,
    uint256 reserveOut
) public {
    // 限制参数范围避免溢出
    amountIn = bound(amountIn, 1, 1000 ether);
    reserveIn = bound(reserveIn, 1 ether, 10000 ether);
    reserveOut = bound(reserveOut, 1 ether, 10000 ether);
    
    // 计算预期输出
    uint256 expectedOut = (amountIn * reserveOut) / (reserveIn + amountIn);
    
    // 执行交换
    uint256 actualOut = amm.getAmountOut(amountIn, reserveIn, reserveOut);
    
    // 验证结果
    assertEq(actualOut, expectedOut);
}
```

### 结构化模糊测试

```solidity
struct SwapParams {
    uint256 amountIn;
    address tokenIn;
    address tokenOut;
    uint256 deadline;
}

function testFuzz_SwapWithStruct(SwapParams memory params) public {
    // 验证参数
    vm.assume(params.amountIn > 0);
    vm.assume(params.tokenIn != params.tokenOut);
    vm.assume(params.deadline > block.timestamp);
    
    // 执行测试
    // ...
}
```

### 模糊测试配置

在 `foundry.toml` 中配置模糊测试：

```toml
[fuzz]
runs = 1000              # 运行次数
max_test_rejects = 65536 # 最大拒绝次数
seed = '0x1'            # 随机种子
dictionary_weight = 40   # 字典权重
include_storage = true   # 包含存储
include_push_bytes = true # 包含推送字节
```

## 不变量测试 (Invariant Testing)

不变量测试通过随机调用合约函数来验证系统的不变性质。

### 基本不变量测试

```solidity
contract VaultInvariantTest is Test {
    Vault public vault;
    Token public token;
    
    // 测试用户
    address[] public users;
    
    function setUp() public {
        token = new Token();
        vault = new Vault(address(token));
        
        // 创建测试用户
        users.push(address(0x1));
        users.push(address(0x2));
        users.push(address(0x3));
        
        // 给用户分配代币并授权
        for (uint i = 0; i < users.length; i++) {
            token.mint(users[i], 1000 ether);
            vm.prank(users[i]);
            token.approve(address(vault), type(uint256).max);
        }
        
        // 设置目标合约
        targetContract(address(vault));
    }
    
    // 不变量：总供应量等于用户份额之和
    function invariant_TotalSupplyEqualsUserShares() public {
        uint256 totalUserShares = 0;
        for (uint i = 0; i < users.length; i++) {
            totalUserShares += vault.balanceOf(users[i]);
        }
        assertEq(vault.totalSupply(), totalUserShares);
    }
    
    // 不变量：vault的代币余额应该大于等于总供应量
    function invariant_VaultBalanceConsistency() public {
        uint256 vaultBalance = token.balanceOf(address(vault));
        uint256 totalSupply = vault.totalSupply();
        assertGe(vaultBalance, totalSupply);
    }
}
```

### 高级不变量测试

```solidity
contract AMMinvariantTest is Test {
    AMM public amm;
    Token public tokenA;
    Token public tokenB;
    
    // 测试处理器
    AMMHandler public handler;
    
    function setUp() public {
        tokenA = new Token("Token A", "TKA");
        tokenB = new Token("Token B", "TKB");
        amm = new AMM(address(tokenA), address(tokenB));
        
        // 创建处理器
        handler = new AMMHandler(amm, tokenA, tokenB);
        
        // 设置目标合约为处理器
        targetContract(address(handler));
        
        // 设置目标选择器
        bytes4[] memory selectors = new bytes4[](3);
        selectors[0] = AMMHandler.addLiquidity.selector;
        selectors[1] = AMMHandler.removeLiquidity.selector;
        selectors[2] = AMMHandler.swap.selector;
        
        targetSelector(FuzzSelector({
            addr: address(handler),
            selectors: selectors
        }));
    }
    
    // 不变量：恒积公式 k = x * y
    function invariant_ConstantProduct() public {
        uint256 reserve0 = amm.reserve0();
        uint256 reserve1 = amm.reserve1();
        
        if (reserve0 > 0 && reserve1 > 0) {
            uint256 k = reserve0 * reserve1;
            assertGe(k, handler.initialK(), "Product should not decrease");
        }
    }
}

// 处理器合约用于控制不变量测试的行为
contract AMMHandler is Test {
    AMM public amm;
    Token public tokenA;
    Token public tokenB;
    uint256 public initialK;
    
    constructor(AMM _amm, Token _tokenA, Token _tokenB) {
        amm = _amm;
        tokenA = _tokenA;
        tokenB = _tokenB;
    }
    
    function addLiquidity(uint256 amount0, uint256 amount1) public {
        amount0 = bound(amount0, 1, 1000 ether);
        amount1 = bound(amount1, 1, 1000 ether);
        
        // 准备代币
        tokenA.mint(address(this), amount0);
        tokenB.mint(address(this), amount1);
        
        tokenA.approve(address(amm), amount0);
        tokenB.approve(address(amm), amount1);
        
        // 添加流动性
        amm.addLiquidity(amount0, amount1);
        
        // 更新初始 k 值
        if (initialK == 0) {
            initialK = amm.reserve0() * amm.reserve1();
        }
    }
    
    function removeLiquidity(uint256 shares) public {
        uint256 maxShares = amm.balanceOf(address(this));
        if (maxShares == 0) return;
        
        shares = bound(shares, 1, maxShares);
        amm.removeLiquidity(shares);
    }
    
    function swap(uint256 amountIn, bool swapAForB) public {
        amountIn = bound(amountIn, 1, 100 ether);
        
        if (swapAForB) {
            tokenA.mint(address(this), amountIn);
            tokenA.approve(address(amm), amountIn);
            amm.swap(address(tokenA), amountIn);
        } else {
            tokenB.mint(address(this), amountIn);
            tokenB.approve(address(amm), amountIn);
            amm.swap(address(tokenB), amountIn);
        }
    }
}
```

### 不变量测试配置

```toml
[invariant]
runs = 256              # 运行次数
depth = 15              # 调用深度
fail_on_revert = false  # 遇到 revert 时不失败
call_override = false   # 不覆盖调用
dictionary_weight = 80  # 字典权重
include_storage = true  # 包含存储
include_push_bytes = true # 包含推送字节
```

## 属性测试 (Property Testing)

属性测试验证代码的特定属性在所有有效输入下都成立。

### 数学属性测试

```solidity
contract MathTest is Test {
    MathLibrary public math;
    
    function setUp() public {
        math = new MathLibrary();
    }
    
    // 测试加法交换律：a + b = b + a
    function testProperty_AdditionCommutative(uint256 a, uint256 b) public {
        // 避免溢出
        vm.assume(a <= type(uint256).max / 2);
        vm.assume(b <= type(uint256).max / 2);
        
        uint256 result1 = math.add(a, b);
        uint256 result2 = math.add(b, a);
        
        assertEq(result1, result2);
    }
    
    // 测试乘法分配律：a * (b + c) = a * b + a * c
    function testProperty_MultiplicationDistributive(
        uint256 a,
        uint256 b,
        uint256 c
    ) public {
        // 避免溢出
        vm.assume(a <= 1e18);
        vm.assume(b <= 1e18);
        vm.assume(c <= 1e18);
        vm.assume(b + c >= b); // 检查加法不溢出
        
        uint256 left = math.mul(a, math.add(b, c));
        uint256 right = math.add(math.mul(a, b), math.mul(a, c));
        
        assertEq(left, right);
    }
}
```

### 业务逻辑属性测试

```solidity
contract TokenPropertyTest is Test {
    Token public token;
    
    function setUp() public {
        token = new Token();
    }
    
    // 属性：转账前后总供应量不变
    function testProperty_TransferPreservesTotalSupply(
        address from,
        address to,
        uint256 amount
    ) public {
        // 假设条件
        vm.assume(from != address(0));
        vm.assume(to != address(0));
        vm.assume(from != to);
        
        // 给 from 足够的代币
        token.mint(from, amount);
        
        uint256 totalSupplyBefore = token.totalSupply();
        
        // 执行转账
        vm.prank(from);
        token.transfer(to, amount);
        
        uint256 totalSupplyAfter = token.totalSupply();
        
        // 验证总供应量不变
        assertEq(totalSupplyBefore, totalSupplyAfter);
    }
    
    // 属性：多次存取后，用户应该能取回原始金额
    function testProperty_DepositWithdrawRoundTrip(uint256 amount) public {
        amount = bound(amount, 1, 1000 ether);
        
        address user = address(0x1);
        token.mint(user, amount);
        
        vm.startPrank(user);
        token.approve(address(vault), amount);
        
        uint256 balanceBefore = token.balanceOf(user);
        
        // 存款
        vault.deposit(amount);
        uint256 shares = vault.balanceOf(user);
        
        // 取款
        vault.withdraw(shares);
        
        uint256 balanceAfter = token.balanceOf(user);
        vm.stopPrank();
        
        // 应该能取回原始金额（忽略精度损失）
        assertApproxEqAbs(balanceAfter, balanceBefore, 1);
    }
}
```

## 状态机测试

对于有复杂状态转换的合约，可以使用状态机测试。

```solidity
contract AuctionStateMachineTest is Test {
    enum AuctionState { Created, Active, Ended, Finalized }
    
    Auction public auction;
    
    function setUp() public {
        auction = new Auction();
    }
    
    // 测试状态转换的有效性
    function testFuzz_ValidStateTransitions(uint8 action) public {
        AuctionState currentState = AuctionState(auction.state());
        
        if (currentState == AuctionState.Created) {
            if (action % 2 == 0) {
                auction.start();
                assertEq(uint8(auction.state()), uint8(AuctionState.Active));
            }
        } else if (currentState == AuctionState.Active) {
            if (action % 3 == 0) {
                auction.placeBid{value: 1 ether}();
            } else if (action % 3 == 1) {
                vm.warp(block.timestamp + 1 days);
                auction.end();
                assertEq(uint8(auction.state()), uint8(AuctionState.Ended));
            }
        } else if (currentState == AuctionState.Ended) {
            auction.finalize();
            assertEq(uint8(auction.state()), uint8(AuctionState.Finalized));
        }
    }
}
```

## 差分测试 (Differential Testing)

比较不同实现的结果是否一致。

```solidity
contract DifferentialTest is Test {
    MathV1 public mathV1;
    MathV2 public mathV2;
    
    function setUp() public {
        mathV1 = new MathV1();
        mathV2 = new MathV2();
    }
    
    // 比较两个版本的实现
    function testDifferential_Sqrt(uint256 x) public {
        x = bound(x, 0, type(uint128).max);
        
        uint256 result1 = mathV1.sqrt(x);
        uint256 result2 = mathV2.sqrt(x);
        
        // 两个实现应该给出相同结果
        assertEq(result1, result2);
    }
    
    // 与已知正确的实现比较
    function testDifferential_WithReference(uint256 a, uint256 b) public {
        vm.assume(a > 0 && b > 0);
        vm.assume(a <= type(uint128).max && b <= type(uint128).max);
        
        uint256 ourResult = math.gcd(a, b);
        uint256 referenceResult = _referenceGCD(a, b);
        
        assertEq(ourResult, referenceResult);
    }
    
    function _referenceGCD(uint256 a, uint256 b) internal pure returns (uint256) {
        while (b != 0) {
            uint256 temp = b;
            b = a % b;
            a = temp;
        }
        return a;
    }
}
```

## 基于模型的测试

创建简化的模型来验证复杂系统。

```solidity
contract ModelBasedTest is Test {
    // 实际实现
    ComplexVault public vault;
    
    // 简化模型
    mapping(address => uint256) public modelBalances;
    uint256 public modelTotalSupply;
    
    function setUp() public {
        vault = new ComplexVault();
    }
    
    function testModel_Deposit(address user, uint256 amount) public {
        vm.assume(user != address(0));
        amount = bound(amount, 1, 1000 ether);
        
        // 在模型中执行操作
        modelBalances[user] += amount;
        modelTotalSupply += amount;
        
        // 在实际合约中执行操作
        token.mint(user, amount);
        vm.prank(user);
        token.approve(address(vault), amount);
        vm.prank(user);
        vault.deposit(amount);
        
        // 比较结果
        assertEq(vault.balanceOf(user), modelBalances[user]);
        assertEq(vault.totalSupply(), modelTotalSupply);
    }
}
```

## 测试运行和配置

### 运行高级测试

```bash
# 运行模糊测试
forge test --fuzz-runs 10000

# 运行不变量测试
forge test --invariant-runs 1000 --invariant-depth 20

# 运行特定类型的测试
forge test --match-test "testFuzz_"
forge test --match-test "invariant_"

# 使用特定种子
forge test --fuzz-seed 0x1234
```

### 调试高级测试

```bash
# 显示详细输出
forge test --match-test "testFuzz_Transfer" -vvvv

# 显示失败的输入
forge test --match-test "testFuzz_Transfer" --show-progress

# 保存失败案例
forge test --fuzz-runs 10000 --fail-fast
```

## 最佳实践

1. **合理使用 bound()**: 限制模糊测试的输入范围
2. **使用 vm.assume()**: 过滤无效输入
3. **创建有意义的不变量**: 确保不变量真正反映系统属性
4. **使用处理器模式**: 控制不变量测试的复杂度
5. **组合不同测试类型**: 单元测试 + 模糊测试 + 不变量测试

## 下一步

掌握高级测试技巧后，继续学习：

1. [调试技巧和工具](./04-debugging-tools.md)
2. [测试最佳实践](./05-best-practices.md)
3. [性能优化](./06-performance-optimization.md)
