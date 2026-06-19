# Uniswap V3 vs V2 Interview Guide

> A detailed comparison document to help you deeply understand the core differences between Uniswap V3 and V2 in DeFi engineer interviews


---
## 1. Basics
### 1.1 Core Principle: tick
#### V2
[A V2 curve on desmos](https://www.desmos.com/calculator/7wbvkts2jf)
Price range: from positive infinity to negative infinity — the full price range (0 to ∞)
The problem is that a real token-pair swap can never be that extreme. So within fairly extreme ranges, capital ends up wasted.

#### V3
token0 is always placed on the X-axis and token1 on the Y-axis. P = Y/X, and the tick is computed based on this P.
V3 stores $\sqrt{P}$ as a Q64.96 fixed-point value. After taking the square root, the price takes values in the range

$$\sqrt{P} => [2^{-64}, 2^{64}]$$

To further break up the price interval, define:

$$p(i) = 1.0001^i$$

So:

$$\sqrt{p(i)} = \sqrt{1.0001}^i = 1.0001 ^{\frac{i}{2}}$$

That is:

$$1.0001 ^{\frac{i}{2}} => [2^{-64}, 2^{64}] $$

The range of i is:

$$[log_{1.0001}2^{-64}, log_{1.0001}{2^{64}}] =>[-887272, 887272]$$

i is the value of the tick
> First bound the price range, then cleverly discretize the liquidity interval by taking the logarithm of the price

#### Q64.96 Fixed-Point Number
Essentially, it treats the top 64 bits of a uint160 unsigned integer as the integer part and the remaining 96 bits as the fractional part.
So the number 2^96, originally stored in a uint160, becomes 1 when read through the Q64.96 lens, because the trailing 96 zeros are treated as the fractional part.
Conversely, for `uint160 sqrtPriceX96;`, it represents the square root of the price multiplied by 2^96 in order to be a uint160 value. So it is precisely by this definition that we conclude $\sqrt{P}$ is a Q64.96 value.

## Recap

```solidity
int24 internal constant MIN_TICK = -887272;
int24 internal constant MAX_TICK = -MIN_TICK;
```
bounds it to

$$ Tick => [-887272, 887272] $$

because:

$$p(i) = 1.0001^i => p(i) = [1.0001^{-887272}, 1.0001^{887272}]$$

that is:

$$\sqrt{p(i)} = \sqrt{1.0001}^i = 1.0001 ^{\frac{i}{2}} = [1.0001^{-443636}, 1.0001^{443636}]$$


```solidity
struct Slot0 {
    uint160 sqrtPriceX96;
    int24 tick;
    ...
}
```
Then, $\sqrt{P}$ is stored as a Q64.96 fixed-point number. sqrtPrice is multiplied by 2^96 and stored in a uint160 unsigned integer.



**Tick Spacing** (see `UniswapV3Factory.sol:26-31`):
```solidity
// Different fee tiers map to different tickSpacing values
feeAmountTickSpacing[500] = 10;    // 0.05% fee maps to a spacing of 10, so the price step becomes 0.1%
feeAmountTickSpacing[3000] = 60;   // 0.3% fee
feeAmountTickSpacing[10000] = 200; // 1% fee
```
There is no strict computational relationship; it is just roughly fee/rate = 5.
**Why is Tick Spacing needed?**
- Reduces the number of usable ticks, lowering gas cost
- Prevents liquidity from becoming too fragmented
- Different fee tiers correspond to different market volatility

**Code implementation** (`UniswapV3Pool.sol:93-95`):
```solidity
mapping(int24 => Tick.Info) public override ticks;      // Tick info
mapping(int16 => uint256) public override tickBitmap;  // Tick bitmap, for fast lookup
```
TickBitmap.sol:28 filters usable ticks by spacing
```solidity
require(tick % tickSpacing == 0); // ensure that the tick is spaced
```

## Key Metrics
A V3 pool is made up of 4 elements: token0, token1, fee, and tickSpacing
$$price = \left(\frac{\sqrt{P_{X96}}}{2^{96}}\right)^2$$
Key metrics
TVL: total value locked — the combined value of the two tokens in the pool, so it is amount * price. amount0 * price0 + amount1 * price1. For the amounts, just query the corresponding token's balance method using the pool's address. The price is computed from sqrtPriceX96. This can currently only fetch the current amounts, so it can only compute the current TVL.
Volume_24H: 24-hour trading volume. Sum the absolute values of the inflow and outflow amounts of one of the tokens. You only need to track one of them.
Volume/TVL: capital utilization. Measures how actively capital is used. Higher is better.
Fee APR: annualized return. fee = volume * fee_rate.    APR = daily_fee × 365 / TVL
Volatility: the standard deviation of the price
LP Score: a composite score
```
score =
0.4 × volume_tvl
+
0.3 × fee_apr
-
0.2 × volatility
-
0.1 × liquidity_density
```
The plan is still to get the automatic rebalancing action in place first — that part is simple; the hard parts are the strategy and the drawdown calculation.
