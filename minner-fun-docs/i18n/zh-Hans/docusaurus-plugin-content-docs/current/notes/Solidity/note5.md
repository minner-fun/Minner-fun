### hardhat
```

npm install --save-dev hardhat
npm i hardhat@2.26.0  // 安装指定版本

npm install --save-dev @nomicfoundation/hardhat-toolbox // 这个才会安装对应的chai，ethers等依赖

npx hardhat init


在hardhat.config.js中导入插件包
require("@nomicfoundation/hardhat-toolbox");

```

替换行号
```
^\d{2} 
```

# zeeplin

```

npm instal --save-dev @openzeppelin/hardhat-upgrades

透明升级合约 boxv1 boxv2
npx hardhat run .\test\BoxV2.js --network localhost
```

5v1里
Owner  Roles

```shell
npm instal --save-dev @openzeppelin/contracts-upgradeable
npm install @openzeppelin/contracts-upgradeable @openzeppelin/contracts
```

### AccessControl
#### 1. 角色管理员的能力

在 OpenZeppelin 的 AccessControl 里：
每个 role（角色，类型是 bytes32）都有一个 管理员角色（roleAdmin）。
拥有 roleAdmin 的账户，可以：

>grantRole(role, account)：给任意地址授予该角色。
>revokeRole(role, account)：从任意地址收回该角色。

所以：
谁拥有某个角色的管理员角色，就能控制这个角色的分配和收回。
DEFAULT_ADMIN_ROLE，它充当所有角色的默认管理员角色。 具有此角色的帐户将能够管理任何其他角色，除非_setRoleAdmin使用 选择新的管理员角色。
#### 2. 被授予角色后的能力
一个地址一旦被 grantRole 成功，就拥有了该角色。
在合约代码里，凡是用 onlyRole(ROLE_X) 修饰的方法，该地址就可以调用。

例如：
```solidity
function specialThing() external onlyRole(ROLE_MANAGER) {
    // 只有 ROLE_MANAGER 的地址才能执行
}
```
#### 3. 特别说明
DEFAULT_ADMIN_ROLE：默认就是所有角色的管理员（除非用 _setRoleAdmin 修改）。所以一般部署时 _grantRole(DEFAULT_ADMIN_ROLE, deployer)，相当于让部署者是“超级管理员”。
角色的管理员角色本身也可以被修改：比如 _setRoleAdmin(ROLE_NORMAL, ROLE_MANAGER) 表示以后只有 ROLE_MANAGER 才能分发/收回 ROLE_NORMAL。
注意权限断层：如果不小心把一个角色的管理员设成某个没人持有的角色，这个角色就“失控”了——再也没人能 grant/revoke 它。

#### 一句话总结
角色管理员负责分配和回收角色。
角色持有者就能执行该角色被限定的操作。

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// https://docs.openzeppelin.com/contracts/5.x/api/access#AccessControl
import "@openzeppelin/contracts/access/AccessControl.sol";

contract Roles is AccessControl{
    bytes32 public constant ROLE_MANAGER = keccak256("ROLE_MANAGE");
    bytes32 public constant ROLE_NORMAL = keccak256("ROLE_NORMAL");


    // DEFAULT_ADMIN_ROLE 定义为常量 0x00（全零 bytes32），它是“万物之管理员”，默认是所有角色的管理员。
    // _msgSender() 来自 Context（AccessControl 继承了 Context），本质上就是 msg.sender 的封装（方便将来支持元交易/受信转发）。
    constructor(){
        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    // _setRoleAdmin(bytes32 role, bytes32 adminRole) 
    // 设置adminRole为role的管理员角色。
    function setRoleAdmin() external onlyRole(DEFAULT_ADMIN_ROLE){
        _setRoleAdmin(ROLE_NORMAL, ROLE_MANAGER);
    }

    function normalThing() external onlyRole(ROLE_NORMAL){
    }
    function specialThing() external onlyRole(ROLE_MANAGER){

    }
}
```