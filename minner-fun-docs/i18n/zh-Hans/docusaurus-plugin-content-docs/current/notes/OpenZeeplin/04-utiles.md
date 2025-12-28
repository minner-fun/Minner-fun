# utils
官方文档：https://docs.openzeppelin.com/contracts/5.x/api/utils
## Context
提供上下文工具，_msgSender()，_msgData()重写这些方法，在有中间代理合约的情况下，可以越过中间代理合约，将上个合约的地址传递到下层，能让最终的执行合约获取到真正发起交易的地址，而不是返回代理地址

```solidity
import "@openzeppelin/contracts/utils/Context.sol";


// 示例：重写 _msgSender() 以支持元交易
contract MetaTransactionContract is Context {
    address public relayer;
    
    // 重写 _msgSender() 来提取真正的用户地址
    function _msgSender() internal view override returns (address) {
        // 检查是否是元交易
        if (msg.sender == relayer && msg.data.length >= 20) {
            // 从 msg.data 中提取用户地址（元交易场景）
            address user = address(bytes20(msg.data[0:20]));
            return user;  // 返回真正的用户地址
        }
        return msg.sender;  // 默认行为
    }
    
    function transfer(address to, uint256 amount) external {
        address sender = _msgSender();  // 可能是元交易中的用户地址
        // ...
    }
}
```

