# 数据采集
archemy的rpc，每次最多拉取10个区块， web3.py
## 实时数据

## 历史数据
用get_logs()方法，查询10个区块中的这4个event的log
```python
ALL_TOPICS = [POOL_MINT_TOPIC, POOL_BURN_TOPIC, POOL_COLLECT_TOPIC, POOL_SWAP_TOPIC]

params = {
    "address":   pools_address,
    "fromBlock": hex(batch_start),
    "toBlock":   hex(batch_end),
    "topics":    [ALL_TOPICS],
}

w3.eth.get_logs(params)
```

## 数据表
factory合约监听PoolCreated事件
block, token, pool
监听PoolCreated事件的时候，采集pool信息，然后检测该token是否已经保存，如果没有就采集token，，这个数据流程还要再看一下

POOLS合约监听这4个事件，也创建了这4张表
swap: 所有交换事件 
mint：谁进场了
burn：谁退出
collect：谁领取了手续费


TVL: amount0* price0 + amount1 * price1  price在swap表里就有，对于amount最准确的是直接调用合约。
```python
token0.balanceOf(pool)
token1.balanceOf(pool)
token0_contract.functions.balanceOf(pool_address).call()
token1_contract.functions.balanceOf(pool_address).call()
```

Volume_24H: amount0 每笔交易量的绝对值的加和。如果是包含稳定币池的词，用稳定币计算最好。也是根据swap表来算。

VOL/TVL:资金利用率 越高越好，1是一般，2是很好

Fee APR: volume_24h × fee_rate / TVL * 365 交易体量乘以费率得出总的手续费收益，然后除以TVL得出收益率，然后乘以365得出年化收益率  vol，TVL已经算出，fee_rate来自于某个池子的属性 pools表


price volatility 波动率： 价格的标准差，
```python
import numpy as np

returns = np.log(price[1:] / price[:-1])
volatility = np.std(returns)
```


IL: 无偿损失 Impermanent Loss :这个怎么算

lp score


```solidity
event PoolCreated(
    address indexed token0,
    address indexed token1,
    uint24 indexed fee,
    int24 tickSpacing,
    address pool
);

event Mint(
    address sender,
    address indexed owner,
    int24 indexed tickLower,
    int24 indexed tickUpper,
    uint128 amount,
    uint256 amount0,
    uint256 amount1
);

event Collect(
    address indexed owner,
    address recipient,
    int24 indexed tickLower,
    int24 indexed tickUpper,
    uint128 amount0,
    uint128 amount1
);

event Burn(
    address indexed owner,
    int24 indexed tickLower,
    int24 indexed tickUpper,
    uint128 amount,
    uint256 amount0,
    uint256 amount1
);


event Swap(
    address indexed sender,
    address indexed recipient,
    int256 amount0,
    int256 amount1,
    uint160 sqrtPriceX96,
    uint128 liquidity,
    int24 tick
);
```