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
