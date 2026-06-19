

# Create2

CREATE2 is not an arbitrary name — it is a dedicated contract-deployment opcode introduced by Ethereum in EIP-1014 (the Constantinople upgrade in 2019).
With CREATE, the resulting address is unpredictable (unless you know the deployer's nonce), so you cannot hardcode the address in advance. The contract address is determined by keccak256(rlp(sender, nonce)), and is independent of the contract's code.
With CREATE2, the address can be computed ahead of time: once the deployer + salt + init_code are fixed, the contract address is determined and independent of when deployment happens.
Official docs: https://docs.soliditylang.org/zh-cn/v0.8.24/control-structures.html#create2   


## Two Deployment Approaches
### Using Solidity directly: deploy via the `new` keyword, with an additional `{salt}` parameter compared to plain CREATE
Returns the contract type; `salt` is a `bytes32`.
```solidity
D d = new D{salt: salt}(arg);
```


### Yul Inline Assembly
Returns an `address`; `salt` is likewise a `bytes32`.
```solidity
  assembly {
      pair := create2(
        0,                  // the amount of wei to send
        add(bytecode, 32),  // start position of the bytecode
        mload(bytecode),    // length of the bytecode
        salt                // salt
        )
  }

```
In Solidity, the memory layout of `bytes memory` is: the first 32 bytes hold the length of the data, and the actual data begins right after those 32 bytes.
```perl
| offset → | 0x00 ... 0x1f | 0x20 ...     |
| content  | length (n)    | actual byte data |
```
So we end up with:
```solidity
create2(
  v, 
  p,  // the position of the actual data, which is the bytecode position plus 32 — i.e. add(bytecode, 32)
  n,  // the length to read; loading bytecode directly, the first thing read is exactly the length
  s
)
```

## Predicting the Address

```solidity
bytes32 hash = keccak256(abi.encodePacked(
    bytes1(0xff),  // a fixed single byte
    address(this),  // the current contract's address
    salt,           // the bytes32 salt
    keccak256(bytecode)  // the hash of the bytecode
));
address predictedAddress = address(uint160(uint256(hash)));
```
### bytecode
This is the contract's creation bytecode combined with the constructor arguments.
```solidity
bytes memory bytecode = abi.encodePacked(type(Deployed).creationCode,abi.encode(arg));
```

### Obtaining a Contract's Creation Bytecode
```solidity
bytes memory bytecode = type(Deployed).creationCode; 
```
![](./类型信息.png)
Related links: https://docs.soliditylang.org/zh-cn/v0.8.24/cheatsheet.html#index-9   \
https://docs.soliditylang.org/zh-cn/v0.8.24/units-and-global-variables.html#meta-type

## Full Example

```solidity
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;
contract Deployed {
    uint public x;
    constructor(uint a) {
        x = a;
    }
}

contract C {

    function createDSalted(uint salt, uint arg) public {
        
        bytes32 s = bytes32(salt);
        bytes memory bytecode = abi.encodePacked(
                type(Deployed).creationCode,
                abi.encode(arg)
            );

        bytes32 hash = keccak256(abi.encodePacked(
            bytes1(0xff),
            address(this),
            s,
            keccak256(bytecode)
        ));
        address predictedAddress = address(uint160(uint256(hash)));

        // Deploy using Solidity's new + {salt:salt}
        // Deployed deployed = new Deployed{salt: bytes32(salt)}(arg);
        // require(predictedAddress == address(deployed));

        // ---------
        // Deploy using create2 in inline assembly
        address deployed;
        assembly {
            deployed := create2(0, add(bytecode, 32), mload(bytecode), s)
        }
        require(deployed != address(0), "CREATE2 failed");
        require(predictedAddress == deployed);
    }
}
```



