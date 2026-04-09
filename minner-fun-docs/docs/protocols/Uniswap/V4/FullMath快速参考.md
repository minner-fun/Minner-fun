# FullMath 快速参考指南

## 🎯 一句话总结

**FullMath 让你能安全地计算 `(a × b) ÷ c`，即使 `a × b` 会溢出 256 位。**

---

## 📖 基本用法

### 导入

```solidity
import {FullMath} from "./libraries/FullMath.sol";
```

### API

```solidity
// 向下取整: floor((a * b) / denominator)
uint256 result = FullMath.mulDiv(a, b, denominator);

// 向上取整: ceil((a * b) / denominator)
uint256 result = FullMath.mulDivRoundingUp(a, b, denominator);
```

---

## 💡 何时使用

### ✅ 应该使用的场景

| 场景 | 示例 | 原因 |
|------|------|------|
| 🪙 价格计算 | `amount * price / precision` | 大数相乘易溢出 |
| 💧 流动性计算 | `liquidity * sqrtPrice^2 / 2^192` | Uniswap V3 中的实际用法 |
| 📊 比例分配 | `userStake * totalReward / totalStake` | 需要精确分配 |
| 💰 费用计算 | `value * feeBps / 10000` | 避免精度损失 |
| 📈 复利计算 | `principal * (1+rate)^n` | 重复乘法容易溢出 |

### ❌ 不需要使用的场景

- 简单的加减法
- 确定不会溢出的小数运算
- 纯整数除法（无乘法）
- Gas 极度敏感且精度要求不高的场景

---

## 📊 示例代码

### 示例 1：代币价值计算

```solidity
function calculateValue(
    uint256 tokenAmount,
    uint256 pricePerToken,
    uint256 decimals
) public pure returns (uint256) {
    // tokenAmount = 1e30, pricePerToken = 1e20
    // tokenAmount * pricePerToken 会溢出！
    return FullMath.mulDiv(tokenAmount, pricePerToken, 10 ** decimals);
}
```

### 示例 2：比例分配奖励

```solidity
function calculateReward(
    uint256 userStake,
    uint256 totalRewards,
    uint256 totalStake
) public pure returns (uint256) {
    // reward = userStake * totalRewards / totalStake
    return FullMath.mulDiv(userStake, totalRewards, totalStake);
}
```

### 示例 3：百分比计算

```solidity
function applyFee(
    uint256 amount,
    uint256 feeBasisPoints  // 30 = 0.3%
) public pure returns (uint256) {
    // fee = amount * feeBps / 10000
    uint256 fee = FullMath.mulDiv(amount, feeBasisPoints, 10000);
    return amount - fee;
}
```

### 示例 4：向上取整（用户支付）

```solidity
function calculateBorrowFee(
    uint256 borrowAmount,
    uint256 feeRate,
    uint256 precision
) public pure returns (uint256) {
    // 向上取整，确保协议不会少收费用
    return FullMath.mulDivRoundingUp(borrowAmount, feeRate, precision);
}
```

---

## ⚡ Gas 成本

| 操作 | Gas 消耗 | 说明 |
|------|---------|------|
| 简单除法 `a / b` | ~50 | 基准 |
| `mulDiv(a, b, c)` (简单) | ~200 | prod1 == 0 时 |
| `mulDiv(a, b, c)` (完整) | ~600 | 需要 512 位除法时 |

**权衡**：多花 10x gas，换取完美精度和溢出保护。

---

## 🔍 工作原理（简化版）

### 步骤 1：512 位乘法

```
a * b = [prod1 (高256位)] [prod0 (低256位)]
```

### 步骤 2：检查溢出

```
if (prod1 >= denominator) revert;  // 结果会溢出
```

### 步骤 3：简单情况

```
if (prod1 == 0) return prod0 / denominator;  // 直接除法
```

### 步骤 4：512 位除法

```
1. 减去余数
2. 提取 2 的幂因子
3. 计算模逆元
4. 乘法替代除法
```

---

## 🎓 核心技术

### 1. mulmod - EVM 的秘密武器

```solidity
// EVM 原生支持 512 位模运算！
uint256 result = mulmod(a, b, modulus);
```

这是整个算法的基础。

### 2. 模逆元

```solidity
// 除以 d 等价于乘以 d 的逆元
result = value / d;
result = value * inverse(d);  // 更快！
```

### 3. Newton-Raphson 迭代

```solidity
// 每次迭代精度翻倍
inv *= 2 - denominator * inv;  // 重复 6 次
```

---

## ⚠️ 注意事项

### 会 Revert 的情况

```solidity
// 1. 除以零
FullMath.mulDiv(a, b, 0);  // ❌ revert

// 2. 结果溢出 256 位
FullMath.mulDiv(MAX, MAX, 1);  // ❌ revert

// 3. 向上取整溢出
FullMath.mulDivRoundingUp(MAX, MAX, MAX-1);  // ❌ revert
```

### 精度注意

```solidity
// ✅ 好：先乘后除
result = FullMath.mulDiv(a, b, c);

// ❌ 差：先除后乘（损失精度）
result = (a / c) * b;
```

---

## 🧪 测试建议

### 测试边界情况

```solidity
function testFullMath() public {
    // 测试最大值
    uint256 max = type(uint256).max;
    FullMath.mulDiv(max, max, max);  // 应该 = max
    
    // 测试零
    FullMath.mulDiv(0, max, 1);  // 应该 = 0
    
    // 测试溢出
    vm.expectRevert();
    FullMath.mulDiv(max, max, 1);  // 应该 revert
}
```

### 测试实际场景

```solidity
function testRealisticScenario() public {
    uint256 amount = 1_000_000 * 1e18;
    uint256 price = 5000 * 1e18;
    uint256 value = FullMath.mulDiv(amount, price, 1e18);
    
    assertEq(value, 5_000_000_000 * 1e18);
}
```

---

## 📚 学习资源

### 运行演示

```bash
# 运行交互式示例
forge test --match-contract FullMathDemo -vvv

# 查看 gas 报告
forge test --match-contract FullMathDemo --gas-report
```

### 深入学习

- 📄 完整文档：`docs/FullMath库详解.md`
- 🧪 演示代码：`test/demo/FullMathDemo.t.sol`
- 🔗 原始论文：https://xn--2-umb.com/21/muldiv
- 🔗 EVM 操作码：https://www.evm.codes/

---

## 🎁 实用模板

### 创建你自己的库

```solidity
library MyMath {
    using FullMath for uint256;
    
    uint256 constant PRECISION = 1e18;
    
    function calculateWithFee(
        uint256 amount,
        uint256 feeRate  // 以 PRECISION 为单位
    ) internal pure returns (uint256 amountAfterFee) {
        uint256 fee = FullMath.mulDiv(amount, feeRate, PRECISION);
        return amount - fee;
    }
    
    function proportionalSplit(
        uint256 total,
        uint256 ratio,  // 0 到 PRECISION
        uint256 precision
    ) internal pure returns (uint256 part1, uint256 part2) {
        part1 = FullMath.mulDiv(total, ratio, precision);
        part2 = total - part1;
    }
}
```

---

## ✨ 关键要点

### 记住这些

1. **用途**：`(a * b) / c` 且 `a * b` 可能溢出
2. **精度**：完美精度，无舍入误差（除非要求向上取整）
3. **成本**：~10倍 gas，但在 DeFi 中值得
4. **安全**：会 revert 而不是给出错误结果

### 选择指南

```
需要乘除法？
  ↓
中间值可能溢出？
  ↓ 是
需要完美精度？
  ↓ 是
→ 使用 FullMath ✅

否则：使用普通运算符
```

---

## 🚀 开始使用

```solidity
// 1. 导入
import {FullMath} from "./libraries/FullMath.sol";

// 2. 使用
function myFunction(uint256 a, uint256 b, uint256 c) 
    public 
    pure 
    returns (uint256) 
{
    return FullMath.mulDiv(a, b, c);
}

// 3. 完成！
```

---

**祝你编写精确、安全的 DeFi 代码！** 🎯

