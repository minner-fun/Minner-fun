# 安全测试指南

## 安全测试概述

安全测试是智能合约开发中最关键的环节之一。本指南将介绍如何使用 Foundry 进行全面的安全测试。

## 常见漏洞测试

### 重入攻击测试

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test} from "forge-std/Test.sol";
import {Vault} from "../src/Vault.sol";
import {Token} from "../src/Token.sol";

contract ReentrancyTest is Test {
    Vault public vault;
    Token public token;
    ReentrancyAttacker public attacker;
    
    address public constant VICTIM = address(0x1);
    uint256 public constant INITIAL_BALANCE = 1000 ether;
    
    function setUp() public {
        token = new Token();
        vault = new Vault(address(token));
        attacker = new ReentrancyAttacker(vault, token);
        
        // 给受害者分配代币
        token.mint(VICTIM, INITIAL_BALANCE);
        vm.prank(VICTIM);
        token.approve(address(vault), INITIAL_BALANCE);
        
        // 受害者存款
        vm.prank(VICTIM);
        vault.deposit(500 ether);
        
        // 给攻击者分配代币
        token.mint(address(attacker), 100 ether);
    }
    
    function test_ReentrancyAttack() public {
        uint256 vaultBalanceBefore = token.balanceOf(address(vault));
        uint256 attackerBalanceBefore = token.balanceOf(address(attacker));
        
        console.log("Vault balance before attack:", vaultBalanceBefore);
        console.log("Attacker balance before attack:", attackerBalanceBefore);
        
        // 执行重入攻击
        attacker.attack();
        
        uint256 vaultBalanceAfter = token.balanceOf(address(vault));
        uint256 attackerBalanceAfter = token.balanceOf(address(attacker));
        
        console.log("Vault balance after attack:", vaultBalanceAfter);
        console.log("Attacker balance after attack:", attackerBalanceAfter);
        
        // 验证攻击是否成功（或被阻止）
        if (attackerBalanceAfter > attackerBalanceBefore + 100 ether) {
            console.log("❌ Reentrancy attack succeeded!");
            // 在实际测试中，这应该失败以证明合约是安全的
        } else {
            console.log("✅ Reentrancy attack was prevented!");
        }
    }
}

contract ReentrancyAttacker {
    Vault public vault;
    Token public token;
    bool public attacking;
    
    constructor(Vault _vault, Token _token) {
        vault = _vault;
        token = _token;
    }
    
    function attack() external {
        token.approve(address(vault), 100 ether);
        vault.deposit(100 ether);
        
        attacking = true;
        vault.withdraw(100 ether);
    }
    
    // 恶意的 receive 函数，在接收 ETH 时触发重入
    receive() external payable {
        if (attacking && address(vault).balance > 0) {
            vault.withdraw(100 ether);
        }
    }
    
    // 对于 ERC20，可能需要实现恶意的 transfer 回调
    function onTokenTransfer(address, uint256) external {
        if (attacking && token.balanceOf(address(vault)) > 100 ether) {
            vault.withdraw(100 ether);
        }
    }
}
```

### 整数溢出/下溢测试

```solidity
contract OverflowTest is Test {
    Calculator public calculator;
    
    function setUp() public {
        calculator = new Calculator();
    }
    
    function test_IntegerOverflow() public {
        uint256 maxUint = type(uint256).max;
        
        // 测试加法溢出
        vm.expectRevert(); // 在 Solidity 0.8+ 中会自动检查溢出
        calculator.add(maxUint, 1);
    }
    
    function test_IntegerUnderflow() public {
        // 测试减法下溢
        vm.expectRevert();
        calculator.subtract(0, 1);
    }
    
    function testFuzz_SafeMath(uint256 a, uint256 b) public {
        // 使用模糊测试检查数学运算的安全性
        if (a > type(uint256).max - b) {
            vm.expectRevert();
            calculator.add(a, b);
        } else {
            uint256 result = calculator.add(a, b);
            assertEq(result, a + b);
        }
    }
}
```

### 访问控制测试

```solidity
contract AccessControlTest is Test {
    SecureVault public vault;
    
    address public constant OWNER = address(0x1);
    address public constant USER = address(0x2);
    address public constant ATTACKER = address(0x3);
    
    function setUp() public {
        vm.prank(OWNER);
        vault = new SecureVault();
    }
    
    function test_OnlyOwnerFunctions() public {
        // 测试只有所有者才能调用的函数
        
        // 所有者可以调用
        vm.prank(OWNER);
        vault.emergencyStop();
        
        // 非所有者不能调用
        vm.prank(ATTACKER);
        vm.expectRevert("Ownable: caller is not the owner");
        vault.emergencyStop();
    }
    
    function test_RoleBasedAccess() public {
        // 测试基于角色的访问控制
        
        // 授予用户角色
        vm.prank(OWNER);
        vault.grantRole(vault.DEPOSITOR_ROLE(), USER);
        
        // 用户可以存款
        vm.prank(USER);
        vault.deposit(100 ether);
        
        // 攻击者不能存款
        vm.prank(ATTACKER);
        vm.expectRevert("AccessControl: account is missing role");
        vault.deposit(100 ether);
    }
    
    function test_PrivilegeEscalation() public {
        // 测试权限提升攻击
        
        vm.prank(OWNER);
        vault.grantRole(vault.DEPOSITOR_ROLE(), USER);
        
        // 用户不能授予自己管理员权限
        vm.prank(USER);
        vm.expectRevert("AccessControl: account is missing role");
        vault.grantRole(vault.ADMIN_ROLE(), USER);
    }
}
```

### 闪电贷攻击测试

```solidity
contract FlashLoanAttackTest is Test {
    DeFiProtocol public protocol;
    FlashLoanProvider public flashLoanProvider;
    FlashLoanAttacker public attacker;
    
    function setUp() public {
        protocol = new DeFiProtocol();
        flashLoanProvider = new FlashLoanProvider();
        attacker = new FlashLoanAttacker(protocol, flashLoanProvider);
        
        // 设置初始流动性
        deal(address(protocol.token()), address(protocol), 1000000 ether);
        deal(address(protocol.token()), address(flashLoanProvider), 1000000 ether);
    }
    
    function test_FlashLoanAttack() public {
        uint256 protocolBalanceBefore = protocol.token().balanceOf(address(protocol));
        uint256 attackerBalanceBefore = protocol.token().balanceOf(address(attacker));
        
        console.log("Protocol balance before:", protocolBalanceBefore);
        console.log("Attacker balance before:", attackerBalanceBefore);
        
        // 执行闪电贷攻击
        attacker.executeAttack(500000 ether);
        
        uint256 protocolBalanceAfter = protocol.token().balanceOf(address(protocol));
        uint256 attackerBalanceAfter = protocol.token().balanceOf(address(attacker));
        
        console.log("Protocol balance after:", protocolBalanceAfter);
        console.log("Attacker balance after:", attackerBalanceAfter);
        
        // 检查攻击是否成功
        if (attackerBalanceAfter > attackerBalanceBefore) {
            console.log("❌ Flash loan attack succeeded!");
            console.log("Profit:", attackerBalanceAfter - attackerBalanceBefore);
        }
    }
}

contract FlashLoanAttacker {
    DeFiProtocol public protocol;
    FlashLoanProvider public flashLoanProvider;
    
    constructor(DeFiProtocol _protocol, FlashLoanProvider _flashLoanProvider) {
        protocol = _protocol;
        flashLoanProvider = _flashLoanProvider;
    }
    
    function executeAttack(uint256 amount) external {
        // 1. 获取闪电贷
        flashLoanProvider.flashLoan(amount, address(this));
    }
    
    function onFlashLoan(uint256 amount) external {
        // 2. 利用闪电贷资金操纵价格
        protocol.manipulatePrice(amount);
        
        // 3. 在有利的价格下进行交易
        uint256 profit = protocol.arbitrage();
        
        // 4. 还款
        IERC20(protocol.token()).transfer(msg.sender, amount + flashLoanProvider.fee());
        
        // 5. 保留利润
        // 利润留在合约中
    }
}
```

## 经济攻击测试

### 通胀攻击测试

```solidity
contract InflationAttackTest is Test {
    Vault public vault;
    Token public token;
    
    address public constant ATTACKER = address(0x1);
    address public constant VICTIM = address(0x2);
    
    function setUp() public {
        token = new Token();
        vault = new Vault(address(token));
        
        // 分配代币
        token.mint(ATTACKER, 1000 ether);
        token.mint(VICTIM, 1000 ether);
        
        // 授权
        vm.prank(ATTACKER);
        token.approve(address(vault), type(uint256).max);
        
        vm.prank(VICTIM);
        token.approve(address(vault), type(uint256).max);
    }
    
    function test_InflationAttack() public {
        console.log("=== Inflation Attack Test ===");
        
        // 1. 攻击者存入最小金额
        vm.prank(ATTACKER);
        vault.deposit(1); // 1 wei
        
        console.log("Step 1 - Attacker deposits 1 wei");
        console.log("Attacker shares:", vault.balanceOf(ATTACKER));
        console.log("Total supply:", vault.totalSupply());
        
        // 2. 攻击者直接转账大量代币给vault（绕过deposit函数）
        vm.prank(ATTACKER);
        token.transfer(address(vault), 1000 ether);
        
        console.log("Step 2 - Attacker transfers 1000 tokens to vault");
        console.log("Vault token balance:", token.balanceOf(address(vault)));
        
        // 3. 受害者尝试存款
        vm.prank(VICTIM);
        vault.deposit(1000 ether);
        
        console.log("Step 3 - Victim deposits 1000 tokens");
        console.log("Victim shares:", vault.balanceOf(VICTIM));
        console.log("Total supply:", vault.totalSupply());
        
        // 4. 检查攻击结果
        uint256 attackerShares = vault.balanceOf(ATTACKER);
        uint256 victimShares = vault.balanceOf(VICTIM);
        
        if (victimShares == 0) {
            console.log("❌ Inflation attack succeeded!");
            console.log("Victim received 0 shares for 1000 tokens");
        } else {
            console.log("✅ Inflation attack prevented!");
        }
        
        // 5. 攻击者提取资金
        if (attackerShares > 0) {
            vm.prank(ATTACKER);
            vault.withdraw(attackerShares);
            
            uint256 attackerFinalBalance = token.balanceOf(ATTACKER);
            console.log("Attacker final balance:", attackerFinalBalance);
            
            if (attackerFinalBalance > 1000 ether) {
                console.log("Attacker profit:", attackerFinalBalance - 1000 ether);
            }
        }
    }
}
```

### MEV 攻击测试

```solidity
contract MEVAttackTest is Test {
    DEX public dex;
    Token public tokenA;
    Token public tokenB;
    
    address public constant VICTIM = address(0x1);
    address public constant MEV_BOT = address(0x2);
    
    function setUp() public {
        tokenA = new Token("Token A", "TKA");
        tokenB = new Token("Token B", "TKB");
        dex = new DEX(address(tokenA), address(tokenB));
        
        // 设置流动性
        tokenA.mint(address(dex), 10000 ether);
        tokenB.mint(address(dex), 10000 ether);
        
        // 给用户分配代币
        tokenA.mint(VICTIM, 1000 ether);
        tokenA.mint(MEV_BOT, 1000 ether);
        tokenB.mint(MEV_BOT, 1000 ether);
    }
    
    function test_SandwichAttack() public {
        console.log("=== Sandwich Attack Test ===");
        
        // 受害者准备进行大额交易
        uint256 victimSwapAmount = 500 ether;
        
        // MEV Bot 检测到待处理交易并进行抢跑
        console.log("Step 1: MEV Bot front-runs victim");
        vm.prank(MEV_BOT);
        uint256 frontRunAmount = dex.swapAForB(200 ether);
        console.log("MEV Bot receives:", frontRunAmount);
        
        // 受害者的交易在更差的价格下执行
        console.log("Step 2: Victim's transaction executes");
        vm.prank(VICTIM);
        uint256 victimReceived = dex.swapAForB(victimSwapAmount);
        console.log("Victim receives:", victimReceived);
        
        // MEV Bot 立即卖出获利
        console.log("Step 3: MEV Bot back-runs for profit");
        vm.prank(MEV_BOT);
        uint256 backRunAmount = dex.swapBForA(frontRunAmount);
        console.log("MEV Bot gets back:", backRunAmount);
        
        // 计算 MEV Bot 的利润
        uint256 mevProfit = backRunAmount > 200 ether ? backRunAmount - 200 ether : 0;
        console.log("MEV Bot profit:", mevProfit);
        
        if (mevProfit > 0) {
            console.log("❌ Sandwich attack succeeded!");
        }
    }
}
```

## 治理攻击测试

### 治理代币攻击

```solidity
contract GovernanceAttackTest is Test {
    GovernanceToken public govToken;
    DAO public dao;
    
    address public constant ATTACKER = address(0x1);
    address public constant HONEST_USER = address(0x2);
    
    function setUp() public {
        govToken = new GovernanceToken();
        dao = new DAO(address(govToken));
        
        // 分配治理代币
        govToken.mint(HONEST_USER, 1000 ether);
        govToken.mint(ATTACKER, 600 ether); // 攻击者持有少数代币
    }
    
    function test_FlashLoanGovernanceAttack() public {
        console.log("=== Flash Loan Governance Attack ===");
        
        // 1. 攻击者创建恶意提案
        vm.prank(ATTACKER);
        uint256 proposalId = dao.propose("Malicious proposal to drain treasury");
        
        // 2. 攻击者通过闪电贷临时获得大量治理代币
        FlashLoanProvider flashLoanProvider = new FlashLoanProvider();
        govToken.mint(address(flashLoanProvider), 10000 ether);
        
        // 3. 执行闪电贷攻击
        GovernanceAttacker attacker = new GovernanceAttacker(dao, govToken, flashLoanProvider);
        govToken.mint(address(attacker), 100 ether); // 手续费
        
        attacker.executeGovernanceAttack(proposalId, 2000 ether);
        
        // 4. 检查提案是否通过
        bool proposalPassed = dao.proposalPassed(proposalId);
        
        if (proposalPassed) {
            console.log("❌ Governance attack succeeded!");
            console.log("Malicious proposal passed with flash-loaned tokens");
        } else {
            console.log("✅ Governance attack prevented!");
        }
    }
}

contract GovernanceAttacker {
    DAO public dao;
    GovernanceToken public govToken;
    FlashLoanProvider public flashLoanProvider;
    
    constructor(DAO _dao, GovernanceToken _govToken, FlashLoanProvider _flashLoanProvider) {
        dao = _dao;
        govToken = _govToken;
        flashLoanProvider = _flashLoanProvider;
    }
    
    function executeGovernanceAttack(uint256 proposalId, uint256 loanAmount) external {
        flashLoanProvider.flashLoan(loanAmount, address(this));
    }
    
    function onFlashLoan(uint256 amount) external {
        // 1. 用借来的代币投票
        dao.vote(proposalId, true);
        
        // 2. 还款
        govToken.transfer(msg.sender, amount + flashLoanProvider.fee());
    }
}
```

## 预言机攻击测试

### 价格操纵攻击

```solidity
contract OracleAttackTest is Test {
    PriceOracle public oracle;
    LendingProtocol public lendingProtocol;
    DEX public dex;
    
    address public constant ATTACKER = address(0x1);
    
    function setUp() public {
        dex = new DEX();
        oracle = new PriceOracle(address(dex)); // 使用 DEX 作为价格源
        lendingProtocol = new LendingProtocol(address(oracle));
        
        // 设置初始流动性
        deal(address(dex.tokenA()), address(dex), 10000 ether);
        deal(address(dex.tokenB()), address(dex), 10000 ether);
        
        // 给攻击者分配大量资金
        deal(address(dex.tokenA()), ATTACKER, 50000 ether);
    }
    
    function test_OraclePriceManipulation() public {
        console.log("=== Oracle Price Manipulation Attack ===");
        
        // 1. 记录初始价格
        uint256 initialPrice = oracle.getPrice();
        console.log("Initial price:", initialPrice);
        
        // 2. 攻击者操纵 DEX 价格
        vm.prank(ATTACKER);
        dex.swap(address(dex.tokenA()), 40000 ether); // 大额交易影响价格
        
        uint256 manipulatedPrice = oracle.getPrice();
        console.log("Manipulated price:", manipulatedPrice);
        
        // 3. 攻击者利用错误价格进行借贷
        vm.prank(ATTACKER);
        uint256 borrowAmount = lendingProtocol.calculateMaxBorrow(1000 ether);
        
        vm.prank(ATTACKER);
        lendingProtocol.borrow(borrowAmount);
        
        console.log("Borrowed amount:", borrowAmount);
        
        // 4. 攻击者恢复价格（可选）
        // 在实际攻击中，攻击者可能会在同一笔交易中恢复价格
        
        // 5. 检查攻击是否成功
        uint256 attackerProfit = calculateProfit();
        
        if (attackerProfit > 0) {
            console.log("❌ Oracle manipulation attack succeeded!");
            console.log("Attacker profit:", attackerProfit);
        }
    }
    
    function calculateProfit() internal view returns (uint256) {
        // 计算攻击者的净利润
        return 0; // 简化实现
    }
}
```

## 模糊测试安全性

### 安全属性模糊测试

```solidity
contract SecurityFuzzTest is Test {
    Vault public vault;
    Token public token;
    
    function setUp() public {
        token = new Token();
        vault = new Vault(address(token));
    }
    
    // 测试不变量：用户不能提取超过他们拥有的份额
    function testFuzz_CannotWithdrawMoreThanOwned(
        address user,
        uint256 depositAmount,
        uint256 withdrawAmount
    ) public {
        vm.assume(user != address(0));
        vm.assume(depositAmount > 0 && depositAmount <= 1000000 ether);
        
        // 给用户代币并存款
        deal(address(token), user, depositAmount);
        vm.prank(user);
        token.approve(address(vault), depositAmount);
        vm.prank(user);
        vault.deposit(depositAmount);
        
        uint256 userShares = vault.balanceOf(user);
        
        if (withdrawAmount > userShares) {
            // 应该回滚
            vm.prank(user);
            vm.expectRevert();
            vault.withdraw(withdrawAmount);
        } else {
            // 应该成功
            vm.prank(user);
            vault.withdraw(withdrawAmount);
            assertEq(vault.balanceOf(user), userShares - withdrawAmount);
        }
    }
    
    // 测试不变量：总供应量始终等于用户份额之和
    function testFuzz_TotalSupplyInvariant(
        address[5] memory users,
        uint256[5] memory amounts
    ) public {
        uint256 totalDeposited = 0;
        
        for (uint256 i = 0; i < users.length; i++) {
            vm.assume(users[i] != address(0));
            amounts[i] = bound(amounts[i], 0, 1000 ether);
            
            if (amounts[i] > 0) {
                deal(address(token), users[i], amounts[i]);
                vm.prank(users[i]);
                token.approve(address(vault), amounts[i]);
                vm.prank(users[i]);
                vault.deposit(amounts[i]);
                totalDeposited += amounts[i];
            }
        }
        
        // 验证不变量
        uint256 totalShares = 0;
        for (uint256 i = 0; i < users.length; i++) {
            totalShares += vault.balanceOf(users[i]);
        }
        
        assertEq(vault.totalSupply(), totalShares);
    }
    
    // 测试权限：只有代币持有者能够转账
    function testFuzz_OnlyTokenHolderCanTransfer(
        address from,
        address to,
        uint256 amount
    ) public {
        vm.assume(from != address(0) && to != address(0));
        vm.assume(from != to);
        amount = bound(amount, 1, 1000 ether);
        
        // 给 from 分配代币
        deal(address(token), from, amount);
        
        // from 应该能够转账
        vm.prank(from);
        bool success = token.transfer(to, amount);
        assertTrue(success);
        assertEq(token.balanceOf(to), amount);
        
        // 其他人不应该能够从 from 转账（除非有授权）
        address unauthorized = address(0x999);
        vm.assume(unauthorized != from && unauthorized != to);
        
        vm.prank(unauthorized);
        vm.expectRevert();
        token.transferFrom(from, to, 1);
    }
}
```

## 静态分析集成

### Slither 集成

```bash
#!/bin/bash
# scripts/security-analysis.sh

echo "🔒 Running security analysis..."

# 1. 运行 Slither
echo "Running Slither analysis..."
slither . \
    --exclude-dependencies \
    --exclude-informational \
    --exclude-low \
    --json slither-report.json

# 2. 分析结果
python3 scripts/analyze-slither.py slither-report.json

# 3. 运行 Mythril（如果安装了）
if command -v myth &> /dev/null; then
    echo "Running Mythril analysis..."
    myth analyze contracts/Vault.sol --solv 0.8.19
fi

# 4. 运行自定义安全检查
echo "Running custom security checks..."
forge test --match-contract "SecurityTest" -vv

echo "✅ Security analysis completed!"
```

### 自动化安全检查

```python
# scripts/analyze-slither.py
import json
import sys

def analyze_slither_report(report_path):
    """分析 Slither 报告并生成总结"""
    
    with open(report_path, 'r') as f:
        report = json.load(f)
    
    detectors = report.get('results', {}).get('detectors', [])
    
    # 按严重程度分类
    issues = {
        'High': [],
        'Medium': [],
        'Low': [],
        'Informational': []
    }
    
    for detector in detectors:
        impact = detector.get('impact', 'Informational')
        issues[impact].append(detector)
    
    # 生成报告
    print("🔍 Slither Analysis Summary")
    print("=" * 50)
    
    total_issues = sum(len(issues[severity]) for severity in issues)
    
    if total_issues == 0:
        print("✅ No security issues found!")
        return True
    
    for severity in ['High', 'Medium', 'Low', 'Informational']:
        count = len(issues[severity])
        if count > 0:
            print(f"{severity}: {count} issues")
            for issue in issues[severity]:
                print(f"  - {issue.get('check', 'Unknown')}: {issue.get('description', 'No description')}")
    
    # 设置退出码
    if len(issues['High']) > 0:
        print("\n❌ High severity issues found!")
        return False
    elif len(issues['Medium']) > 3:  # 允许少量中等严重程度问题
        print("\n⚠️  Too many medium severity issues!")
        return False
    
    print("\n✅ Security analysis passed!")
    return True

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python analyze-slither.py <report.json>")
        sys.exit(1)
    
    success = analyze_slither_report(sys.argv[1])
    sys.exit(0 if success else 1)
```

## 安全测试最佳实践

### 1. 全面的测试覆盖

```solidity
contract ComprehensiveSecurityTest is Test {
    // 测试所有可能的攻击向量
    function test_AllAttackVectors() public {
        _testReentrancy();
        _testIntegerOverflow();
        _testAccessControl();
        _testFrontRunning();
        _testFlashLoanAttacks();
        _testGovernanceAttacks();
        _testOracleManipulation();
    }
    
    function _testReentrancy() internal {
        // 重入攻击测试
    }
    
    function _testIntegerOverflow() internal {
        // 整数溢出测试
    }
    
    // ... 其他测试函数
}
```

### 2. 边界条件测试

```solidity
contract BoundarySecurityTest is Test {
    function test_EdgeCases() public {
        // 测试极值
        _testWithMaxUint();
        _testWithZeroValues();
        _testWithMinimalValues();
        
        // 测试边界状态
        _testEmptyContract();
        _testFullContract();
    }
    
    function _testWithMaxUint() internal {
        uint256 maxVal = type(uint256).max;
        // 使用最大值进行测试
    }
    
    function _testWithZeroValues() internal {
        // 使用零值进行测试
    }
}
```

### 3. 状态机安全测试

```solidity
contract StateMachineSecurityTest is Test {
    enum State { Inactive, Active, Paused, Terminated }
    
    function test_IllegalStateTransitions() public {
        // 测试非法状态转换
        
        // 应该不能从 Inactive 直接到 Terminated
        vm.expectRevert("Invalid state transition");
        contract.setState(State.Terminated);
        
        // 测试所有可能的状态转换
        _testAllStateTransitions();
    }
    
    function _testAllStateTransitions() internal {
        State[4] memory states = [State.Inactive, State.Active, State.Paused, State.Terminated];
        
        for (uint i = 0; i < states.length; i++) {
            for (uint j = 0; j < states.length; j++) {
                if (i != j) {
                    _testStateTransition(states[i], states[j]);
                }
            }
        }
    }
    
    function _testStateTransition(State from, State to) internal {
        // 测试特定的状态转换
    }
}
```

## 持续安全监控

### 自动化安全检查

```yaml
# .github/workflows/security.yml
name: Security Checks

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 2 * * *'  # 每天凌晨2点运行

jobs:
  security-analysis:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: recursive

      - name: Install Foundry
        uses: foundry-rs/foundry-toolchain@v1

      - name: Install Slither
        run: |
          pip3 install slither-analyzer
          pip3 install solc-select
          solc-select install 0.8.19
          solc-select use 0.8.19

      - name: Run security tests
        run: |
          forge test --match-contract "SecurityTest" --gas-report

      - name: Run Slither analysis
        run: |
          slither . --exclude-dependencies --json slither-report.json

      - name: Analyze results
        run: |
          python3 scripts/analyze-slither.py slither-report.json

      - name: Upload security report
        uses: actions/upload-artifact@v3
        with:
          name: security-report
          path: |
            slither-report.json
            gas-report.txt
```

## 总结

安全测试是智能合约开发的关键环节，需要：

1. **全面覆盖**: 测试所有已知的攻击向量
2. **自动化**: 集成到 CI/CD 流程中
3. **持续监控**: 定期运行安全检查
4. **多层防护**: 结合静态分析、动态测试和人工审计
5. **及时更新**: 跟上最新的安全威胁和防护措施

通过系统性的安全测试，可以大大提高智能合约的安全性和可靠性。

## 下一步

完成安全测试学习后，继续学习：

1. [实战案例](./09-real-world-examples.md)
2. [故障排除](./10-troubleshooting.md)
3. [高级技巧](./11-advanced-techniques.md)
