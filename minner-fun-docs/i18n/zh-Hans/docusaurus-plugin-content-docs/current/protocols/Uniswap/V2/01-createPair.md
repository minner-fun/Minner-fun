# how to create pair

## Pair合约的部署

源码位置：v2-core\UniswapV2Factory.sol
```solidity
    function createPair(
        address tokenA,
        address tokenB
    ) external returns (address pair) {
        ...
        // 地址排序，根据地址的数值的大小排序，小的地址作为 token0，大的地址作为 token1
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB): (tokenB, tokenA);         
        ...       
        // 获取UniswapV2Pair合约的创建字节码。由于没有参数所以，可以直接用合约的创建字节码来创建合约
        bytes memory bytecode = type(UniswapV2Pair).creationCode;    
        // 使用token0和token1的哈希值做为create2创建的salt
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));         
        // 使用内联汇编的create2创建pair对合约
        assembly {
            pair := create2(0, add(bytecode, 32), mload(bytecode), salt)   
        }
        // 初始化pair对合约
        IUniswapV2Pair(pair).initialize(token0, token1);                   
        ...
    }
```
1、将待创建的代币对，根据数值大小进行排序，小的为token0，大的为token1.经过排序，确保代币对的唯一性   
2、使用token0与token1的hash值做为create2的salt。确保每一个不同的代币对部署的Pair合约是唯一的。

## Pair合约的地址预测

源码位置：v2-periphery\libraries\UniswapV2Library.sol
```solidity
function pairFor(
    address factory,
    address tokenA,
    address tokenB
) internal pure returns (address pair) {
    (address token0, address token1) = sortTokens(tokenA, tokenB);
    pair = address(
        uint160(                        // 源码中这里是直接address(uint256)
            uint256(
                keccak256(
                    abi.encodePacked(
                        hex"ff",
                        factory,                                      // 原本部署Pair合约的合约地址
                        keccak256(abi.encodePacked(token0, token1)),  // salt这个是盐
                        hex"e5f0654349919aa34a4049b3b38b500bfe67dc33ebf6f9c27c9effe07f34c007" // Pair合约的创建字节码
                    )
                )
            )
        )
    );
}
```
pairFor方法展示的就是create2内部实际的运算过程。和实际部署不同的是，这里只是运算出合约的地址。不做部署操作。


## 提炼与借鉴
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Pair{
    address public token0;
    address public token1;
    function initialze(address _token0, address _token1) external{
        token0 = _token0;
        token1 = _token1;
    }
}


contract Factory{

    function createPairCreationCodeHash() public pure returns(bytes32){
        return keccak256(type(Pair).creationCode);
    }

    function createPair(
        address tokenA,
        address tokenB
    ) external returns (address pair) {
        
        // 地址排序，根据地址的数值的大小排序，小的地址作为 token0，大的地址作为 token1
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB): (tokenB, tokenA);         
           
        // 获取UniswapV2Pair合约的创建字节码。由于没有参数所以，可以直接用合约的创建字节码来创建合约
        bytes memory bytecode = type(Pair).creationCode;    
        // 使用token0和token1的哈希值做为create2创建的salt
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));         
        // 使用内联汇编的create2创建pair对合约
        assembly {
            pair := create2(0, add(bytecode, 32), mload(bytecode), salt)   
        }
    }
}

contract Other{
    function pairFor(
        address factory,
        address tokenA,
        address tokenB
    ) public pure returns (address pair) {
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB): (tokenB, tokenA);         

        pair = address(
            uint160(                        
                uint256(
                    keccak256(
                        abi.encodePacked(
                            hex"ff",
                            factory,                                      
                            keccak256(abi.encodePacked(token0, token1)),  // salt这个是盐
                            hex"e395887821067e0a09d03644b6a2426511198610733c6617ab9b62d66830d870" // Pair合约的创建字节码
                        )
                    )
                )
            )
        );
    }
}
```
