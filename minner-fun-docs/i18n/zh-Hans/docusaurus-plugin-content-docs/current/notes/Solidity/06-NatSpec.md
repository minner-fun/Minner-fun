# NatSpec

## 🧩 一、什么是 NatSpec？
官方文档：https://docs.soliditylang.org/zh-cn/v0.8.24/natspec-format.html#natspec   

`NatSpec`（*Ethereum Natural Specification Format*）是 Solidity 官方支持的**文档注释标准**。
它主要有两个用途：

1. **生成合约文档（docgen）** — 用于开发者或用户阅读；
2. **与钱包交互** — 当用户在 MetaMask 等钱包签署交易时，提示函数说明、参数意义。

---

## 🧰 二、文档生成方式

### ✅ 方法 1：用 `solc` 命令行导出

如果你安装了 `solc`（Solidity 官方编译器），可以直接执行：

```bash
solc --userdoc --devdoc MyContract.sol
```

它会输出两种 JSON 文档：

* `userdoc`：包含 `@title`、`@notice` 等用户可读说明；
* `devdoc`：包含 `@dev`、`@param`、`@return` 等开发者说明。

---

#### 🔍 示例

假设你写了：

```solidity
/// @title 资金转账合约
/// @notice 用户可以通过 safeTransferETH 安全转账 ETH
contract MyVault {
    /// @notice 安全转账 ETH
    /// @dev 使用 call 而非 transfer，防止 2300 gas 限制问题
    /// @param to 接收方地址
    /// @param value 转账金额（单位：wei）
    function safeTransferETH(address to, uint256 value) external {
        (bool success, ) = to.call{value: value}("");
        require(success, "ETH transfer failed");
    }
}
```

执行：

```bash
solc --userdoc --devdoc MyVault.sol
```

会得到：

```json
{
  "userdoc": {
    "kind": "user",
    "methods": {
      "safeTransferETH(address,uint256)": {
        "notice": "安全转账 ETH"
      }
    },
    "version": 1
  },
  "devdoc": {
    "kind": "dev",
    "methods": {
      "safeTransferETH(address,uint256)": {
        "params": {
          "to": "接收方地址",
          "value": "转账金额（单位：wei）"
        },
        "details": "使用 call 而非 transfer，防止 2300 gas 限制问题"
      }
    },
    "title": "资金转账合约",
    "version": 1
  }
}
```

---

### ✅ 方法 2：用 Foundry 或 Hardhat 的插件导出

#### **在 Foundry 项目中**

Foundry 自带支持 docgen：

```bash
forge doc
```

它会自动扫描所有 `///` 注释，生成 Markdown 或 HTML 文档。

#### **在 Hardhat 项目中**

可以使用社区插件：

```bash
npm install --save-dev hardhat-docgen
```

配置 `hardhat.config.js`：

```js
require("hardhat-docgen");

module.exports = {
  docgen: {
    path: './docs',
    clear: true,
    runOnCompile: true,
  },
};
```

然后运行：

```bash
npx hardhat docgen
```

会自动生成 `/docs` 文件夹，包含 HTML/Markdown 格式的合约文档。

---

## 🧾 三、NatSpec 常用标签对照表

| 标签         | 作用                          | 使用对象  |
| ---------- | --------------------------- | ----- |
| `@title`   | 合约标题                        | 合约    |
| `@author`  | 作者                          | 合约    |
| `@notice`  | 给普通用户看的描述                   | 函数/合约 |
| `@dev`     | 给开发者看的说明                    | 函数/合约 |
| `@param`   | 参数说明                        | 函数    |
| `@return`  | 返回值说明                       | 函数    |
| `@custom:` | 自定义标签（如 `@custom:security`） | 任意    |

---

## 🧠 四、总结

✅ **可以导出**

* Solidity 自带的 `solc` 就能直接输出 JSON 格式文档；
* Foundry (`forge doc`) 或 Hardhat (`hardhat-docgen`) 可以生成更友好的 Markdown/HTML 文档。

📘 **推荐写法**

```solidity
/// @notice 用户存入 ETH
/// @dev 调用 payable 函数存入合约
/// @param amount 存入金额
/// @return balance 当前合约余额
```

---

要不要我帮你示范一下怎么在 **Foundry 项目** 里一步步配置 `forge doc` 自动生成 Markdown 文档？
我可以给出一个最小可运行的例子（含 `foundry.toml` 配置和输出效果）。
