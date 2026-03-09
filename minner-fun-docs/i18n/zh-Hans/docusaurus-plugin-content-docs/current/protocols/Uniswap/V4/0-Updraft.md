Currency 保存的0地址表示的是该链的原生代币，非零的即为ERC-20代币

Currency类型 把原生代币与erc20代币，的转账，查询余额等操作统一了。在外部统一用Currency，在Curreny内部再判断代币类型，执行对应的转账，查余额等方法。典型应用就是用着PoolKey结构中。

PoolKey结构来定义交易对的唯一性，代币对，加上费率，价格变动的力度，加上hook的情况，共同标记了一个流动性池的唯一性   
PoolId：把PoolKey进行keccak256哈希的结果。是bytes32类型，在univ4，作为查询某个流动性池的主键
```solidity
struct PoolKey {
    /// @notice The lower currency of the pool, sorted numerically
    Currency currency0;
    /// @notice The higher currency of the pool, sorted numerically
    Currency currency1;
    /// @notice The pool LP fee
    uint24 fee;
    /// @notice The tick spacing for the pool
    int24 tickSpacing;
    /// @notice The hooks contract for the pool
    IHooks hooks;
}
```

UDVTs 用户自定义类型
```solidity
type Currency is address;
type PoolId is bytes32;
```
两个方法：
```solidity
unwrap() 把用户自定义类型转回原始的类型
wrap() 把原始类型转回自定义类型
```
在log的时候比较有用
```solidity

// To log it, we must convert it back to bytes32
bytes32 i = PoolId.unwrap(id);
console.logBytes32(i);   // 转成原始类型打印
​
// To convert a bytes32 back to a PoolId, we use wrap()
PoolId p = PoolId.wrap(i);  // 转回自定义类型用于其他逻辑
```

调用swap的流程：要先调用unlock方法，然后unlock方法会回调，该合约的的unlockCallback方法。所以只能是合约才能调用unlock方法，并且这个合约要实现了unlockCallback方法，也就是要实现IUnlockCallback接口

检查NonzeroDeltaCount，进行结算检查

lock 与 unlock是把状态做了瞬态存储

_accountDelta 负数 表示用户从PoolManager提取了代币，，正，表示用户向PoolManager发送了代币