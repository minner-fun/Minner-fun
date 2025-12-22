# Uniswap V2 概览

Uniswap V2 是一个自动化做市商（AMM）协议，可在以太坊上实现去中心化代币交换。

## 核心概念

### 恒定乘积公式

Uniswap V2 使用恒定乘积公式：

```
x * y = k
```

其中：
- `x` = 代币 A 的储备量
- `y` = 代币 B 的储备量
- `k` = 恒定乘积

当您交易时，乘积 `k` 保持不变（扣除手续费）。

## 架构

### 核心合约

#### UniswapV2Pair
配对合约持有两个代币的储备并实现核心交换逻辑。

```solidity
interface IUniswapV2Pair {
    function getReserves() external view returns (
        uint112 reserve0,
        uint112 reserve1,
        uint32 blockTimestampLast
    );
    
    function swap(
        uint amount0Out,
        uint amount1Out,
        address to,
        bytes calldata data
    ) external;
    
    function mint(address to) external returns (uint liquidity);
    function burn(address to) external returns (uint amount0, uint amount1);
}
```

#### UniswapV2Factory
创建并跟踪所有配对。

```solidity
interface IUniswapV2Factory {
    function createPair(address tokenA, address tokenB) 
        external returns (address pair);
    
    function getPair(address tokenA, address tokenB) 
        external view returns (address pair);
}
```

#### UniswapV2Router02
辅助合约，使与配对的交互更容易。

```solidity
interface IUniswapV2Router02 {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB, uint liquidity);
}
```

## 主要特性

### 1. ERC-20 配对
任何 ERC-20 代币都可以与任何其他 ERC-20 代币配对。

### 2. 价格预言机
每个配对都内置了时间加权平均价格（TWAP）预言机：

```solidity
uint public price0CumulativeLast;
uint public price1CumulativeLast;
```

### 3. 闪电交换
在同一笔交易中借用代币、使用它们并偿还。

### 4. 协议费用
可由治理开启的可选 0.05% 费用（目前关闭）。

## 交易手续费

- 所有交易收取 **0.30%** 手续费
- 由交易者支付
- 分配给流动性提供者

## 流动性提供

### 添加流动性

1. 为路由器批准代币
2. 使用所需数量调用 `addLiquidity()`
3. 接收代表您份额的 LP 代币

### 移除流动性

1. 为路由器批准 LP 代币
2. 调用 `removeLiquidity()`
3. 接收池储备的按比例份额

## 价格影响

相对于池储备，您的交易越大，价格影响就越大：

```
price_impact = (amount_in / reserve_in) * 100%
```

## 无常损失

当您提供流动性时，如果价格比率发生变化，您将面临无常损失。

无常损失公式：
```
IL = 2 * sqrt(price_ratio) / (1 + price_ratio) - 1
```

## 安全考虑

1. **重入保护**：在外部调用之前进行所有状态更改
2. **余额检查**：验证余额是否按预期更改
3. **截止时间参数**：防止交易以不利价格执行
4. **滑点保护**：`amountOutMin` 参数

## 资源

- [Uniswap V2 文档](https://docs.uniswap.org/protocol/V2/introduction)
- [智能合约](https://github.com/Uniswap/v2-core)
- [白皮书](https://uniswap.org/whitepaper.pdf)

