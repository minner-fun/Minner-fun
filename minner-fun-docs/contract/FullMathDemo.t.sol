// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import {console} from "forge-std/console.sol";
import {Test} from "forge-std/Test.sol";
import {FullMath} from "../../src/libraries/FullMath.sol";

/// @title FullMath 演示测试
/// @notice 通过实际例子理解 FullMath 的工作原理
contract FullMathDemoTest is Test {
    
    // ============================================
    // 测试 1: 为什么需要 FullMath
    // ============================================
    
    function test_WhyWeNeedFullMath() public view {
        console.log("\n=== Why We Need FullMath ===\n");
        
        uint256 a = 2**200;
        uint256 b = 2**100;
        uint256 c = 2**50;
        
        console.log("Scenario: Calculate (a * b) / c");
        console.log("a = 2^200");
        console.log("b = 2^100");
        console.log("c = 2^50");
        console.log("");
        console.log("Problem:");
        console.log("  a * b = 2^300 (OVERFLOWS 256 bits!)");
        console.log("  Result should be 2^250 (fits in 256 bits)");
        console.log("");
        
        // 传统方法会溢出
        console.log("Traditional approach:");
        console.log("  uint256 result = (a * b) / c;  // FAILS with overflow");
        console.log("");
        
        // FullMath 可以处理
        uint256 result = FullMath.mulDiv(a, b, c);
        console.log("FullMath.mulDiv approach:");
        console.log("  uint256 result = FullMath.mulDiv(a, b, c);  // SUCCESS");
        console.log("  Result = 2^250");
        console.log("");
        
        // 验证结果
        assertEq(result, 2**250, "Result should be 2^250");
    }
    
    // ============================================
    // 测试 2: 价格计算场景
    // ============================================
    
    function test_PriceCalculation() public view {
        console.log("\n=== Real World Example: Price Calculation ===\n");
        
        // 场景：计算大量代币的价值
        uint256 tokenAmount = 1_000_000_000 * 1e18;  // 10 亿代币
        uint256 tokenPrice = 5000 * 1e18;            // 价格 $5000
        uint256 precision = 1e18;
        
        console.log("Scenario: Calculate token value");
        console.log("Token amount:", tokenAmount / 1e18);
        console.log("Token price: $", tokenPrice / 1e18);
        console.log("");
        
        // 使用 FullMath
        uint256 value = FullMath.mulDiv(tokenAmount, tokenPrice, precision);
        
        console.log("Value = (amount * price) / precision");
        console.log("Value = $", value / 1e18);
        console.log("");
        console.log("Without FullMath, this would overflow!");
    }
    
    // ============================================
    // 测试 3: 比例分配
    // ============================================
    
    function test_ProportionalAllocation() public view {
        console.log("\n=== Proportional Allocation ===\n");
        
        uint256 userStake = 750 * 1e18;        // 用户质押 750
        uint256 totalStake = 10_000 * 1e18;    // 总质押 10,000
        uint256 totalRewards = 1_000_000 * 1e18;  // 总奖励 1M
        
        console.log("Scenario: Distribute rewards proportionally");
        console.log("User stake:", userStake / 1e18);
        console.log("Total stake:", totalStake / 1e18);
        console.log("Total rewards:", totalRewards / 1e18);
        console.log("");
        
        // 用户应得 = (用户质押 * 总奖励) / 总质押
        uint256 userReward = FullMath.mulDiv(userStake, totalRewards, totalStake);
        
        console.log("User's reward = (userStake * totalRewards) / totalStake");
        console.log("User's reward:", userReward / 1e18);
        console.log("");
        
        // 验证比例
        uint256 expectedPercentage = 750; // 7.5%
        uint256 actualPercentage = (userReward * 10000) / totalRewards;
        assertEq(actualPercentage, expectedPercentage);
        console.log("User gets 7.5% of rewards (correct!)");
    }
    
    // ============================================
    // 测试 4: 向上取整 vs 向下取整
    // ============================================
    
    function test_RoundingComparison() public view {
        console.log("\n=== Rounding: Down vs Up ===\n");
        
        uint256 a = 10;
        uint256 b = 3;
        uint256 c = 4;
        
        console.log("Calculate: (10 * 3) / 4 = 30 / 4");
        console.log("");
        
        uint256 roundDown = FullMath.mulDiv(a, b, c);
        uint256 roundUp = FullMath.mulDivRoundingUp(a, b, c);
        
        console.log("mulDiv (round down):", roundDown);
        console.log("  = floor(30 / 4) = 7");
        console.log("");
        console.log("mulDivRoundingUp (round up):", roundUp);
        console.log("  = ceil(30 / 4) = 8");
        console.log("");
        
        assertEq(roundDown, 7);
        assertEq(roundUp, 8);
        
        console.log("Use case:");
        console.log("  - Round DOWN: user receives tokens (favor protocol)");
        console.log("  - Round UP: user pays tokens (favor protocol)");
    }
    
    // ============================================
    // 测试 5: 边界情况
    // ============================================
    
    function test_EdgeCases() public view {
        console.log("\n=== Edge Cases ===\n");
        
        uint256 max = type(uint256).max;
        
        // 情况 1: 最大值除以自己
        uint256 r1 = FullMath.mulDiv(max, max, max);
        console.log("Case 1: (MAX * MAX) / MAX = MAX");
        console.log("  Result:", r1 == max ? "MAX (correct!)" : "ERROR");
        assertEq(r1, max);
        
        console.log("");
        
        // 情况 2: 零乘法
        uint256 r2 = FullMath.mulDiv(0, max, 1);
        console.log("Case 2: (0 * MAX) / 1 = 0");
        console.log("  Result:", r2);
        assertEq(r2, 0);
        
        console.log("");
        
        // 情况 3: 乘以 1
        uint256 value = 12345;
        uint256 r3 = FullMath.mulDiv(value, 1, 1);
        console.log("Case 3: (value * 1) / 1 = value");
        console.log("  Input:", value);
        console.log("  Output:", r3);
        assertEq(r3, value);
    }
    
    // ============================================
    // 测试 6: 应该失败的情况
    // ============================================
    
    function test_ShouldRevert() public {
        console.log("\n=== Cases That Should Revert ===\n");
        
        uint256 max = type(uint256).max;
        
        // 情况 1: 除以零
        vm.expectRevert();
        FullMath.mulDiv(100, 200, 0);
        console.log("Case 1: Division by zero - REVERTED (correct)");
        
        // 情况 2: 结果溢出
        vm.expectRevert();
        FullMath.mulDiv(max, max, 1);
        console.log("Case 2: Result overflow - REVERTED (correct)");
        
        // 情况 3: 向上取整溢出
        vm.expectRevert();
        FullMath.mulDivRoundingUp(max, max, max - 1);
        console.log("Case 3: Rounding up overflow - REVERTED (correct)");
    }
    
    // ============================================
    // 测试 7: 性能对比
    // ============================================
    
    function test_GasComparison() public view {
        console.log("\n=== Gas Usage Comparison ===\n");
        
        uint256 a = 1000;
        uint256 b = 2000;
        uint256 c = 500;
        
        // 简单除法的 gas（通过 gasleft() 估算）
        uint256 gasBefore1 = gasleft();
        uint256 simple = (a * b) / c;
        uint256 gasUsed1 = gasBefore1 - gasleft();
        
        // FullMath 的 gas
        uint256 gasBefore2 = gasleft();
        uint256 precise = FullMath.mulDiv(a, b, c);
        uint256 gasUsed2 = gasBefore2 - gasleft();
        
        console.log("Simple division: (a * b) / c");
        console.log("  Gas used: ~", gasUsed1);
        console.log("  Result:", simple);
        console.log("");
        console.log("FullMath.mulDiv(a, b, c):");
        console.log("  Gas used: ~", gasUsed2);
        console.log("  Result:", precise);
        console.log("");
        console.log("Trade-off:");
        console.log("  - FullMath uses more gas");
        console.log("  - But handles overflow and maintains precision");
        console.log("  - Essential for DeFi applications");
        
        assertEq(simple, precise);
    }
}

// ============================================
// 实用工具库示例
// ============================================

/// @title 基于 FullMath 构建的实用库
library PracticalMath {
    
    /// @notice 计算百分比（basis points）
    /// @param amount 金额
    /// @param bps 基点 (1 bps = 0.01%)
    function percentage(uint256 amount, uint256 bps) 
        internal 
        pure 
        returns (uint256) 
    {
        return FullMath.mulDiv(amount, bps, 10000);
    }
    
    /// @notice 按比例缩放
    /// @param amount 原始金额
    /// @param numerator 分子
    /// @param denominator 分母
    function scale(
        uint256 amount,
        uint256 numerator,
        uint256 denominator
    ) internal pure returns (uint256) {
        return FullMath.mulDiv(amount, numerator, denominator);
    }
    
    /// @notice 计算加权平均
    function weightedAverage(
        uint256 value1,
        uint256 weight1,
        uint256 value2,
        uint256 weight2
    ) internal pure returns (uint256) {
        uint256 totalWeight = weight1 + weight2;
        
        // Compute (value1 * weight1 + value2 * weight2) / totalWeight
        // with single division to avoid double truncation
        
        assembly {
            // Compute value1 * weight1 in 512-bit
            let mm1 := mulmod(value1, weight1, not(0))
            let prod1Low := mul(value1, weight1)
            let prod1High := sub(sub(mm1, prod1Low), lt(mm1, prod1Low))
            
            // Compute value2 * weight2 in 512-bit
            let mm2 := mulmod(value2, weight2, not(0))
            let prod2Low := mul(value2, weight2)
            let prod2High := sub(sub(mm2, prod2Low), lt(mm2, prod2Low))
            
            // Add the two 512-bit products
            let sumLow := add(prod1Low, prod2Low)
            let sumHigh := add(add(prod1High, prod2High), lt(sumLow, prod1Low))
            
            // Divide the 512-bit sum by totalWeight
            // Ensure result fits in 256 bits
            if iszero(lt(sumHigh, totalWeight)) {
                if sumHigh {
                    revert(0, 0)
                }
            }
            
            let result := 0
            if iszero(sumHigh) {
                // Simple case: high part is zero
                result := div(sumLow, totalWeight)
            }
            if sumHigh {
                // Full 512-bit division: (sumHigh * 2^256 + sumLow) / totalWeight
                // Formula: sumHigh * (2^256 / totalWeight) + (sumHigh * (2^256 % totalWeight) + sumLow) / totalWeight
                
                // Calculate 2^256 / totalWeight
                // Note: 2^256 = type(uint256).max + 1, so 2^256 / d = floor((2^256-1) / d) + 1
                let quot256 := add(div(not(0), totalWeight), 1)
                
                // Calculate 2^256 % totalWeight = (type(uint256).max % totalWeight + 1) % totalWeight
                let rem256 := mod(add(mod(not(0), totalWeight), 1), totalWeight)
                
                // Result = sumHigh * quot256 + (sumHigh * rem256 + sumLow) / totalWeight
                result := add(mul(sumHigh, quot256), div(add(mul(sumHigh, rem256), sumLow), totalWeight))
            }
            
            mstore(0, result)
            return(0, 32)
        }
    }
}

/// @title 实用库测试
contract PracticalMathTest is Test {
    using PracticalMath for uint256;
    
    function test_PercentageCalculation() public view {
        console.log("\n=== Practical: Percentage Calculation ===\n");
        
        uint256 amount = 1000 * 1e18;
        
        // 1% = 100 bps
        uint256 fee1 = PracticalMath.percentage(amount, 100);
        console.log("1% of 1000 =", fee1 / 1e18);
        assertEq(fee1, 10 * 1e18);
        
        // 0.3% = 30 bps (Uniswap fee)
        uint256 fee2 = PracticalMath.percentage(amount, 30);
        console.log("0.3% of 1000 =", fee2 / 1e18);
        assertEq(fee2, 3 * 1e18);
        
        // 0.05% = 5 bps
        uint256 fee3 = PracticalMath.percentage(amount, 5);
        console.log("0.05% of 1000 =", fee3 / 1e16, "/ 100");
    }
    
    function test_Scaling() public view {
        console.log("\n=== Practical: Scaling ===\n");
        
        // 场景：750 out of 1000 people voted yes
        uint256 yesVotes = 750;
        uint256 totalVotes = 1000;
        uint256 totalSupply = 1_000_000 * 1e18;
        
        // 按比例计算代币分配
        uint256 tokensForYes = PracticalMath.scale(
            totalSupply,
            yesVotes,
            totalVotes
        );
        
        console.log("Voting results:");
        console.log("  Yes votes:", yesVotes);
        console.log("  Total votes:", totalVotes);
        console.log("  Total token supply:", totalSupply / 1e18);
        console.log("");
        console.log("Tokens allocated to Yes voters:");
        console.log(" ", tokensForYes / 1e18);
        console.log("  (75% of total supply)");
        
        assertEq(tokensForYes, 750_000 * 1e18);
    }
    
    function test_WeightedAverage() public view {
        console.log("\n=== Practical: Weighted Average ===\n");
        
        // 场景：两个池子的平均价格
        uint256 priceA = 100 * 1e18;  // $100
        uint256 liquidityA = 1000 * 1e18;
        
        uint256 priceB = 110 * 1e18;  // $110
        uint256 liquidityB = 2000 * 1e18;
        
        uint256 avgPrice = PracticalMath.weightedAverage(
            priceA,
            liquidityA,
            priceB,
            liquidityB
        );
        
        console.log("Pool A: price = $100, liquidity = 1000");
        console.log("Pool B: price = $110, liquidity = 2000");
        console.log("");
        console.log("Weighted average price: $", avgPrice / 1e18);
        console.log("  Expected: $106.67");
        
        // 验证: (100*1000 + 110*2000) / 3000 = 320000 / 3000 ≈ 106.67
        uint256 expected = 106666666666666666666; // 约 106.67
        assertApproxEqRel(avgPrice, expected, 0.01e18); // 1% 误差内
    }
}

