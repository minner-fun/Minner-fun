
# updraft
forge init   初始化项目
forge init --force


anvil  开启本地虚拟环境
部署 目前看就是需要用--broadcast
$ forge create SimpleStorage --private-key ac0974bec39a17e36ba4a6b4d238fcbed5efcae784d7bf4f2ff80 --rpc-url http://127.0.0.1:8545 --broadcast
不提供私钥，就要知道unlocked和from的地址
$ forge create SimpleStorage --unlocked --from 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --rpc-url http://127.0.0.1:8545 --broadcast

通script部署
forge script script/SimpleStorage.s.sol --private-key ac0974bec39a17e3478cbed5efcae784d7bf4f2ff80 --rpc-url http://127.0.0.1:8545 --broadcast

转换16进展，另外cast --help看用法
cast --to-base 0x714e1 dec

source .env  .env文件里，=两边不能有空格
echo $PRIVATE_KEY

用cast wallet 来管理私钥
cast wallet import key-name --interactive
最安全的做法是另起一个终端，然后输入这个命令，然后输入完密码与私钥后，清除掉历史 history -c
加密后的数据在根目录的.foundry/keystores文件夹中

forge script script/SimpleStorage.s.sol --rpc-url $RPC_KEY --broadcast --account minner-key --sender 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266


admin@Minner-PC MINGW64 ~/Codes/foundry-f23/foundry-simple-storage-f23 (main)
$ cast send 0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6 "store(uint256)" 1337 --rpc-url $RPC_URL --account minner-key

部署
forge script script/SimpleStorage.s.sol --rpc-url $RPC_URL_SEPOLIA --broadcast --account sepolia-01 --with-gas-price 2gwei -vvvv

forge fmt 格式化文档

forge script script/DeployFundMe.s.sol:DeployFundMe --rpc-url $(SEPOLIA_RPC_URL) --private-key $(PRIVATE_KEY) --broadcast --verify --etherscan-api-key $(ETHERSCAN_API_KEY) -vvvv


github项目地址为https://github.com/smartcontractkit/chainlink-brownie-contracts
安装命令为：forge install smartcontractkit/chainlink-brownie-contracts@0.6.1


chainlink的vrf2.5的安装地址：forge install /smartcontractkit/chainlink-brownie-contracts
项目链接为：https://github.com/smartcontractkit/chainlink-brownie-contracts

-v的个数的含义
```
Verbosity levels:
- 2: Print logs for all tests
- 3: Print execution traces for failing tests
- 4: Print execution traces for all tests, and setup traces for failing tests
- 5: Print execution and setup traces for all tests
```

forge test --mt testPriceFeedVersionIsAccurate

测试覆盖率
forge coverage --fork-url $SEPOLIA_RPC_URL 

部署合约时，如果直接在测试合约中new xx(),那么msg.sender就为测试合约。如果是用了vm.startBroadcast();其实msg.sender就是我们的默认外部账号的地址。这个地址和anvil链上没有关系。这是测试内置的账号。

address alice = makeAddr("alice"); 创造alice用户
vm.deal(alice, BALANCE) 给alice加钱
vm.prank(alice) 下一行是alice执行

vm.startPrank(alice)
...中间多行都有alice执行
vm.stopPrank()

uint160 是可以直接转为 address类型， uint256不行

hoax = deal + prank 直接加eth + 换msg.sender

chisel 是一个交互环境

gas消耗
forge snapshot --mt testOwnerIsMsgSender

gasleft() solidity的方法，返回剩余的gas
tx.gasprice; solidity中的属性，当前的交易的gas价格

vm.txGasPrice(GAS_PRICE); foundry的作弊码，用来改变tx.gasprice

vm.load();  加载存储数据
forge inspect FundMe storageLayout 查看存储超结构
cast storage 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 2  通过合约地址查看存储情况


部署
$ forge script DeployFundMe --rpc-url $ANVIL_RPC_URL --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --broadcast

forge install Cyfrin/foundry-devops 安装包



```solidity
// Layout of the contract file:
// version
// imports
// errors
// interfaces, libraries, contract
​
// Inside Contract:
// Type declarations
// State variables
// Events
// Modifiers
// Functions
​
// Layout of Functions:
// constructor
// receive function (if exists)
// fallback function (if exists)
// external
// public
// internal
// private
// view & pure functions
```

状态变量加上 s_的前缀，event不是随便用的，用着状态变量改变的时候


CEI模式，先检查，再改装，最后进行交互
```solidity
function coolFunction() public {
    // Checks
    checkX();
    checkY();
​
    // Effects
    updateStateM();
​
    // Interactions
    sendA();
    callB();
}
```

--fork-url  把某条链的相关状态fork到本地，来测试
--rpc-url   指定要在某条链上做事，只能是部署的时候，script有效，test无效

--broadcast 进行广播，把交易发送到链上， 执行脚本的时候如果不加这个，就只是模拟执行

vm.startBroadcast(), vm.stopBroadcast() 凡是修改链上数据的操作，都需要用这个包裹。

测试事件
要现在测试文件中再次定义出来这个错误，然后
```solidity
function testEmitsEventOnEntrance() public {
    vm.prank(alice);
    // 期待抛出的错误
    vm.expectEmit(true, false, false, false, address(raffle));
    // 在测试文件中主动触发一次
    emit EnteredRaffle(alice);
    // 调用实际的代码
    raffle.enterRaffle{value: 0.5 ether}();
}
```

vm.warp(block.timestamp + interval + 1); 改变时间戳

一个库，用来提供erc20了。
```
forge install transmissions11/solmate --no-commit
@solmate/=lib/solmate/src
```

git 忽略子模块
git config submodule.lib/chainlink-brownie-contracts.ignore all

forge install Cyfrin/foundry-devops --no-commit

-f强制卸载掉某个包 
forge remove smartcontractkit/chainlink-brownie-contracts -f

github拉下来一个新仓库，通过这个命令初始化安装依赖
git submodule update --init --recursive

--report xxx后面有一个选项，debug还能看，summary其实就是和forge coverage效果一样
forge coverage --report debug > coverage.txt

foundry 测试方法有形参，那么就形成模糊测试，foundry会自动给这个方法随机值
模糊测试使用bound设置参数的取数范围
```solidity
uint256 additionalEntrants = bound(additionalEntrantsNum, 1, 10000);
```
gas消耗问题：定义一个数组，然后重新赋值新数组。其实这会消耗大量gas，随着元素的增多而增多。改用mapping与count的组合，将地址放入mapping中，用count计数，当需要清空时，直接把count置为0，从头开始覆盖。
```
address payable[] s_players
s_players = new address payable[](0)

mapping(uint256 => address payable) s_players;
uint256 s_players = 0;
```