# 关键指标

关键指标
TVL:总锁仓量，也就是这个池子里两种代币的总的价值，所以是数量*价格。amount0 * price0 + amount1 * price1. 数量，直接拿着池子的地址去对应token的balance方法去查。price 更具squtPriceX96来计算。这个当前只能获取到当前的amount，所以只能算当前的TVL。
Volume_24H: 24小时交易量。根据某一个代币的转入转出量的绝对值，求和。只需要盯着一个算。
Volume/TVL: 资金利用率。衡量资金活跃度。活跃度越高越好。
Fee APR: 年化收益率。 fee = volume * fee_rate。    APR = daily_fee × 365 / TVL
Volatility: 波动率。价格的标准差
LP Score：综合打分
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
还是先整好自动调整的动作，这个简单，难的是策略，和回撤计算。
