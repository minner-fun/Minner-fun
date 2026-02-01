# 1、Foundry 基础指南

## 什么是 Foundry？

Foundry 是一个用 Rust 编写的快速、可移植、模块化的以太坊应用开发工具包。它包含四个主要组件：

- **Forge**: 以太坊测试框架（类似于 Truffle、Hardhat 和 DappTools）
- **Cast**: 与 EVM 智能合约交互的多功能工具
- **Anvil**: 本地以太坊节点（类似于 Ganache、Hardhat Network）
- **Chisel**: 快速、实用且详细的 Solidity REPL

## 安装 Foundry

### 在 Windows 上安装

1. **使用 Foundryup（推荐）**：
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

2. **使用 Scoop**：
```bash
scoop install foundry
```

3. **从源码构建**：
```bash
git clone https://github.com/foundry-rs/foundry
cd foundry
cargo install --path ./cli --bins --locked
```

### 验证安装

```bash
forge --version
cast --version
anvil --version
```

## 项目结构

Foundry 项目的标准目录结构：

```
my-project/
├── foundry.toml          # Foundry 配置文件
├── src/                  # 合约源码目录
│   └── Counter.sol
├── test/                 # 测试文件目录
│   └── Counter.t.sol
├── script/               # 部署脚本目录
│   └── Counter.s.sol
├── lib/                  # 依赖库目录
│   └── forge-std/
└── out/                  # 编译输出目录
    └── Counter.sol/
        └── Counter.json
```

## 创建新项目

```bash
# 创建新项目
forge init my-project
cd my-project

# 创建项目（使用模板）
forge init --template https://github.com/foundry-rs/forge-template my-project

# 强制在一个文件内初始化
forge init --force
```

## 基本配置

### foundry.toml 配置文件

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
test = "test"
cache_path = "cache"

# 编译器设置
solc = "0.8.19"
optimizer = true
optimizer_runs = 200
via_ir = false

# 测试设置
verbosity = 2
fuzz = { runs = 256 }
invariant = { runs = 256, depth = 15 }

# 格式化设置
[fmt]
line_length = 120
tab_width = 4
bracket_spacing = true

# RPC 端点
[rpc_endpoints]
mainnet = "https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_API_KEY}"
sepolia = "https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}"

# 以太扫描 API 密钥
[etherscan]
mainnet = { key = "${ETHERSCAN_API_KEY}" }
sepolia = { key = "${ETHERSCAN_API_KEY}" }
```

## 基本命令

### 编译相关

```bash
# 编译项目
forge build

# 清理编译缓存
forge clean

# 检查代码格式
forge fmt --check

# 格式化代码
forge fmt
```

### 测试相关

```bash
# 运行所有测试
forge test

# 运行特定测试文件
forge test --match-path test/Counter.t.sol

# 运行特定测试函数
forge test --match-test test_Increment

# 显示详细输出
forge test -vv

# 显示 gas 报告
forge test --gas-report

# 运行覆盖率测试
forge coverage
```

### 依赖管理

```bash
# 安装依赖
forge install OpenZeppelin/openzeppelin-contracts

# 更新依赖
forge update

# 移除依赖
forge remove openzeppelin-contracts
```

## 第一个测试合约

### 示例合约 (src/Counter.sol)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Counter {
    uint256 public number;

    function setNumber(uint256 newNumber) public {
        number = newNumber;
    }

    function increment() public {
        number++;
    }
}
```

### 测试合约 (test/Counter.t.sol)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test, console} from "forge-std/Test.sol";
import {Counter} from "../src/Counter.sol";

contract CounterTest is Test {
    Counter public counter;

    function setUp() public {
        counter = new Counter();
    }

    function test_Increment() public {
        counter.increment();
        assertEq(counter.number(), 1);
    }

    function testFuzz_SetNumber(uint256 x) public {
        counter.setNumber(x);
        assertEq(counter.number(), x);
    }
}
```

## 测试命名约定

Foundry 使用特定的命名约定来识别测试：

1. **测试函数**：必须以 `test` 开头
   - `test_BasicFunction()`
   - `testRevert_InvalidInput()`
   - `testFuzz_RandomInput(uint256 x)`

2. **测试文件**：通常以 `.t.sol` 结尾
   - `Counter.t.sol`
   - `Token.test.sol`

3. **测试合约**：通常以 `Test` 结尾
   - `CounterTest`
   - `TokenTest`

## 环境变量

创建 `.env` 文件来管理敏感信息：

```bash
# .env 文件
PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key
ALCHEMY_API_KEY=your_alchemy_api_key
```

在 foundry.toml 中引用：

```toml
[rpc_endpoints]
mainnet = "https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_API_KEY}"
```

## 常见问题

### 1. 编译错误

```bash
# 检查 Solidity 版本
forge --version

# 更新 foundry
foundryup

# 清理缓存
forge clean
```

### 2. 测试失败

```bash
# 增加详细输出
forge test -vvv

# 运行特定测试
forge test --match-test test_specific_function -vvv
```

### 3. 依赖问题

```bash
# 重新安装依赖
forge install

# 检查依赖版本
forge tree
```

## 下一步

现在你已经了解了 Foundry 的基础知识，接下来可以学习：

1. [编写测试用例](./02-writing-tests.md) - 学习如何编写有效的测试
2. [高级测试技巧](./03-advanced-testing.md) - 掌握模糊测试、不变量测试等
3. [调试和工具](./04-debugging-tools.md) - 学习调试技巧和工具使用
4. [最佳实践](./05-best-practices.md) - 了解测试的最佳实践

## 参考资源

- [Foundry Book](https://book.getfoundry.sh/) - 官方文档
- [Foundry GitHub](https://github.com/foundry-rs/foundry) - 源代码和问题跟踪
- [Forge Std](https://github.com/foundry-rs/forge-std) - 标准测试库


# 启动wsl
win键，然后terminal
wsl.exe-d Ubuntu

# 常用语句
```solidity
vm.assume(_caller != flaunch.owner());  模糊测试中的限定条件，不符合的直接跳过，这个语句中要求 caller不能是owner
amount = bound(amount, min, max); 也是模糊测试中，限制条件。要求amount的范围在 min，max直接

vm.prank(_caller);  prank 直接切换用户


事件监听模式
vm.expectEmit()        // 开始“监听期望”
emit ExpectedEvent(...)// 定义“我期望看到什么”  这是测试合约里的emit，表示期望被测合约发出这样的emit，自身并不会真的emit出来
call contract          // 真正触发事件
                       // Foundry 自动比对

```
无论加多少vvv，模糊测试中的log不打印


```
--mp  指定路径
--mt  匹配测试

```

# updraft
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
