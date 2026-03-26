# Uniswap V3 vs V2 面试指南

> 一份详细的对比文档，帮助你在 DeFi 工程师面试中深入理解 Uniswap V3 与 V2 的核心区别


---
## 1. 基本情况
### 1.1、核心原理tick
#### V2
[desmos上的一个v2曲线](https://www.desmos.com/calculator/7wbvkts2jf)
价格范围：  正无穷，到，负无穷    全价格范围（0 到 ∞）
问题在于，真正的代币对的兑换，不可能这么极端。那么再比较极端的范围内，就造成了资金的浪费。   

#### V3
永远把token0放在X轴，把token1放在Y轴。P = Y/X, tick也是根据这个P来计算的
V3 把 $\sqrt{P}$ 存储为一个 Q64.96 类型的定点 开方后的价格的取值范围是

$$\sqrt{P} => [2^{-64}, 2^{64}]$$

为了把价格区间进一步打散，定义:

$$p(i) = 1.0001^i$$

所以：   

$$\sqrt{p(i)} = \sqrt{1.0001}^i = 1.0001 ^{\frac{i}{2}}$$   

也就是说：   

$$1.0001 ^{\frac{i}{2}} => [2^{-64}, 2^{64}] $$

i 的取值范围为：   

$$[log_{1.0001}2^{-64}, log_{1.0001}{2^{64}}] =>[-887272, 887272]$$

i就是tick的值  
> 先界定价格范围，在通过取价格的对数的方式，巧妙的把流动性区间离散化

#### Q64.96 定点数
其实就是把一个uint160的无符号整形的前64为当做整数部分，把其余的96位当做小数部分。   
所以，原本存在uint160 类型的2^96这个数。用Q64.96眼光来解读就成了1。因为后面的96个0为当成了小数部分。
反过来说，对于uint160 sqrtPriceX96;表示开方后的价格乘以2^96之后才能是一个unit160类型。所以也就是根据这个定义，才断定 $\sqrt{P}$是Q64.96类型

## 整理

```solidity
int24 internal constant MIN_TICK = -887272;
int24 internal constant MAX_TICK = -MIN_TICK;
```
限定了

$$ Tick => [-887272, 887272] $$

因为：

$$p(i) = 1.0001^i => p(i) = [1.0001^{-887272}, 1.0001^{887272}]$$

也就是：

$$\sqrt{p(i)} = \sqrt{1.0001}^i = 1.0001 ^{\frac{i}{2}} = [1.0001^{-443636}, 1.0001^{443636}]$$   


```solidity
struct Slot0 {
    uint160 sqrtPriceX96;
    int24 tick;
    ...
}
```
然后，把 $\sqrt{P}$ 存储为一个 Q64.96 类型的定点数。sqrtPrice 乘以 2^96后存储在uint160无符号整形中



**Tick Spacing**（见 `UniswapV3Factory.sol:26-31`）：
```solidity
// 不同手续费等级对应不同的 tickSpacing
feeAmountTickSpacing[500] = 10;    // 0.05% 手续费 对应间隔10，价格也就变成了 0.1%
feeAmountTickSpacing[3000] = 60;   // 0.3% 手续费
feeAmountTickSpacing[10000] = 200; // 1% 手续费
```
并没有严格的计算关系，只是类似 fee/rate = 5。
**为什么需要 Tick Spacing？**
- 减少可用的 tick 数量，降低 gas 成本
- 防止流动性过于分散
- 不同手续费等级对应不同的市场波动性

**代码实现**（`UniswapV3Pool.sol:93-95`）：
```solidity
mapping(int24 => Tick.Info) public override ticks;      // Tick 信息
mapping(int16 => uint256) public override tickBitmap;  // Tick 位图，快速查找
```
TickBitmap.sol:28 根据间距筛选可用tick
```solidity
require(tick % tickSpacing == 0); // ensure that the tick is spaced
```
