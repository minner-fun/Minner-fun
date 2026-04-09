## new bytes(0)的意义
```solidity
function safeTransferETH(address to, uint256 value) internal {  
    (bool success,) = to.call{value : value}(new bytes(0));
    require(success);
```
表示给 `to` 地址发送 ETH，但是不附带任何calldata。
```solidity
(bool success,) = to.call{value: value}(new bytes(0));
等价于
(bool success,) = to.call{value: value}("");
```


`new bytes(0)` 会生成一个长度为 0 的空字节数组（`bytes memory data = new bytes(0)`），作用和 `""` 一样，只是更明确告诉编译器“我要发的是空数据”。


## 验签

