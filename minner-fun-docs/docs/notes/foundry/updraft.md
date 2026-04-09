
# updraft

## cast 其他命令
### 转换16进制
```shell
cast --to-base 0x714e1 dec
```

### send
```shell
cast send 0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6 "store(uint256)" 1337 --rpc-url $RPC_URL --account minner-key
```

### call
```shell
cast call 0x5FbDB2315678afecb367f032d93F642f64180aa3 "retrieve()"
```

## cast wallet
[官方文档](https://www.getfoundry.sh/reference/cast/wallet)另外还有几个命令是关于助记词的，还有签名用的  
加密后的数据在根目录的.foundry/keystores文件夹中

### 创建地址
```shell
cast wallet new or n
cast wallet n
```

### 导入账号
```shell
cast wallet import or i
cast wallet import xxxx-name --private-key xxxxxxxx-key  直接明写私钥
cast wallet i xxxx-name --interactive  交互式输入秘钥
```
最佳实践：
```shell
新开一个终端
cast wallet i xxxx-name --interactive  交互式输入秘钥
然后
history -c
关闭终端
```


### 删除
删除某个账号要加--name
```shell
cast wallet remove or rm
cast wallet remove --name anvil-02
```
### 查询
```shell
cast wallet list or ls 查看保存的账号别名
cast wallet ls
```
### 根据别名查公钥
```shell
cast wallet address or a or addr
cast wallet address --account anvil-01
```
### 根据别名查私钥
```shell
cast wallet decrypt-keystore or dk
cast wallet decrypt-keystore anvil-01
```

## env
.env文件里，=两边不能有空格
```shell
source .env  
echo $PRIVATE_KEY
```
.env 模版
```shell
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/xxxxx
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/xxxxxx
ARBITRUM_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/xxxxxxx
ANVIL_RPC_URL=http://127.0.0.1:8545
ANVIL_PRIVATE_KEY=xxxxxxxxxxxxxxxxxxxx
```

## makeFile

## foundry.toml文件


## forge test
forge test --mt testPriceFeedVersionIsAccurate

### 判断作弊码
```solidity
assertEq (fundMe.i_owner ( ), address ( this ));  // 判断相等

hoax = deal + prank 直接加eth + 换msg.sender

address alice = makeAddr("alice"); 创造alice用户
vm.deal(alice, BALANCE) 给alice加钱
vm.prank(alice) 下一行是alice执行

vm.startPrank(alice)
...中间多行都有alice执行
vm.stopPrank()


vm.startBroadcast();  // 表示这之间的代码是要发送的交易，交易就是要修改区块链状态的行为
HelperConfig helperConfig = new HelperConfig();
FundMe fundMe = new FundMe(helperConfig.activeNetworkConfig());
vm.stopBroadcast();


vm.warp(block.timestamp + interval + 1); // 改变时间戳
vm.roll(block.number + 1);    // 区块加一


vm.txGasPrice(GAS_PRICE); foundry的作弊码，用来改变tx.gasprice

vm.envBytes32() 从环境变量中读取bytes32类型的数据
vm.envUint() 从环境变量中读取uint256类型的数据
```

### 测试事件 是否被触发
要先在测试文件中再次定义出来这个事件，然后
```solidity
function testEmitsEventOnEntrance() public {
    vm.prank(alice);
    // 期待抛出的事件
    vm.expectEmit(true, false, false, false, address(raffle));
    // 在测试文件中主动触发一次
    emit EnteredRaffle(alice);
    // 调用实际的代码
    raffle.enterRaffle{value: 0.5 ether}();
}
```

### 测试事件中的参数
```solidity
vm.recordLogs();  // 开启录制
raffle.performUpkeep("");  // 触发
Vm.Log[] memory entries = vm.getRecordedLogs(); // 获取录制结果
bytes32 requestId = entries[1].topics[1];  // 取出目标数据

```

### 测试自定义错误
需要用到自定义错误的选择器，针对报错的参数，进行签名，明确好了报错后，然后再触发
```solidity
vm.expectRevert(); // 只抛出，能抛出来就过，不管错误的名称类型是什么

vm.expectRevert(
    abi.encodeWithSelector(
        Raffle.Raffle_UpkeepNotNeeded.selector,
        0,
        0,
        raffleStatus
    )
);
vm.prank(alice);
raffle.performUpkeep("");
```

### 模糊测试
foundry 测试方法有形参，那么就形成模糊测试，foundry会自动给这个方法随机值
模糊测试使用bound设置参数的取数范围
```solidity
uint256 additionalEntrants = bound(additionalEntrantsNum, 1, 10000);
```


### 测试覆盖率
```shell
--report xxx后面有一个选项，debug还能看，summary其实就是和forge coverage效果一样

forge coverage --fork-url $SEPOLIA_RPC_URL 
forge coverage --report debug > coverage.txt
```


### -v的个数的含义
```
Verbosity levels:
- 2: Print logs for all tests
- 3: Print execution traces for failing tests
- 4: Print execution traces for all tests, and setup traces for failing tests
- 5: Print execution and setup traces for all tests
```

### 测试的类型
Unit tests: 专注于隔离和测试智能合约的各个功能或特性。
Integration tests: 验证智能合约如何与其他合约或外部系统交互。
Forking tests: 分叉是指在特定时间点创建区块链状态的副本。这个副本（称为分叉）随后用于在模拟环境中运行测试。
Staging tests: 在主网部署之前，在预发布环境中对已部署的智能合约执行测试。



## 安装依赖
github项目地址为https://github.com/smartcontractkit/chainlink-brownie-contracts
安装命令为：forge install smartcontractkit/chainlink-brownie-contracts@0.6.1

chainlink的vrf2.5的安装地址：forge install /smartcontractkit/chainlink-brownie-contracts
项目链接为：https://github.com/smartcontractkit/chainlink-brownie-contracts


## 关于gas
查看gas价格：https://etherscan.io/gastracker
换算关系https://www.alchemy.com/gwei-calculator
价格https://coinmarketcap.com/
```shell
forge snapshot --mt testOwnerIsMsgSender
```
gas消耗
```solidity
gasleft() solidity的方法，返回剩余的gas
tx.gasprice; solidity中的属性，当前的交易的gas价格

vm.txGasPrice(GAS_PRICE); foundry的作弊码，用来改变tx.gasprice

```
gas消耗问题：定义一个数组，然后重新赋值新数组。其实这会消耗大量gas，随着元素的增多而增多。改用mapping与count的组合，将地址放入mapping中，用count计数，当需要清空时，直接把count置为0，从头开始覆盖。
```solidity
address payable[] s_players
s_players = new address payable[](0)

mapping(uint256 => address payable) s_players;
uint256 s_players = 0;
```

测试一个调用所消耗的gas
```solidity
function testWithdrawFromASingleFunder() public funded {
    uint256 startingFundMeBalance = address(fundMe).balance;
    uint256 startingOwnerBalance = owner.balance;

    vm.txGasPrice(GAS_PRICE);
    uint256 gasStart = gasleft();

    vm.startPrank(owner);
    fundMe.withdraw();
    vm.stopPrank();

    uint256 gasEnd = gasleft();
    uint256 gasUsed = (gasStart - gasEnd) * tx.gasprice;
    console2.log("Withdraw consumed: %d gas", gasUsed);
    console2.log("tx.gasprice", tx.gasprice);

    uint256 endingFundMeBalance = address(fundMe).balance;
    uint256 endingOwnerBalance = owner.balance;
    assertEq(endingFundMeBalance, 0);
    assertEq(startingOwnerBalance + startingFundMeBalance, endingOwnerBalance);
}
```
## 通过存储分析gaa
fundme的21课从存储结构的角度，解读如何节省gas

vm.load();  加载存储数据
forge inspect FundMe storageLayout 查看存储超结构
cast storage 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 2  通过合约地址查看存储情况


## 其他

forge init   初始化项目
forge init --force

forge fmt 格式化，把自动保存改用光标转移保存，不设置自动保存。手动firge fmt格式化

anvil  开启本地虚拟环境
部署 目前看就是需要用--broadcast 意思是进行广播，进行实际部署，如果不加表示模拟部署
```bash
$ forge create SimpleStorage --private-key ac0974bec39a17e36ba4a6b4d238fcbed5efcae784d7bf4f2ff80 --rpc-url http://127.0.0.1:8545 --broadcast
```
不提供私钥，就要知道unlocked和from的地址
```bash
$ forge create SimpleStorage --unlocked --from 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --rpc-url http://127.0.0.1:8545 --broadcast
```

通script部署
forge script script/SimpleStorage.s.sol --private-key ac0974bec39a17e3478cbed5efcae784d7bf4f2ff80 --rpc-url http://127.0.0.1:8545 --broadcast

forge create SimpleStorage --interactive 表示交互式输入私钥
不写--rpc-url 默认使用Anvil的网络

foundry的最佳实践https://www.getfoundry.sh/best-practices#scripts
forge-std称为Forge标准库，旨在简化和增强foundry开发框架内的脚本编写和测试能力

关于script，运行script 会参数broadcast文件夹，里面是运行记录。
每一个script都要继承Script，并且实现run方法，可见性为external类型
脚本都用.s.sol结尾


forge script script/SimpleStorage.s.sol --rpc-url $RPC_KEY --broadcast --account minner-key --sender 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266


部署
forge script script/SimpleStorage.s.sol --rpc-url $RPC_URL_SEPOLIA --broadcast --account sepolia-01 --with-gas-price 2gwei -vvvv

forge script script/DeployFundMe.s.sol:DeployFundMe --rpc-url $(SEPOLIA_RPC_URL) --private-key $(PRIVATE_KEY) --broadcast --verify --etherscan-api-key $(ETHERSCAN_API_KEY) -vvvv

部署合约时，如果直接在测试合约中new xx(),那么msg.sender就为测试合约。如果是用了vm.startBroadcast();其实msg.sender就是我们的默认外部账号的地址。这个地址和anvil链上没有关系。这是测试内置的账号。



uint160 是可以直接转为 address类型， uint256不行


chisel 是一个交互环境



部署
```bash
$ forge script DeployFundMe --rpc-url $ANVIL_RPC_URL --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --broadcast
```

forge install Cyfrin/foundry-devops 安装包


## 代码风格
### NATSPEC 注释
官方文档：https://docs.soliditylang.org/zh-cn/v0.8.24/natspec-format.html#natspec

```
@title
A title that should describe the contract/interface
contract, library, interface, struct, enum, enum values

@author
The name of the author
contract, library, interface, struct, enum, enum values

@notice
Explain to an end user what this does
contract, library, interface, function, public state variable, event, struct, enum, enum values error

@dev
Explain to a developer any extra details
contract, library, interface, function, state variable, event, struct, enum, enum values, error

@param
Documents a parameter just like in Doxygen (must be followed by parameter name)
function, event, enum values, error

@return
Documents the return variables of a contract’s function
function, enum, enum values, public state variable

@inheritdoc
Copies all missing tags from the base function (must be followed by the contract name)
function, enum, enum values, public state variable

@custom:...
Custom tag, semantics is application-defined
everywhere
```

### 代码布局排序
https://docs.soliditylang.org/en/latest/style-guide.html#order-of-layout
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

### 变量命名风格
状态变量加上 s_的前缀
immutable 变量前加i_
自定义错误前 加上合约名字 error Raffle_NotEnoughEthSend();

，event不是随便用的，用着状态变量改变的时候

### CEI模式，先检查，再改装，最后进行交互
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



当安装了某个库，然后有卸载又安装反复折腾后
```shell
git submodule deinit -f -- lib/openzeppelin-contracts-upgradeable
git rm -f lib/openzeppelin-contracts-upgradeable
rm -rf .git/modules/lib/openzeppelin-contracts-upgradeable
rm -rf lib/openzeppelin-contracts-upgradeable
forge install OpenZeppelin/openzeppelin-contracts-upgradeable@release-v4.9  # 指定release-v4.9分支
forge build
```

MLaunch
onlyOwner initializer 的问题
```solidity
    function initialize(
        PositionManager _positionManager,
        address _memecoinTreasuryImplementation
    ) external onlyOwner initializer {
        positionManager = _positionManager;
        memecoinTreasuryImplementation = _memecoinTreasuryImplementation;
    }


    constructor(address _memecoinImplementation, string memory _baseURI) {
        s_memecoinImplementation = _memecoinImplementation;
        s_baseURI = _baseURI;      ??????????
        _initializeOwner(msg.sender);      ?????????????
    }

```
erc 721 三个抽象方法，baseURI是啥意思
