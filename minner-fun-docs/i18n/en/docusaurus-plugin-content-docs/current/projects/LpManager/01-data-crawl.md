# Data Collection
Alchemy RPC, fetching at most 10 blocks per request, using web3.py
## Real-Time Data

## Historical Data
Use the `get_logs()` method to query the logs of these 4 events across 10 blocks.
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

## Data Tables
The factory contract listens for the PoolCreated event.
block, token, pool
When listening for the PoolCreated event, collect the pool information, then check whether the token has already been saved; if not, collect the token. This data flow still needs another review.

The POOLS contract listens for these 4 events, and 4 corresponding tables are created.
swap: all swap events
mint: who entered
burn: who exited
collect: who claimed fees

TVL: amount0 * price0 + amount1 * price1. The price is available in the swap table; for the amount, the most accurate approach is to call the contract directly.
```python
token0.balanceOf(pool)
token1.balanceOf(pool)
token0_contract.functions.balanceOf(pool_address).call()
token1_contract.functions.balanceOf(pool_address).call()
```

Volume_24H: the sum of the absolute values of amount0 for each trade. For pools that include a stablecoin, it is best to compute it in terms of the stablecoin. This is also calculated from the swap table.

VOL/TVL: capital efficiency. The higher the better; 1 is average, 2 is very good.

Fee APR: volume_24h × fee_rate / TVL * 365. Multiply trading volume by the fee rate to get total fee revenue, then divide by TVL to get the yield, then multiply by 365 to annualize it. vol and TVL are already computed; fee_rate comes from a property of the given pool, in the pools table.

price volatility: the standard deviation of the price.
```python
import numpy as np

returns = np.log(price[1:] / price[:-1])
volatility = np.std(returns)
```

IL: Impermanent Loss. How is this calculated?

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
