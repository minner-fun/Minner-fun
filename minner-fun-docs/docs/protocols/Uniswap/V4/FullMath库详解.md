# FullMath 数学库深度解析

## 目录

- [1. 库的目的和价值](#1-库的目的和价值)
- [2. 核心问题：溢出](#2-核心问题溢出)
- [3. 基础知识](#3-基础知识)
- [4. mulDiv 函数详解](#4-muldiv-函数详解)
- [5. mulDivRoundingUp 函数](#5-muldivroundingup-函数)
- [6. 实际应用场景](#6-实际应用场景)
- [7. 从中学到的合约设计技巧](#7-从中学到的合约设计技巧)

---

## 1. 库的目的和价值

### 问题背景

在 Solidity 中计算 `(a * b) / c` 时会遇到的问题：

```solidity
// ❌ 这样会溢出
uint256 a = 2**200;
uint256 b = 2**100;
uint256 c = 2**50;

uint256 result = (a * b) / c;  // a * b 会溢出！
```

虽然最终结果 `2^250` 能放进 `uint256`，但中间的 `a * b = 2^300` 会溢出。

### FullMath 的解决方案

```solidity
// ✅ 使用 FullMath，不会溢出
uint256 result = FullMath.mulDiv(a, b, c);  // 正确计算
```

**核心能力**：处理中间值超过 256 位的乘除法，结果仍保持完整精度。

---

## 2. 核心问题：溢出

### Phantom Overflow（幽灵溢出）

"幽灵溢出"指的是：
- 中间计算结果溢出 256 位
- 但最终结果在 256 位范围内
- 传统方法会失败，但实际上有解

### 示例

```solidity
// 例子：价格计算
uint256 amount = 1e30;        // 代币数量
uint256 price = 1e20;         // 价格
uint256 divisor = 1e18;       // 精度

// 传统方法会溢出
// (1e30 * 1e20) / 1e18 = 1e32 (可以表示)
// 但 1e30 * 1e20 = 1e50 会溢出！

// FullMath 可以正确计算
uint256 value = FullMath.mulDiv(amount, price, divisor);
```

---

## 3. 基础知识

在深入理解代码前，需要掌握以下概念：

### 3.1 Yul 汇编基础

#### 常用指令

```solidity
assembly {
    // 算术运算
    let sum := add(a, b)       // a + b
    let diff := sub(a, b)      // a - b
    let prod := mul(a, b)      // a * b
    let quot := div(a, b)      // a / b
    
    // 模运算
    let remainder := mod(a, b)         // a % b
    let modprod := mulmod(a, b, m)     // (a * b) % m
    
    // 比较运算
    let isLess := lt(a, b)     // a < b (返回 0 或 1)
    let isGreater := gt(a, b)  // a > b
    
    // 位运算
    let notValue := not(a)     // ~a (按位取反)
    let andValue := and(a, b)  // a & b
    let orValue := or(a, b)    // a | b
}
```

#### 重要的模运算指令

```solidity
// mulmod(a, b, m) - 计算 (a * b) % m
// 关键：这个运算在 EVM 中是原生支持的，可以处理 512 位中间值！
assembly {
    let result := mulmod(a, b, m)
}
```

### 3.2 数学概念

#### 中国剩余定理（Chinese Remainder Theorem）

如果知道一个数对不同模的余数，可以重构这个数。

FullMath 使用此定理处理 512 位乘法：
- `prod0 = (a * b) % 2^256`（低 256 位）
- `prod1 = (a * b) / 2^256`（高 256 位）
- 完整结果：`a * b = prod1 * 2^256 + prod0`

#### 模逆元（Modular Inverse）

对于奇数 `d`，存在 `inv` 使得：
```
d * inv ≡ 1 (mod 2^256)
```

这样，除以 `d` 就等价于乘以 `inv`：
```
x / d = x * inv (mod 2^256)
```

#### Newton-Raphson 迭代

快速计算逆元的方法，每次迭代将精度翻倍。

### 3.3 位运算技巧

#### 提取最低有效的 2 的幂

```solidity
uint256 twos = (0 - denominator) & denominator;
```

**原理**：
```
假设 denominator = 12 = 1100₂
-denominator 的补码 = ...11110100₂
denominator & (-denominator) = 0100₂ = 4

结果：提取出最低的 2^2
```

**作用**：找出 denominator 中因子 2 的最大幂次。

---

## 4. mulDiv 函数详解

### 函数签名

```solidity
function mulDiv(uint256 a, uint256 b, uint256 denominator) 
    internal pure 
    returns (uint256 result)
```

**功能**：计算 `floor((a * b) / denominator)`，支持中间溢出。

---

### 4.1 第一步：512 位乘法

```solidity
uint256 prod0 = a * b;  // 低 256 位
uint256 prod1;          // 高 256 位
```

#### 计算高 256 位

```solidity
assembly ("memory-safe") {
    let mm := mulmod(a, b, not(0))
    prod1 := sub(sub(mm, prod0), lt(mm, prod0))
}
```

**详细解析**：

1. **`not(0)`** = `2^256 - 1` = 全是 1 的 256 位数

2. **`mulmod(a, b, not(0))`** = `(a * b) % (2^256 - 1)`
   - 设 `a * b = q * 2^256 + r`（512 位）
   - `(a * b) % (2^256 - 1) = (q * 2^256 + r) % (2^256 - 1)`
   - 因为 `2^256 ≡ 1 (mod 2^256 - 1)`
   - 所以 `= (q + r) % (2^256 - 1)`

3. **提取 prod1**：
   ```
   mm = q + r (可能溢出一点)
   prod0 = r
   prod1 = mm - r - (是否发生了借位)
         = q - (是否发生了借位)
   ```

**为什么这样有效？**

这是中国剩余定理的应用：
- 知道 `(a*b) % 2^256` = `prod0`
- 知道 `(a*b) % (2^256-1)` = `mm`
- 可以重构出高位 `prod1`

---

### 4.2 第二步：检查是否溢出

```solidity
require(denominator > prod1);
```

如果 `prod1 >= denominator`，则结果会超过 256 位，无法表示。

---

### 4.3 第三步：简单情况处理

```solidity
if (prod1 == 0) {
    assembly ("memory-safe") {
        result := div(prod0, denominator)
    }
    return result;
}
```

如果高 256 位为 0，说明 `a * b < 2^256`，直接除法即可。

---

### 4.4 第四步：512 位除法（核心算法）

#### 子步骤 1：减去余数

```solidity
uint256 remainder;
assembly ("memory-safe") {
    remainder := mulmod(a, b, denominator)
}

assembly ("memory-safe") {
    prod1 := sub(prod1, gt(remainder, prod0))
    prod0 := sub(prod0, remainder)
}
```

**目的**：让 `[prod1 prod0]` 能被 `denominator` 整除。

**实现**：从 512 位数中减去余数
- 如果 `remainder > prod0`，需要从 `prod1` 借位
- 更新 `prod0 = prod0 - remainder`

---

#### 子步骤 2：提取 2 的幂因子

```solidity
uint256 twos = (0 - denominator) & denominator;

assembly ("memory-safe") {
    denominator := div(denominator, twos)
}
```

**目的**：将 denominator 变成奇数。

**原理**：
```
假设 denominator = 12 = 4 * 3
twos = 4 (最大的 2 的幂因子)
denominator = 12 / 4 = 3 (奇数)
```

---

#### 子步骤 3：同时除以 2 的幂

```solidity
assembly ("memory-safe") {
    prod0 := div(prod0, twos)
}

assembly ("memory-safe") {
    twos := add(div(sub(0, twos), twos), 1)
}

prod0 |= prod1 * twos;
```

**第一部分**：`prod0 /= twos`

**第二部分**：计算反向的 twos
```
原 twos = 2^k
新 twos = 2^(256-k)
```

**第三部分**：合并高位
```
prod0 = (prod0 / 2^k) + (prod1 * 2^(256-k))
      = [prod1 prod0] / 2^k (512位除法)
```

**可视化**：
```
512 位数：[prod1 prod0]
右移 k 位：
  [prod1 的低 k 位] 补到 [prod0 的高 k 位]
  
结果：prod0 存储了右移后的低 256 位
```

---

#### 子步骤 4：计算模逆元并相乘

```solidity
uint256 inv = (3 * denominator) ^ 2;

inv *= 2 - denominator * inv;  // mod 2^8
inv *= 2 - denominator * inv;  // mod 2^16
inv *= 2 - denominator * inv;  // mod 2^32
inv *= 2 - denominator * inv;  // mod 2^64
inv *= 2 - denominator * inv;  // mod 2^128
inv *= 2 - denominator * inv;  // mod 2^256

result = prod0 * inv;
```

**目的**：计算 `denominator` 的模 `2^256` 逆元。

**原理**：Newton-Raphson 迭代
- 每次迭代精度翻倍
- `inv *= 2 - denominator * inv` 是标准公式

**初始种子**：`(3 * denominator) ^ 2`
- 对于奇数，这给出正确的低 4 位逆元

**最终计算**：
```
除以 denominator 等价于乘以 inv
result = prod0 * inv
       = (a * b / twos) * inv
       = (a * b) / (twos * denominator)
       = (a * b) / 原始denominator
```

---

### 4.5 完整流程图

```
输入: a, b, denominator
  ↓
[512位乘法: a * b]
  ├─ prod0 = (a*b) % 2^256
  └─ prod1 = (a*b) / 2^256
  ↓
[检查溢出]
  如果 denominator <= prod1 → 报错
  如果 prod1 == 0 → 简单除法
  ↓
[减去余数]
  [prod1 prod0] -= (a*b) % denominator
  ↓
[提取2的幂因子]
  twos = denominator 的最大 2^k 因子
  denominator /= twos
  ↓
[512位数右移]
  [prod1 prod0] >>= k
  结果存在 prod0
  ↓
[计算模逆元]
  inv = denominator^(-1) mod 2^256
  使用 Newton-Raphson 迭代
  ↓
[最终除法]
  result = prod0 * inv
  ↓
输出: result
```

---

## 5. mulDivRoundingUp 函数

### 代码

```solidity
function mulDivRoundingUp(uint256 a, uint256 b, uint256 denominator) 
    internal pure 
    returns (uint256 result) 
{
    unchecked {
        result = mulDiv(a, b, denominator);
        if (mulmod(a, b, denominator) != 0) {
            require(++result > 0);
        }
    }
}
```

### 原理

标准的向上取整逻辑：
```
ceil(x / y) = floor(x / y) + (1 if x % y != 0 else 0)
```

**步骤**：
1. 计算 `floor((a*b) / denominator)`
2. 检查是否有余数：`(a*b) % denominator != 0`
3. 如果有余数，结果加 1
4. 检查加 1 后不会溢出

---

## 6. 实际应用场景

### 6.1 DeFi 价格计算

```solidity
// 计算代币价值，避免精度损失
function calculateValue(
    uint256 amount,
    uint256 price,      // 18 位小数
    uint256 precision   // 1e18
) public pure returns (uint256) {
    // 传统方法可能溢出：amount * price / precision
    return FullMath.mulDiv(amount, price, precision);
}
```

### 6.2 流动性池份额计算

```solidity
// Uniswap V3 中的实际用例
function getLiquidityForAmount(
    uint256 amount0,
    uint160 sqrtPriceAX96,
    uint160 sqrtPriceBX96
) internal pure returns (uint128 liquidity) {
    // Q96 格式的平方根价格相乘会超过 256 位
    return toUint128(
        FullMath.mulDiv(
            amount0,
            sqrtPriceAX96 * sqrtPriceBX96,
            2**192
        )
    );
}
```

### 6.3 比例计算

```solidity
// 按比例分配奖励
function calculateReward(
    uint256 userStake,
    uint256 totalRewards,
    uint256 totalStake
) public pure returns (uint256) {
    // userStake * totalRewards 可能溢出
    return FullMath.mulDiv(userStake, totalRewards, totalStake);
}
```

### 6.4 复合利息计算

```solidity
// 计算复利，避免中间值溢出
function compoundInterest(
    uint256 principal,
    uint256 rate,         // 利率 * 1e18
    uint256 periods
) public pure returns (uint256) {
    uint256 result = principal;
    for (uint i = 0; i < periods; i++) {
        // result = result * (1 + rate) / 1e18
        result = FullMath.mulDiv(
            result, 
            1e18 + rate, 
            1e18
        );
    }
    return result;
}
```

---

## 7. 从中学到的合约设计技巧

### 7.1 精度优先的数学运算

**原则**：宁可多花 gas，也不能损失精度。

```solidity
// ❌ 错误：可能溢出或损失精度
uint256 result = (a * b) / c;

// ✅ 正确：使用专门的库
uint256 result = FullMath.mulDiv(a, b, c);
```

**应用**：
- 金融计算
- 价格预言机
- 份额分配

---

### 7.2 利用 EVM 的原生能力

**关键发现**：`mulmod(a, b, m)` 可以处理 512 位中间值。

```solidity
// EVM 原生支持 512 位模运算
assembly {
    let result := mulmod(a, b, m)
}
```

**启示**：
- 研究 EVM 操作码的特殊能力
- 某些"不可能"的操作其实有原生支持
- 参考：https://www.evm.codes/

---

### 7.3 位运算优化

#### 提取 2 的幂因子

```solidity
uint256 twos = (0 - denominator) & denominator;
```

**技巧**：
- 负数的补码性质
- 巧妙的位掩码操作
- O(1) 时间复杂度

#### 应用到你的代码

```solidity
// 检查一个数是否是 2 的幂
function isPowerOfTwo(uint256 x) internal pure returns (bool) {
    return x != 0 && (x & (x - 1)) == 0;
}

// 向上取整到 2 的幂
function nextPowerOfTwo(uint256 x) internal pure returns (uint256) {
    if (x == 0) return 1;
    x--;
    x |= x >> 1;
    x |= x >> 2;
    x |= x >> 4;
    x |= x >> 8;
    x |= x >> 16;
    x |= x >> 32;
    x |= x >> 64;
    x |= x >> 128;
    return x + 1;
}
```

---

### 7.4 数学定理的工程应用

#### 模逆元的实用性

```solidity
// 除法转换为乘法
// x / d = x * inv (当 d 是奇数)
uint256 inv = calculateInverse(d);
uint256 result = x * inv;
```

**优势**：
- 批量除法时只需计算一次逆元
- 可以预计算常用的逆元

**应用示例**：

```solidity
library FixedPoint {
    uint256 constant Q96 = 2**96;
    uint256 constant Q96_INV = ...; // 预计算的逆元
    
    function divByQ96(uint256 x) internal pure returns (uint256) {
        return x * Q96_INV;  // 比除法快
    }
}
```

---

### 7.5 Newton-Raphson 迭代模式

**通用模板**：

```solidity
function findInverse(uint256 x) internal pure returns (uint256 inv) {
    // 1. 初始种子
    inv = getInitialGuess(x);
    
    // 2. 迭代改进（精度翻倍）
    inv = improve(inv, x);
    inv = improve(inv, x);
    inv = improve(inv, x);
    // ...
    
    return inv;
}
```

**应用到其他问题**：
- 平方根计算
- 立方根计算
- 任意函数的零点

---

### 7.6 分阶段处理复杂问题

FullMath 的策略：
1. ✅ 简单情况快速返回
2. ✅ 复杂情况分步处理
3. ✅ 每步都有明确的数学意义

**应用模式**：

```solidity
function complexCalculation(uint256 x) internal pure returns (uint256) {
    // 第一步：处理特殊情况
    if (x == 0) return 0;
    if (x == 1) return 1;
    
    // 第二步：简化问题
    uint256 simplified = simplify(x);
    
    // 第三步：核心计算
    uint256 core = coreLogic(simplified);
    
    // 第四步：后处理
    return postProcess(core);
}
```

---

### 7.7 使用 unchecked 优化

```solidity
unchecked {
    // 在这里我们知道不会溢出
    result = prod0 * inv;
}
```

**何时使用**：
- ✅ 数学上保证不会溢出
- ✅ 已经有其他检查保护
- ❌ 不确定的计算

**示例**：

```solidity
function safeIncrement(uint256 x, uint256 maxValue) 
    internal 
    pure 
    returns (uint256) 
{
    require(x < maxValue);  // 前置检查
    unchecked {
        return x + 1;  // 数学上保证安全
    }
}
```

---

### 7.8 内联汇编的适度使用

**原则**：只在必要时使用，且注释清楚。

```solidity
// ✅ 好的汇编使用
assembly ("memory-safe") {
    // 计算 (a * b) mod 2^256 - 1
    // EVM 原生支持，比 Solidity 高效
    let mm := mulmod(a, b, not(0))
}

// ❌ 过度使用
assembly {
    // 简单加法不需要汇编
    let sum := add(a, b)
}
```

---

## 8. 实战：构建自己的数学库

基于 FullMath 的经验，构建常用的数学函数：

### 8.1 安全的百分比计算

```solidity
library Percentage {
    using FullMath for uint256;
    
    uint256 constant PRECISION = 10000; // 0.01% 精度
    
    function mulPercentage(uint256 amount, uint256 bps) 
        internal 
        pure 
        returns (uint256) 
    {
        // bps = basis points (1 bps = 0.01%)
        return FullMath.mulDiv(amount, bps, PRECISION);
    }
    
    function addPercentage(uint256 amount, uint256 bps)
        internal
        pure
        returns (uint256)
    {
        return amount + mulPercentage(amount, bps);
    }
}
```

### 8.2 安全的比例缩放

```solidity
library Scaling {
    using FullMath for uint256;
    
    function scaleUp(
        uint256 amount,
        uint256 fromDecimals,
        uint256 toDecimals
    ) internal pure returns (uint256) {
        if (toDecimals <= fromDecimals) {
            return amount / (10 ** (fromDecimals - toDecimals));
        }
        return amount * (10 ** (toDecimals - fromDecimals));
    }
    
    function convertWithRate(
        uint256 amount,
        uint256 rate,
        uint256 rateDecimals
    ) internal pure returns (uint256) {
        return FullMath.mulDiv(amount, rate, 10 ** rateDecimals);
    }
}
```

### 8.3 加权平均

```solidity
library WeightedAverage {
    using FullMath for uint256;
    
    function calculate(
        uint256[] memory values,
        uint256[] memory weights
    ) internal pure returns (uint256) {
        require(values.length == weights.length);
        
        uint256 sum = 0;
        uint256 totalWeight = 0;
        
        for (uint i = 0; i < values.length; i++) {
            sum += FullMath.mulDiv(values[i], weights[i], 1);
            totalWeight += weights[i];
        }
        
        return sum / totalWeight;
    }
}
```

---

## 9. 性能分析

### Gas 消耗

```solidity
// 简单除法: ~50 gas
uint256 simple = a / b;

// FullMath.mulDiv: ~400-600 gas
uint256 precise = FullMath.mulDiv(a, b, c);
```

**权衡**：
- 💰 成本：增加约 10 倍 gas
- ✅ 收益：完美精度，支持溢出

**何时使用**：
- ✅ 金额计算（精度重要）
- ✅ 价格计算（溢出风险）
- ❌ 简单迭代（已知不溢出）

---

## 10. 测试建议

### 边界测试

```solidity
function testMulDivEdgeCases() public {
    // 测试溢出边界
    uint256 max = type(uint256).max;
    
    // 应该成功
    uint256 r1 = FullMath.mulDiv(max, max, max);
    assertEq(r1, max);
    
    // 应该失败（结果溢出）
    vm.expectRevert();
    FullMath.mulDiv(max, max, 1);
}
```

### 精度测试

```solidity
function testPrecision() public {
    uint256 a = 1e30;
    uint256 b = 1e20;
    uint256 c = 1e18;
    
    // 传统方法会溢出
    // uint256 wrong = (a * b) / c;  // 失败
    
    // FullMath 正确
    uint256 correct = FullMath.mulDiv(a, b, c);
    assertEq(correct, 1e32);
}
```

---

## 11. 总结：核心收获

### 🎯 数学原理

1. **中国剩余定理** - 重构大数
2. **模逆元** - 除法转乘法
3. **Newton-Raphson** - 快速收敛

### 🔧 工程技巧

1. **利用 EVM 原生能力** (`mulmod`)
2. **位运算优化** (提取 2 的幂)
3. **分阶段处理** (简单/复杂分支)
4. **unchecked 优化** (已证明安全时)

### 💡 设计理念

1. **精度优先** - DeFi 中不能有舍入误差
2. **安全第一** - 宁可失败也不给出错误结果
3. **性能平衡** - 在需要时付出 gas 成本

### 📚 可迁移的知识

应用到你的项目：
- ✅ 任何涉及大数计算的场景
- ✅ 需要高精度的金融应用
- ✅ 复杂的比例和份额计算
- ✅ 自定义的定点数运算

---

## 12. 延伸阅读

### 推荐资源

1. **原始论文**：[Remco Bloemen's Blog](https://xn--2-umb.com/21/muldiv)
2. **EVM 操作码**：[evm.codes](https://www.evm.codes/)
3. **模运算**：[Khan Academy - Modular Arithmetic](https://www.khanacademy.org/computing/computer-science/cryptography/modarithmetic)
4. **Newton-Raphson**：[Wikipedia](https://en.wikipedia.org/wiki/Newton%27s_method)

### Uniswap V3 中的应用

在 Uniswap V3 中，FullMath 被大量使用：
- SqrtPriceMath - 计算价格和流动性
- LiquidityAmounts - 计算流动性份额
- SwapMath - 计算交换结果

---

## 13. 实践练习

### 练习 1：实现 mulDivDown

```solidity
// 实现向下取整的版本（提示：已经是了！）
function mulDivDown(uint256 a, uint256 b, uint256 denominator)
    internal pure returns (uint256)
{
    // 你的实现
}
```

### 练习 2：实现三数乘除

```solidity
// 计算 (a * b * c) / d，避免溢出
function mulMulDiv(
    uint256 a, 
    uint256 b, 
    uint256 c, 
    uint256 d
) internal pure returns (uint256) {
    // 提示：分步使用 mulDiv
}
```

### 练习 3：实现平方根（使用类似技巧）

```solidity
// 使用 Newton-Raphson 计算平方根
function sqrt(uint256 x) internal pure returns (uint256) {
    // 你的实现
}
```

---

**学习日期**：2025-12-12  
**核心文件**：`src/libraries/FullMath.sol`  
**难度级别**：⭐⭐⭐⭐⭐ (高级)  
**重要性**：⭐⭐⭐⭐⭐ (核心基础设施)

