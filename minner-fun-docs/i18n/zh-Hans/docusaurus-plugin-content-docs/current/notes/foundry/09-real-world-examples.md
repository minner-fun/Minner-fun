# 9、实战案例分析

本指南通过真实的DeFi项目案例，展示如何使用Foundry进行全面的智能合约测试。

## 案例1：ERC20代币合约测试

### 合约实现

```solidity
// src/MyToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract MyToken is ERC20, Ownable, Pausable {
    uint256 public constant MAX_SUPPLY = 1000000 * 10**18; // 1M tokens
    uint256 public constant MINT_RATE = 100 * 10**18; // 100 tokens per mint
    
    mapping(address => bool) public minters;
    mapping(address => uint256) public lastMintTime;
    uint256 public mintCooldown = 1 days;
    
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    
    constructor() ERC20("MyToken", "MTK") {}
    
    function mint(address to, uint256 amount) external {
        require(minters[msg.sender] || msg.sender == owner(), "Not authorized to mint");
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        require(amount <= MINT_RATE, "Exceeds mint rate");
        require(block.timestamp >= lastMintTime[msg.sender] + mintCooldown, "Mint cooldown active");
        
        lastMintTime[msg.sender] = block.timestamp;
        _mint(to, amount);
    }
    
    function addMinter(address minter) external onlyOwner {
        minters[minter] = true;
        emit MinterAdded(minter);
    }
    
    function removeMinter(address minter) external onlyOwner {
        minters[minter] = false;
        emit MinterRemoved(minter);
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);
        require(!paused(), "Token transfers paused");
    }
}
```

### 全面测试套件

```solidity
// test/MyToken.t.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test, console} from "forge-std/Test.sol";
import {MyToken} from "../src/MyToken.sol";

contract MyTokenTest is Test {
    MyToken public token;
    
    address public constant OWNER = address(0x1);
    address public constant MINTER = address(0x2);
    address public constant USER = address(0x3);
    address public constant ATTACKER = address(0x4);
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    
    function setUp() public {
        vm.prank(OWNER);
        token = new MyToken();
    }
    
    // ============ 基础功能测试 ============
    
    function test_InitialState() public {
        assertEq(token.name(), "MyToken");
        assertEq(token.symbol(), "MTK");
        assertEq(token.decimals(), 18);
        assertEq(token.totalSupply(), 0);
        assertEq(token.owner(), OWNER);
        assertFalse(token.paused());
    }
    
    function test_OwnerCanMint() public {
        uint256 mintAmount = 100 * 10**18;
        
        vm.prank(OWNER);
        token.mint(USER, mintAmount);
        
        assertEq(token.balanceOf(USER), mintAmount);
        assertEq(token.totalSupply(), mintAmount);
    }
    
    function test_AuthorizedMinterCanMint() public {
        // 授权铸币者
        vm.prank(OWNER);
        token.addMinter(MINTER);
        
        assertTrue(token.minters(MINTER));
        
        // 铸币者铸币
        uint256 mintAmount = 50 * 10**18;
        vm.prank(MINTER);
        token.mint(USER, mintAmount);
        
        assertEq(token.balanceOf(USER), mintAmount);
    }
    
    // ============ 权限控制测试 ============
    
    function test_OnlyOwnerCanAddMinter() public {
        vm.prank(OWNER);
        token.addMinter(MINTER);
        assertTrue(token.minters(MINTER));
        
        // 非所有者不能添加铸币者
        vm.prank(ATTACKER);
        vm.expectRevert("Ownable: caller is not the owner");
        token.addMinter(address(0x5));
    }
    
    function test_OnlyOwnerCanRemoveMinter() public {
        // 先添加铸币者
        vm.prank(OWNER);
        token.addMinter(MINTER);
        
        // 所有者移除铸币者
        vm.prank(OWNER);
        token.removeMinter(MINTER);
        assertFalse(token.minters(MINTER));
        
        // 非所有者不能移除铸币者
        vm.prank(OWNER);
        token.addMinter(MINTER);
        
        vm.prank(ATTACKER);
        vm.expectRevert("Ownable: caller is not the owner");
        token.removeMinter(MINTER);
    }
    
    function test_UnauthorizedCannotMint() public {
        vm.prank(ATTACKER);
        vm.expectRevert("Not authorized to mint");
        token.mint(ATTACKER, 100 * 10**18);
    }
    
    // ============ 铸币限制测试 ============
    
    function test_CannotExceedMaxSupply() public {
        uint256 maxSupply = token.MAX_SUPPLY();
        
        vm.prank(OWNER);
        vm.expectRevert("Exceeds max supply");
        token.mint(USER, maxSupply + 1);
    }
    
    function test_CannotExceedMintRate() public {
        uint256 mintRate = token.MINT_RATE();
        
        vm.prank(OWNER);
        vm.expectRevert("Exceeds mint rate");
        token.mint(USER, mintRate + 1);
    }
    
    function test_MintCooldown() public {
        uint256 mintAmount = 50 * 10**18;
        
        // 第一次铸币
        vm.prank(OWNER);
        token.mint(USER, mintAmount);
        
        // 立即再次铸币应该失败
        vm.prank(OWNER);
        vm.expectRevert("Mint cooldown active");
        token.mint(USER, mintAmount);
        
        // 等待冷却时间后应该成功
        vm.warp(block.timestamp + 1 days + 1);
        vm.prank(OWNER);
        token.mint(USER, mintAmount);
        
        assertEq(token.balanceOf(USER), mintAmount * 2);
    }
    
    // ============ 暂停功能测试 ============
    
    function test_OnlyOwnerCanPause() public {
        vm.prank(OWNER);
        token.pause();
        assertTrue(token.paused());
        
        vm.prank(ATTACKER);
        vm.expectRevert("Ownable: caller is not the owner");
        token.unpause();
    }
    
    function test_CannotTransferWhenPaused() public {
        // 先铸币
        vm.prank(OWNER);
        token.mint(USER, 100 * 10**18);
        
        // 暂停合约
        vm.prank(OWNER);
        token.pause();
        
        // 转账应该失败
        vm.prank(USER);
        vm.expectRevert("Token transfers paused");
        token.transfer(address(0x5), 50 * 10**18);
        
        // 解除暂停后转账应该成功
        vm.prank(OWNER);
        token.unpause();
        
        vm.prank(USER);
        bool success = token.transfer(address(0x5), 50 * 10**18);
        assertTrue(success);
    }
    
    // ============ 事件测试 ============
    
    function test_MinterAddedEvent() public {
        vm.expectEmit(true, false, false, false);
        emit MinterAdded(MINTER);
        
        vm.prank(OWNER);
        token.addMinter(MINTER);
    }
    
    function test_TransferEvent() public {
        uint256 mintAmount = 100 * 10**18;
        
        vm.expectEmit(true, true, false, true);
        emit Transfer(address(0), USER, mintAmount);
        
        vm.prank(OWNER);
        token.mint(USER, mintAmount);
    }
    
    // ============ 模糊测试 ============
    
    function testFuzz_Mint(address to, uint256 amount) public {
        vm.assume(to != address(0));
        amount = bound(amount, 1, token.MINT_RATE());
        
        vm.prank(OWNER);
        token.mint(to, amount);
        
        assertEq(token.balanceOf(to), amount);
        assertEq(token.totalSupply(), amount);
    }
    
    function testFuzz_Transfer(uint256 mintAmount, uint256 transferAmount) public {
        mintAmount = bound(mintAmount, 1, token.MINT_RATE());
        transferAmount = bound(transferAmount, 0, mintAmount);
        
        // 铸币给用户
        vm.prank(OWNER);
        token.mint(USER, mintAmount);
        
        // 用户转账
        vm.prank(USER);
        bool success = token.transfer(address(0x5), transferAmount);
        assertTrue(success);
        
        assertEq(token.balanceOf(USER), mintAmount - transferAmount);
        assertEq(token.balanceOf(address(0x5)), transferAmount);
    }
    
    // ============ 集成测试 ============
    
    function test_CompleteWorkflow() public {
        console.log("=== Complete Token Workflow Test ===");
        
        // 1. 添加铸币者
        vm.prank(OWNER);
        token.addMinter(MINTER);
        console.log("Step 1: Minter added");
        
        // 2. 铸币者铸币
        uint256 mintAmount = 100 * 10**18;
        vm.prank(MINTER);
        token.mint(USER, mintAmount);
        console.log("Step 2: Tokens minted to user");
        
        // 3. 用户转账
        vm.prank(USER);
        token.transfer(address(0x5), 30 * 10**18);
        console.log("Step 3: User transferred tokens");
        
        // 4. 暂停合约
        vm.prank(OWNER);
        token.pause();
        console.log("Step 4: Contract paused");
        
        // 5. 验证暂停期间不能转账
        vm.prank(USER);
        vm.expectRevert("Token transfers paused");
        token.transfer(address(0x6), 10 * 10**18);
        console.log("Step 5: Transfers blocked during pause");
        
        // 6. 解除暂停
        vm.prank(OWNER);
        token.unpause();
        console.log("Step 6: Contract unpaused");
        
        // 7. 验证最终状态
        assertEq(token.balanceOf(USER), 70 * 10**18);
        assertEq(token.balanceOf(address(0x5)), 30 * 10**18);
        assertEq(token.totalSupply(), 100 * 10**18);
        console.log("Step 7: Final state verified");
    }
    
    // ============ Gas 优化测试 ============
    
    function test_GasOptimization() public {
        uint256 gasBefore;
        uint256 gasAfter;
        
        // 测试铸币 gas 消耗
        gasBefore = gasleft();
        vm.prank(OWNER);
        token.mint(USER, 100 * 10**18);
        gasAfter = gasleft();
        
        uint256 mintGas = gasBefore - gasAfter;
        console.log("Mint gas:", mintGas);
        assertLt(mintGas, 100000, "Mint should use less than 100k gas");
        
        // 测试转账 gas 消耗
        gasBefore = gasleft();
        vm.prank(USER);
        token.transfer(address(0x5), 50 * 10**18);
        gasAfter = gasleft();
        
        uint256 transferGas = gasBefore - gasAfter;
        console.log("Transfer gas:", transferGas);
        assertLt(transferGas, 80000, "Transfer should use less than 80k gas");
    }
}
```

## 案例2：AMM交易所测试

### 复杂的AMM测试场景

```solidity
// test/AMM_RealWorld.t.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test, console} from "forge-std/Test.sol";
import {AMM} from "../src/AMM.sol";
import {ERC20Mock} from "./mocks/ERC20Mock.sol";

contract AMM_RealWorldTest is Test {
    AMM public amm;
    ERC20Mock public tokenA;
    ERC20Mock public tokenB;
    
    // 真实场景中的用户角色
    address public constant LIQUIDITY_PROVIDER = address(0x1);
    address public constant WHALE_TRADER = address(0x2);
    address public constant RETAIL_TRADER = address(0x3);
    address public constant ARBITRAGEUR = address(0x4);
    address public constant MEV_BOT = address(0x5);
    
    uint256 public constant INITIAL_LIQUIDITY = 1000000 * 10**18; // 1M tokens
    
    function setUp() public {
        tokenA = new ERC20Mock("Token A", "TKA", 18);
        tokenB = new ERC20Mock("Token B", "TKB", 18);
        amm = new AMM(address(tokenA), address(tokenB));
        
        // 为不同角色分配不同数量的代币
        _setupUsers();
        _addInitialLiquidity();
    }
    
    function _setupUsers() internal {
        // 流动性提供者 - 大量代币
        tokenA.mint(LIQUIDITY_PROVIDER, INITIAL_LIQUIDITY);
        tokenB.mint(LIQUIDITY_PROVIDER, INITIAL_LIQUIDITY);
        
        // 大户交易者 - 中等数量
        tokenA.mint(WHALE_TRADER, 100000 * 10**18);
        tokenB.mint(WHALE_TRADER, 100000 * 10**18);
        
        // 散户交易者 - 少量代币
        tokenA.mint(RETAIL_TRADER, 1000 * 10**18);
        tokenB.mint(RETAIL_TRADER, 1000 * 10**18);
        
        // 套利者和MEV机器人
        tokenA.mint(ARBITRAGEUR, 50000 * 10**18);
        tokenB.mint(ARBITRAGEUR, 50000 * 10**18);
        tokenA.mint(MEV_BOT, 20000 * 10**18);
        tokenB.mint(MEV_BOT, 20000 * 10**18);
        
        // 批准AMM使用代币
        address[] memory users = new address[](5);
        users[0] = LIQUIDITY_PROVIDER;
        users[1] = WHALE_TRADER;
        users[2] = RETAIL_TRADER;
        users[3] = ARBITRAGEUR;
        users[4] = MEV_BOT;
        
        for (uint i = 0; i < users.length; i++) {
            vm.startPrank(users[i]);
            tokenA.approve(address(amm), type(uint256).max);
            tokenB.approve(address(amm), type(uint256).max);
            vm.stopPrank();
        }
    }
    
    function _addInitialLiquidity() internal {
        vm.prank(LIQUIDITY_PROVIDER);
        amm.addLiquidity(500000 * 10**18, 500000 * 10**18);
    }
    
    // ============ 真实交易场景测试 ============
    
    function test_HighVolumeTrading() public {
        console.log("=== High Volume Trading Scenario ===");
        
        uint256 initialK = amm.reserve0() * amm.reserve1();
        console.log("Initial K:", initialK);
        
        // 模拟一天的高频交易
        for (uint256 i = 0; i < 100; i++) {
            // 随机选择交易者和方向
            address trader = i % 2 == 0 ? WHALE_TRADER : RETAIL_TRADER;
            bool swapAForB = i % 3 == 0;
            
            uint256 amount = trader == WHALE_TRADER ? 
                1000 * 10**18 + (i * 100 * 10**18) : 
                10 * 10**18 + (i * 10**18);
            
            vm.prank(trader);
            if (swapAForB) {
                amm.swap(address(tokenA), amount);
            } else {
                amm.swap(address(tokenB), amount);
            }
            
            // 每10笔交易检查一次K值
            if (i % 10 == 0) {
                uint256 currentK = amm.reserve0() * amm.reserve1();
                assertGe(currentK, initialK, "K should not decrease");
            }
        }
        
        uint256 finalK = amm.reserve0() * amm.reserve1();
        console.log("Final K:", finalK);
        console.log("K increase:", finalK - initialK);
        
        // 验证手续费累积
        assertGt(finalK, initialK, "K should increase due to fees");
    }
    
    function test_MarketMakingStrategy() public {
        console.log("=== Market Making Strategy Test ===");
        
        // 流动性提供者采用市场做市策略
        uint256 initialShares = amm.balanceOf(LIQUIDITY_PROVIDER);
        
        // 价格波动时调整流动性
        for (uint256 i = 0; i < 10; i++) {
            // 大户交易影响价格
            vm.prank(WHALE_TRADER);
            amm.swap(address(tokenA), 10000 * 10**18);
            
            uint256 price = (amm.reserve0() * 10**18) / amm.reserve1();
            console.log("Price after trade", i, ":", price);
            
            // 流动性提供者根据价格调整流动性
            if (price > 1.1 * 10**18) { // 价格过高，增加流动性
                vm.prank(LIQUIDITY_PROVIDER);
                amm.addLiquidity(5000 * 10**18, 5000 * 10**18);
            }
        }
        
        uint256 finalShares = amm.balanceOf(LIQUIDITY_PROVIDER);
        console.log("LP shares change:", finalShares > initialShares ? "+" : "-", 
                   finalShares > initialShares ? finalShares - initialShares : initialShares - finalShares);
    }
    
    // ============ MEV和套利测试 ============
    
    function test_MEVSandwichAttack() public {
        console.log("=== MEV Sandwich Attack Simulation ===");
        
        // 检测到大户即将进行大额交易
        uint256 victimTradeSize = 50000 * 10**18;
        
        // MEV Bot 前置交易
        uint256 mevBalanceBefore = tokenB.balanceOf(MEV_BOT);
        
        vm.prank(MEV_BOT);
        uint256 frontRunOutput = amm.swap(address(tokenA), 20000 * 10**18);
        console.log("MEV front-run output:", frontRunOutput);
        
        // 受害者交易（价格已被推高）
        vm.prank(WHALE_TRADER);
        uint256 victimOutput = amm.swap(address(tokenA), victimTradeSize);
        console.log("Victim trade output:", victimOutput);
        
        // MEV Bot 后置交易获利
        vm.prank(MEV_BOT);
        uint256 backRunOutput = amm.swap(address(tokenB), frontRunOutput);
        console.log("MEV back-run output:", backRunOutput);
        
        uint256 mevBalanceAfter = tokenB.balanceOf(MEV_BOT);
        uint256 mevProfit = backRunOutput > 20000 * 10**18 ? 
            backRunOutput - 20000 * 10**18 : 0;
        
        console.log("MEV profit:", mevProfit);
        
        if (mevProfit > 0) {
            console.log("❌ MEV attack successful");
        }
    }
    
    function test_ArbitrageOpportunity() public {
        console.log("=== Arbitrage Opportunity Test ===");
        
        // 创建价格差异（模拟外部市场价格变化）
        vm.prank(WHALE_TRADER);
        amm.swap(address(tokenA), 100000 * 10**18);
        
        uint256 price = (amm.reserve0() * 10**18) / amm.reserve1();
        console.log("Price after large trade:", price);
        
        // 套利者检测到机会
        uint256 arbBalanceBefore = tokenA.balanceOf(ARBITRAGEUR);
        
        // 执行套利
        vm.prank(ARBITRAGEUR);
        uint256 arbAmount = 30000 * 10**18;
        uint256 arbOutput = amm.swap(address(tokenB), arbAmount);
        
        uint256 arbBalanceAfter = tokenA.balanceOf(ARBITRAGEUR);
        uint256 arbProfit = arbBalanceAfter - arbBalanceBefore;
        
        console.log("Arbitrage profit:", arbProfit);
        
        // 验证套利降低了价格偏差
        uint256 newPrice = (amm.reserve0() * 10**18) / amm.reserve1();
        console.log("Price after arbitrage:", newPrice);
        
        assertLt(newPrice, price, "Arbitrage should reduce price deviation");
    }
    
    // ============ 流动性管理测试 ============
    
    function test_ImpermanentLoss() public {
        console.log("=== Impermanent Loss Analysis ===");
        
        uint256 initialTokenA = 100000 * 10**18;
        uint256 initialTokenB = 100000 * 10**18;
        
        // 新的流动性提供者加入
        address newLP = address(0x999);
        tokenA.mint(newLP, initialTokenA);
        tokenB.mint(newLP, initialTokenB);
        
        vm.startPrank(newLP);
        tokenA.approve(address(amm), type(uint256).max);
        tokenB.approve(address(amm), type(uint256).max);
        
        uint256 shares = amm.addLiquidity(initialTokenA, initialTokenB);
        vm.stopPrank();
        
        console.log("LP added liquidity, shares:", shares);
        
        // 市场价格发生大幅变化
        for (uint256 i = 0; i < 20; i++) {
            vm.prank(WHALE_TRADER);
            amm.swap(address(tokenA), 5000 * 10**18);
        }
        
        // LP 移除流动性
        vm.prank(newLP);
        (uint256 amountA, uint256 amountB) = amm.removeLiquidity(shares);
        
        console.log("LP removed - TokenA:", amountA, "TokenB:", amountB);
        
        // 计算无常损失
        uint256 hodlValueA = initialTokenA;
        uint256 hodlValueB = initialTokenB;
        uint256 lpValueA = amountA;
        uint256 lpValueB = amountB;
        
        // 简化的无常损失计算（实际需要考虑价格）
        console.log("HODL value - A:", hodlValueA, "B:", hodlValueB);
        console.log("LP value - A:", lpValueA, "B:", lpValueB);
        
        if (lpValueA + lpValueB < hodlValueA + hodlValueB) {
            console.log("❌ Impermanent loss occurred");
        }
    }
    
    // ============ 压力测试 ============
    
    function test_ExtremeMarketConditions() public {
        console.log("=== Extreme Market Conditions Test ===");
        
        uint256 initialReserve0 = amm.reserve0();
        uint256 initialReserve1 = amm.reserve1();
        
        // 模拟市场崩盘 - 大量单向交易
        for (uint256 i = 0; i < 50; i++) {
            uint256 swapAmount = 1000 * 10**18 * (i + 1);
            
            vm.prank(WHALE_TRADER);
            try amm.swap(address(tokenA), swapAmount) {
                // 交易成功
            } catch {
                console.log("Trade failed at iteration:", i);
                break;
            }
        }
        
        uint256 finalReserve0 = amm.reserve0();
        uint256 finalReserve1 = amm.reserve1();
        
        console.log("Reserve changes - A:", finalReserve0, "B:", finalReserve1);
        
        // 验证池子仍然可操作
        assertGt(finalReserve0, 0, "Reserve0 should not be zero");
        assertGt(finalReserve1, 0, "Reserve1 should not be zero");
        
        // 验证K值增长（手续费累积）
        uint256 finalK = finalReserve0 * finalReserve1;
        uint256 initialK = initialReserve0 * initialReserve1;
        assertGt(finalK, initialK, "K should increase due to fees");
    }
    
    // ============ 长期运营测试 ============
    
    function test_LongTermOperation() public {
        console.log("=== Long Term Operation Test ===");
        
        // 模拟6个月的运营
        uint256 timeStep = 1 days;
        uint256 totalDays = 180;
        
        for (uint256 day = 0; day < totalDays; day += 7) { // 每周测试一次
            // 时间推进
            vm.warp(block.timestamp + timeStep * 7);
            
            // 随机交易活动
            _simulateWeeklyActivity();
            
            // 每月检查一次池子健康度
            if (day % 30 == 0) {
                _checkPoolHealth();
            }
        }
        
        console.log("Long term operation completed successfully");
    }
    
    function _simulateWeeklyActivity() internal {
        // 模拟一周的交易活动
        for (uint256 i = 0; i < 20; i++) {
            address trader = i % 3 == 0 ? WHALE_TRADER : RETAIL_TRADER;
            bool direction = i % 2 == 0;
            
            uint256 amount = trader == WHALE_TRADER ? 
                (1000 + i * 100) * 10**18 : 
                (10 + i) * 10**18;
            
            vm.prank(trader);
            if (direction) {
                amm.swap(address(tokenA), amount);
            } else {
                amm.swap(address(tokenB), amount);
            }
        }
    }
    
    function _checkPoolHealth() internal view {
        uint256 reserve0 = amm.reserve0();
        uint256 reserve1 = amm.reserve1();
        uint256 totalSupply = amm.totalSupply();
        
        // 基本健康检查
        assertGt(reserve0, 1000 * 10**18, "Reserve0 too low");
        assertGt(reserve1, 1000 * 10**18, "Reserve1 too low");
        assertGt(totalSupply, 0, "No liquidity");
        
        // 价格合理性检查
        uint256 price = (reserve0 * 10**18) / reserve1;
        assertGt(price, 0.1 * 10**18, "Price too low");
        assertLt(price, 10 * 10**18, "Price too high");
        
        console.log("Pool health check passed");
    }
}
```

## 案例3：借贷协议测试

### 复杂的DeFi借贷测试

```solidity
// test/LendingProtocol.t.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test, console} from "forge-std/Test.sol";
import {LendingProtocol} from "../src/LendingProtocol.sol";
import {PriceOracle} from "../src/PriceOracle.sol";
import {ERC20Mock} from "./mocks/ERC20Mock.sol";

contract LendingProtocolTest is Test {
    LendingProtocol public lending;
    PriceOracle public oracle;
    ERC20Mock public dai;  // 借贷资产
    ERC20Mock public weth; // 抵押资产
    ERC20Mock public usdc; // 另一种资产
    
    // 用户角色
    address public constant LENDER = address(0x1);
    address public constant BORROWER = address(0x2);
    address public constant LIQUIDATOR = address(0x3);
    address public constant WHALE = address(0x4);
    
    uint256 public constant INITIAL_BALANCE = 1000000 * 10**18;
    
    function setUp() public {
        // 部署代币
        dai = new ERC20Mock("DAI", "DAI", 18);
        weth = new ERC20Mock("WETH", "WETH", 18);
        usdc = new ERC20Mock("USDC", "USDC", 6);
        
        // 部署预言机
        oracle = new PriceOracle();
        oracle.setPrice(address(dai), 1 * 10**18);   // $1
        oracle.setPrice(address(weth), 2000 * 10**18); // $2000
        oracle.setPrice(address(usdc), 1 * 10**18);  // $1
        
        // 部署借贷协议
        lending = new LendingProtocol(address(oracle));
        
        // 添加支持的资产
        lending.addAsset(address(dai), 8000, 500); // 80% LTV, 5% 利率
        lending.addAsset(address(weth), 7500, 200); // 75% LTV, 2% 利率
        lending.addAsset(address(usdc), 8500, 300); // 85% LTV, 3% 利率
        
        // 为用户分配代币
        _setupUsers();
    }
    
    function _setupUsers() internal {
        address[] memory users = new address[](4);
        users[0] = LENDER;
        users[1] = BORROWER;
        users[2] = LIQUIDATOR;
        users[3] = WHALE;
        
        for (uint256 i = 0; i < users.length; i++) {
            dai.mint(users[i], INITIAL_BALANCE);
            weth.mint(users[i], INITIAL_BALANCE / 2000); // 500 WETH
            usdc.mint(users[i], INITIAL_BALANCE / 10**12); // 考虑精度差异
            
            vm.startPrank(users[i]);
            dai.approve(address(lending), type(uint256).max);
            weth.approve(address(lending), type(uint256).max);
            usdc.approve(address(lending), type(uint256).max);
            vm.stopPrank();
        }
    }
    
    // ============ 基础借贷测试 ============
    
    function test_SupplyAndBorrow() public {
        console.log("=== Basic Supply and Borrow Test ===");
        
        // 1. 放贷者提供流动性
        uint256 supplyAmount = 100000 * 10**18; // 100k DAI
        
        vm.prank(LENDER);
        lending.supply(address(dai), supplyAmount);
        
        assertEq(lending.getSupplyBalance(address(dai), LENDER), supplyAmount);
        console.log("Lender supplied:", supplyAmount / 10**18, "DAI");
        
        // 2. 借款者存入抵押品
        uint256 collateralAmount = 50 * 10**18; // 50 WETH
        
        vm.prank(BORROWER);
        lending.supply(address(weth), collateralAmount);
        
        console.log("Borrower supplied collateral:", collateralAmount / 10**18, "WETH");
        
        // 3. 计算最大借款额度
        uint256 maxBorrow = lending.getMaxBorrow(BORROWER, address(dai));
        console.log("Max borrow amount:", maxBorrow / 10**18, "DAI");
        
        // 4. 借款者借款
        uint256 borrowAmount = maxBorrow * 80 / 100; // 借80%的额度
        
        vm.prank(BORROWER);
        lending.borrow(address(dai), borrowAmount);
        
        assertEq(lending.getBorrowBalance(address(dai), BORROWER), borrowAmount);
        assertEq(dai.balanceOf(BORROWER), INITIAL_BALANCE + borrowAmount);
        
        console.log("Borrowed:", borrowAmount / 10**18, "DAI");
        
        // 5. 检查健康因子
        uint256 healthFactor = lending.getHealthFactor(BORROWER);
        console.log("Health factor:", healthFactor);
        assertGt(healthFactor, 10**18, "Health factor should be > 1");
    }
    
    // ============ 清算测试 ============
    
    function test_Liquidation() public {
        console.log("=== Liquidation Test ===");
        
        // 设置借贷场景
        vm.prank(LENDER);
        lending.supply(address(dai), 200000 * 10**18);
        
        vm.prank(BORROWER);
        lending.supply(address(weth), 100 * 10**18); // 100 WETH抵押
        
        uint256 maxBorrow = lending.getMaxBorrow(BORROWER, address(dai));
        uint256 borrowAmount = maxBorrow * 95 / 100; // 借95%接近清算线
        
        vm.prank(BORROWER);
        lending.borrow(address(dai), borrowAmount);
        
        console.log("Initial health factor:", lending.getHealthFactor(BORROWER));
        
        // 价格下跌触发清算条件
        oracle.setPrice(address(weth), 1500 * 10**18); // WETH价格从$2000跌到$1500
        
        uint256 newHealthFactor = lending.getHealthFactor(BORROWER);
        console.log("Health factor after price drop:", newHealthFactor);
        assertLt(newHealthFactor, 10**18, "Should be undercollateralized");
        
        // 清算者执行清算
        uint256 liquidateAmount = borrowAmount * 50 / 100; // 清算50%
        
        uint256 liquidatorDAIBefore = dai.balanceOf(LIQUIDATOR);
        uint256 liquidatorWETHBefore = weth.balanceOf(LIQUIDATOR);
        
        vm.prank(LIQUIDATOR);
        lending.liquidate(BORROWER, address(dai), address(weth), liquidateAmount);
        
        uint256 liquidatorDAIAfter = dai.balanceOf(LIQUIDATOR);
        uint256 liquidatorWETHAfter = weth.balanceOf(LIQUIDATOR);
        
        console.log("Liquidator DAI change:", (liquidatorDAIBefore - liquidatorDAIAfter) / 10**18);
        console.log("Liquidator WETH gain:", (liquidatorWETHAfter - liquidatorWETHBefore) / 10**18);
        
        // 验证清算结果
        assertLt(lending.getBorrowBalance(address(dai), BORROWER), borrowAmount);
        assertGt(lending.getHealthFactor(BORROWER), newHealthFactor);
        
        console.log("Final health factor:", lending.getHealthFactor(BORROWER));
    }
    
    // ============ 利率测试 ============
    
    function test_InterestAccrual() public {
        console.log("=== Interest Accrual Test ===");
        
        // 设置借贷
        vm.prank(LENDER);
        lending.supply(address(dai), 100000 * 10**18);
        
        vm.prank(BORROWER);
        lending.supply(address(weth), 50 * 10**18);
        
        uint256 borrowAmount = 50000 * 10**18; // 50k DAI
        vm.prank(BORROWER);
        lending.borrow(address(dai), borrowAmount);
        
        uint256 initialDebt = lending.getBorrowBalance(address(dai), BORROWER);
        console.log("Initial debt:", initialDebt / 10**18, "DAI");
        
        // 时间推进1年
        vm.warp(block.timestamp + 365 days);
        
        // 触发利息计算
        lending.accrueInterest(address(dai));
        
        uint256 finalDebt = lending.getBorrowBalance(address(dai), BORROWER);
        uint256 interest = finalDebt - initialDebt;
        
        console.log("Final debt:", finalDebt / 10**18, "DAI");
        console.log("Interest accrued:", interest / 10**18, "DAI");
        
        // 验证利息计算
        uint256 expectedInterest = initialDebt * 500 / 10000; // 5% APR
        assertApproxEqRel(interest, expectedInterest, 0.01e18, "Interest should be ~5% APR");
        
        // 检查放贷者收益
        uint256 lenderBalance = lending.getSupplyBalance(address(dai), LENDER);
        console.log("Lender balance after interest:", lenderBalance / 10**18, "DAI");
        assertGt(lenderBalance, 100000 * 10**18, "Lender should earn interest");
    }
    
    // ============ 复杂场景测试 ============
    
    function test_MultiAssetBorrowing() public {
        console.log("=== Multi-Asset Borrowing Test ===");
        
        // 多个放贷者提供不同资产的流动性
        vm.prank(LENDER);
        lending.supply(address(dai), 200000 * 10**18);
        
        vm.prank(WHALE);
        lending.supply(address(usdc), 200000 * 10**6); // 注意USDC是6位精度
        
        // 借款者提供多种抵押品
        vm.prank(BORROWER);
        lending.supply(address(weth), 100 * 10**18);
        
        vm.prank(BORROWER);
        lending.supply(address(dai), 50000 * 10**18);
        
        // 借款者借入多种资产
        uint256 daiBorrow = 80000 * 10**18;
        uint256 usdcBorrow = 50000 * 10**6;
        
        vm.prank(BORROWER);
        lending.borrow(address(dai), daiBorrow);
        
        vm.prank(BORROWER);
        lending.borrow(address(usdc), usdcBorrow);
        
        // 检查总体健康因子
        uint256 healthFactor = lending.getHealthFactor(BORROWER);
        console.log("Health factor with multi-asset:", healthFactor);
        assertGt(healthFactor, 10**18, "Should remain healthy");
        
        // 检查各资产余额
        console.log("DAI borrowed:", lending.getBorrowBalance(address(dai), BORROWER) / 10**18);
        console.log("USDC borrowed:", lending.getBorrowBalance(address(usdc), BORROWER) / 10**6);
    }
    
    // ============ 攻击场景测试 ============
    
    function test_FlashLoanAttack() public {
        console.log("=== Flash Loan Attack Simulation ===");
        
        // 设置正常借贷场景
        vm.prank(LENDER);
        lending.supply(address(dai), 500000 * 10**18);
        
        vm.prank(BORROWER);
        lending.supply(address(weth), 200 * 10**18);
        
        vm.prank(BORROWER);
        lending.borrow(address(dai), 300000 * 10**18);
        
        // 攻击者尝试操纵价格进行清算
        FlashLoanAttacker attacker = new FlashLoanAttacker(
            lending, 
            oracle, 
            address(dai), 
            address(weth)
        );
        
        // 给攻击者一些初始资金
        dai.mint(address(attacker), 100000 * 10**18);
        weth.mint(address(attacker), 100 * 10**18);
        
        uint256 attackerBalanceBefore = dai.balanceOf(address(attacker));
        
        // 执行攻击
        attacker.executeAttack(BORROWER);
        
        uint256 attackerBalanceAfter = dai.balanceOf(address(attacker));
        
        if (attackerBalanceAfter > attackerBalanceBefore) {
            console.log("❌ Flash loan attack succeeded!");
            console.log("Attacker profit:", (attackerBalanceAfter - attackerBalanceBefore) / 10**18);
        } else {
            console.log("✅ Flash loan attack prevented!");
        }
    }
    
    // ============ 压力测试 ============
    
    function test_SystemStress() public {
        console.log("=== System Stress Test ===");
        
        // 大量用户同时借贷
        address[] memory users = new address[](20);
        for (uint256 i = 0; i < 20; i++) {
            users[i] = address(uint160(1000 + i));
            dai.mint(users[i], 100000 * 10**18);
            weth.mint(users[i], 50 * 10**18);
            
            vm.startPrank(users[i]);
            dai.approve(address(lending), type(uint256).max);
            weth.approve(address(lending), type(uint256).max);
            vm.stopPrank();
        }
        
        // 一半用户提供流动性，一半借款
        for (uint256 i = 0; i < 10; i++) {
            vm.prank(users[i]);
            lending.supply(address(dai), 50000 * 10**18);
        }
        
        for (uint256 i = 10; i < 20; i++) {
            vm.prank(users[i]);
            lending.supply(address(weth), 25 * 10**18);
            
            uint256 maxBorrow = lending.getMaxBorrow(users[i], address(dai));
            if (maxBorrow > 0) {
                vm.prank(users[i]);
                lending.borrow(address(dai), maxBorrow * 70 / 100);
            }
        }
        
        console.log("Stress test completed - system remained stable");
    }
}

// 攻击合约示例
contract FlashLoanAttacker {
    LendingProtocol public lending;
    PriceOracle public oracle;
    address public daiAddress;
    address public wethAddress;
    
    constructor(
        LendingProtocol _lending,
        PriceOracle _oracle,
        address _dai,
        address _weth
    ) {
        lending = _lending;
        oracle = _oracle;
        daiAddress = _dai;
        wethAddress = _weth;
    }
    
    function executeAttack(address victim) external {
        // 尝试操纵价格（在真实攻击中可能通过DEX操纵）
        // 这里简化为直接尝试清算
        
        try lending.liquidate(
            victim,
            daiAddress,
            wethAddress,
            10000 * 10**18
        ) {
            // 清算成功
        } catch {
            // 清算失败，攻击被阻止
        }
    }
}
```

## 总结

通过这些实战案例，我们可以看到：

### 1. 测试策略
- **全面覆盖**: 从基础功能到复杂场景
- **真实模拟**: 模拟真实用户行为和市场条件
- **攻击测试**: 主动测试各种攻击场景
- **压力测试**: 验证系统在极端条件下的表现

### 2. 测试技巧
- **角色分离**: 为不同类型的用户创建专门的测试账户
- **场景驱动**: 基于真实业务场景设计测试
- **数据驱动**: 使用真实的市场数据和参数
- **时间模拟**: 测试长期运营和时间相关的功能

### 3. 最佳实践
- **模块化测试**: 将复杂测试分解为可管理的部分
- **详细日志**: 使用console.log记录关键信息
- **断言验证**: 验证每个重要的状态变化
- **边界测试**: 测试极限情况和边界条件

这些案例为实际项目开发提供了宝贵的参考，帮助开发者构建更安全、更可靠的DeFi协议。

## 下一步

学习完实战案例后，继续学习：

1. [故障排除](./10-troubleshooting.md)
2. [高级技巧](./11-advanced-techniques.md)
3. [社区资源](./12-community-resources.md)
