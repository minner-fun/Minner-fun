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
block, token, pool

监听这4个事件，也创建了这4张表
swap: 所有交换事件 
mint：谁进场了
burn：谁退出
collect：谁领取了手续费


