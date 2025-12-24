### 常用命令
```
npx hardhat init
npx hardhat --version
npm install --save-dev hardhat
npm i hardhat@2.26.0  // 安装指定版本
npm install --save-dev @nomicfoundation/hardhat-toolbox // 这个才会安装对应的chai，ethers等依赖

npm list ethers // 查看包信息

npx hardhat compile
npx hardhat test  

// 启动节点
npx hardhat node
npx hardhat node --hostname 127.0.0.1 --port 8545
```

### 配置文件
```
在hardhat.config.js中导入插件包
require("@nomicfoundation/hardhat-toolbox");
```


