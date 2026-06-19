# 模糊测试模板

使用 Foundry 对智能合约进行模糊测试的实用模板。

## 概述

模糊测试（或基于属性的测试）会自动生成随机输入，以针对不变量测试您的合约。

## 项目结构

```
fuzzing-template/
├── src/
│   ├── Token.sol
│   └── Vault.sol
├── test/
│   ├── Token.t.sol
│   ├── TokenFuzz.t.sol
│   └── VaultInvariant.t.sol
└── foundry.toml
```

## 配置

### foundry.toml

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]

[fuzz]
runs = 1000
max_test_rejects = 100000

[invariant]
runs = 256
depth = 15
fail_on_revert = true
```

## 模糊测试

### 基础模糊测试

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/Token.sol";

contract TokenFuzzTest is Test {
    Token token;
    
    function setUp() public {
        token = new Token("Test", "TST", 1000000);
    }
    
    /// forge-config: default.fuzz.runs = 10000
    function testFuzzTransfer(address to, uint256 amount) public {
        // 假设有效输入
        vm.assume(to != address(0));
        vm.assume(to != address(this));
        vm.assume(amount <= token.balanceOf(address(this)));
        
        uint256 balanceBefore = token.balanceOf(address(this));
        
        token.transfer(to, amount);
        
        // 不变量
        assertEq(
            token.balanceOf(address(this)),
            balanceBefore - amount
        );
        assertEq(token.balanceOf(to), amount);
    }
}
```

### 不变量测试

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/Vault.sol";

contract VaultHandler is Test {
    Vault public vault;
    address[] public actors;
    
    constructor(Vault _vault) {
        vault = _vault;
    }
    
    function deposit(uint256 actorIndex, uint256 amount) public {
        actorIndex = bound(actorIndex, 0, actors.length - 1);
        amount = bound(amount, 0, 1000 ether);
        
        address actor = actors[actorIndex];
        vm.deal(actor, amount);
        
        vm.prank(actor);
        vault.deposit{value: amount}();
    }
    
    function withdraw(uint256 actorIndex, uint256 amount) public {
        actorIndex = bound(actorIndex, 0, actors.length - 1);
        address actor = actors[actorIndex];
        
        uint256 balance = vault.balanceOf(actor);
        amount = bound(amount, 0, balance);
        
        vm.prank(actor);
        vault.withdraw(amount);
    }
}

contract VaultInvariantTest is Test {
    Vault vault;
    VaultHandler handler;
    
    function setUp() public {
        vault = new Vault();
        handler = new VaultHandler(vault);
        
        // 添加参与者
        handler.actors().push(address(0x1));
        handler.actors().push(address(0x2));
        handler.actors().push(address(0x3));
        
        // 将处理器设为不变量测试的目标
        targetContract(address(handler));
    }
    
    /// forge-config: default.invariant.runs = 256
    /// forge-config: default.invariant.depth = 15
    function invariant_totalSupplyEqualsBalance() public {
        assertEq(
            vault.totalSupply(),
            address(vault).balance
        );
    }
    
    function invariant_userBalancesLessThanTotal() public {
        for (uint i = 0; i < handler.actors().length; i++) {
            address actor = handler.actors(i);
            assertLe(
                vault.balanceOf(actor),
                vault.totalSupply()
            );
        }
    }
}
```

## 最佳实践

### 1. 使用 `bound()` 进行范围约束

```solidity
function testFuzz(uint256 x) public {
    x = bound(x, 1, 100); // 约束到 [1, 100]
    // ...
}
```

### 2. 使用 `vm.assume()` 设置前提条件

```solidity
function testFuzz(address user) public {
    vm.assume(user != address(0));
    vm.assume(user.code.length == 0);
    // ...
}
```

### 3. 创建处理器合约

处理器合约包装您的协议，并为不变量测试提供有界的随机操作。

### 4. 定义清晰的不变量

好的不变量：
- 总供应量等于余额总和
- 合约余额大于等于总存款
- 用户余额小于等于总供应量

### 5. 使用幽灵变量

在处理器中跟踪额外状态：

```solidity
contract Handler {
    uint256 public ghost_depositSum;
    uint256 public ghost_withdrawSum;
    
    function deposit(uint256 amount) public {
        // ...
        ghost_depositSum += amount;
    }
}
```

## 运行模糊测试

```bash
# 运行模糊测试
forge test --match-contract Fuzz

# 运行不变量测试
forge test --match-contract Invariant

# 详细输出
forge test --match-contract Invariant -vvvv

# 带 Gas 报告
forge test --match-contract Fuzz --gas-report
```

## 解释结果

### 成功
```
Test result: ok. 1000 passed
```

### 失败
```
Failing test:
  testFuzzTransfer(address,uint256)
  
Counterexample:
  to=0x0000000000000000000000000000000000000000
  amount=1
```

## 高级技术

### 基于字典的模糊测试

```solidity
address[] public dictionary = [
    address(0),
    address(this),
    address(token)
];

function testFuzz(uint256 index) public {
    address target = dictionary[bound(index, 0, dictionary.length - 1)];
    // ...
}
```

### 有状态模糊测试

在模糊测试运行之间保持状态以测试复杂场景。

## 资源

- [Foundry 模糊测试指南](https://book.getfoundry.sh/forge/fuzz-testing)
- [不变量测试](https://book.getfoundry.sh/forge/invariant-testing)
- [Trail of Bits 测试指南](https://secure-contracts.com/)

