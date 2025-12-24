# 基本使用
## mocha
这是js中的测试框架 https://mochajs.org/next/features/hooks/#_top

### beforeEach  https://mochajs.org/next/features/hooks/#_top
在每个it模块开始时，都执行一遍

```js
let xxx, xxx,xxx        // 配合全局变量调用
beforeEach(async function(){
    ...
})
```

### loadFixture
只执行一遍
```js

const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
  async function deployTokenFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();
    const hardhatToken = await ethers.deployContract("Token");
    return { hardhatToken, owner, addr1, addr2 };
  }

describe("Token xxxx", function () {
  it("Should xxxx", async function () {
    const { hardhatToken, owner } = await loadFixture(deployTokenFixture);
    ....
  });

})

```


### 测试基本写法
```js
const { expect } = require("chai");

// time的导入路径
const { time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("TimeLock2", function(){
    it("should workd", async function(){
        let currnetTime = time.latest();  //最后一个区块的时间戳
        // 设置下个交易的区块的时间，要有真实的修改状态才行，查询的话不生产新区块，所以看不到效果
        await time.setNextBlockTimestamp(futureTime);

    })
})
```

### 合约初始化
```javascript
const [owner, other] = await ethers.getSigners();
const CallContract = await ethers.getContractFactory('CallContract');
const callContract = await CallContract.deploy();
await callContract.waitForDeployment()         // 等待部署完成
expect(await callContract.owner()).to.equal(owner.address);
```

### 测试报出指定错误
```js
await expect(....)to.be.reverted; // 会抛出错误
await expect(执行语句).to.be.revertedWith("too late"); // 报出指定错误
await expect(payTable.connect(other).getBalance())
.to.be.revertedWithCustomError(payTable, "OnlyOwnerCanCall")  // 抛出自定义错误 revertedWithCustomError
.withArgs(other, "don`t allow");                              // 自定义错误的参数 withArgs()
```
### 对于错误的抛出，为什么总是把await写到expect外面
```js
it("should revert with 'not allow' when called by non-clock", async function () {
    // 先明白called.connect(other).add(22,33))是返回的一个异步对象，如果用await等待这个异步对象了，那么
    // 就会拿到最终异步执行的结果。
    // 这里是要用chai断言库去拦截promise抛出的异常，所以不能拿到结果，要用还未执行异步promise传给expect
    // await expect(await called.connect(other).add(22,33)).to.be.revertedWith("not allow"); // 错误
    await expect(called.connect(other).add(22, 33)).to.be.revertedWith("not allow");         // 正确
})

```

### 判断相等
```js
expect(await xxx).to.equal(..);
```
判断大金额相等
```
await payTable.receiveETH({value:10000000000000000n});  // 注意这里value没有引号,
expect(await payTable.getBalance()).to.equal(10000000000000000n); // 数字n表示BigNumber是ethers中的类型。V6版本的写法。
```

### 更改时间

```js
// 把 EVM 时间往后推一段时间
await ethers.provider.send("evm_increaseTime", [3600]);
// 然后挖一个新区块，让时间变动生效
await ethers.provider.send("evm_mine");
```

### 在合约中添加log
```
import "hardhat/console.sol";
console.log("Factory: pair address is %s", pair);
```


### 加载特定位置的合约
提供ABI，提供地址
```solidity
  const pair = await hre.ethers.getContractAt(
    pairAbi,                                                    // pairAbi是pair对的abi 编译后得到的
    await factory.getPair(                                      // getPair是工厂合约中的函数，用于获取pair对的地址
      await token1.getAddress(),
      await token2.getAddress(),
      signer
    )
  );
```

### 数字形式
```solidity
// 人类可读 → Wei
ethers.parseUnits("100", 18)    // "100000000000000000000"

// Wei → 人类可读
ethers.formatUnits("100000000000000000000", 18)  // "100.0"
```

### 对于eth的操作
直接在传参的最后用大括号写{value:xxx}
```js
await routerContract.addLiquidityETH(
  tokenAddress,           // token 地址
  tokenLiquidityAmount,   // token 数量
  0,                      // amountTokenMin (滑点保护)
  0,                      // amountETHMin (滑点保护)
  signer.address,         // 接收 LP token 的地址
  deadline,               // 截止时间
  { value: ethLiquidityAmount }  // 🔥 关键：ETH 金额通过 value 传递
);
```
