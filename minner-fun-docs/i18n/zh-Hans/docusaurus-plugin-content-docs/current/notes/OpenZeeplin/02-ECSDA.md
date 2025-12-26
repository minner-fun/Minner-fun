# ECDSA.sol 
官方文档：https://docs.openzeppelin.com/contracts/5.x/api/utils/cryptography#ecdsa
签名验证和之前学习的与小狐狸钱包交互验证的过程是一样的。这里用的是库，之前讲的相当于签名与验签的原理

```solidity
function toEthSignedMessageHash(bytes32 messageHash) internal pure returns (bytes32 digest) {
    assembly ("memory-safe") {
        mstore(0x00, "\x19Ethereum Signed Message:\n32") // 32 is the bytes-length of messageHash
        mstore(0x1c, messageHash) // 0x1c (28) is the length of the prefix
        digest := keccak256(0x00, 0x3c) // 0x3c is the length of the prefix (0x1c) + messageHash (0x20)
    }
}

// 转为为solidity版本：这正是我们之前学的，一模一样，就是加了前缀，然后再哈希
function toEthSignedMessageHash(bytes32 messageHash) internal pure returns (bytes32) {
    // 把前缀和 messageHash 拼在一起再 keccak256
    return keccak256(
        abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            messageHash
        )
    );
}
```


MessageHashUtils