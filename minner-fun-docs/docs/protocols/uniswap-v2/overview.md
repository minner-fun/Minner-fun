# Uniswap V2 Overview

Uniswap V2 is an automated market maker (AMM) protocol that enables decentralized token swaps on Ethereum.

## Core Concepts

### Constant Product Formula

Uniswap V2 uses the constant product formula:

```
x * y = k
```

Where:
- `x` = reserve of token A
- `y` = reserve of token B
- `k` = constant product

When you trade, the product `k` remains constant (minus fees).

## Architecture

### Core Contracts

#### UniswapV2Pair
The pair contract holds the reserves for two tokens and implements the core swap logic.

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
Creates and tracks all pairs.

```solidity
interface IUniswapV2Factory {
    function createPair(address tokenA, address tokenB) 
        external returns (address pair);
    
    function getPair(address tokenA, address tokenB) 
        external view returns (address pair);
}
```

#### UniswapV2Router02
Helper contract that makes it easier to interact with pairs.

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

## Key Features

### 1. ERC-20 Pairs
Any ERC-20 token can be paired with any other ERC-20 token.

### 2. Price Oracle
Time-weighted average price (TWAP) oracle built into every pair:

```solidity
uint public price0CumulativeLast;
uint public price1CumulativeLast;
```

### 3. Flash Swaps
Borrow tokens, use them, and pay them back in the same transaction.

### 4. Protocol Fee
Optional 0.05% fee that can be turned on by governance (currently off).

## Trading Fees

- **0.30%** fee on all trades
- Paid by traders
- Distributed to liquidity providers

## Liquidity Provision

### Adding Liquidity

1. Approve tokens for router
2. Call `addLiquidity()` with desired amounts
3. Receive LP tokens representing your share

### Removing Liquidity

1. Approve LP tokens for router
2. Call `removeLiquidity()`
3. Receive proportional share of pool reserves

## Price Impact

The larger your trade relative to pool reserves, the more price impact:

```
price_impact = (amount_in / reserve_in) * 100%
```

## Impermanent Loss

When you provide liquidity, you're exposed to impermanent loss if the price ratio changes.

Formula for impermanent loss:
```
IL = 2 * sqrt(price_ratio) / (1 + price_ratio) - 1
```

## Security Considerations

1. **Reentrancy Protection**: All state changes before external calls
2. **Balance Checks**: Verify balances changed as expected
3. **Deadline Parameters**: Prevent transactions from executing at unfavorable prices
4. **Slippage Protection**: `amountOutMin` parameters

## Resources

- [Uniswap V2 Documentation](https://docs.uniswap.org/protocol/V2/introduction)
- [Smart Contracts](https://github.com/Uniswap/v2-core)
- [Whitepaper](https://uniswap.org/whitepaper.pdf)

