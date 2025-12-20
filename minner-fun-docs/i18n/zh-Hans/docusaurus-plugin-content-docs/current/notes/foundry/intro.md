# Foundry 介绍

Foundry 是一个用 Rust 编写的快速、便携和模块化的以太坊应用开发工具包。

## 什么是 Foundry？

Foundry 包含以下工具：

- **Forge**: 以太坊测试框架（类似于 Truffle、Hardhat 和 DappTools）
- **Cast**: 与 EVM 智能合约交互、发送交易和获取链数据的瑞士军刀
- **Anvil**: 本地以太坊节点，类似于 Ganache、Hardhat Network
- **Chisel**: 快速、实用且详细的 Solidity REPL

## 为什么选择 Foundry？

### 速度
Foundry 用 Rust 编写，运行测试的速度明显快于基于 JavaScript 的框架。

### 用 Solidity 测试
用 Solidity 而不是 JavaScript 编写测试。这样可以：
- 用相同的语言测试合约
- 获得更好的类型安全
- 避免在语言之间切换上下文

### 高级功能
- 模糊测试（Fuzzing）
- 符号执行
- Gas 快照
- 覆盖率报告

## 安装

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

## 快速开始

创建新项目：

```bash
forge init my-project
cd my-project
forge build
forge test
```

## 资源

- [官方文档](https://book.getfoundry.sh/)
- [GitHub 仓库](https://github.com/foundry-rs/foundry)
- [社区 Discord](https://discord.gg/foundry)

