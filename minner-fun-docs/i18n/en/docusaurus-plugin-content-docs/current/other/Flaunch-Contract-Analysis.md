# Flaunch.sol Contract Overview

## 📋 Overall Contract Architecture

**Flaunch** is an ERC721 NFT contract where each NFT represents a proof of ownership for a Meme coin project. It brings together:
- **ERC721**: the holder owns the management rights to that Meme coin project
- **Cross-chain bridging**: supports bridging tokens between Superchain L2s
- **Factory pattern**: uses the Clone pattern to deploy Memecoin and Treasury contracts

---

## 🎯 Core Functional Modules

### 1️⃣ **Token Launch System (Flaunch)**

**Function:** `flaunch(PositionManager.FlaunchParams calldata _params)`

**Flow:**
1. ✅ **Parameter validation**
   - Check that the launch time does not exceed the maximum schedule duration (30 days)
   - Validate that the initial supply is within the allowed range
   - Check that the premine amount does not exceed the initial supply
   - Validate that the creator fee allocation does not exceed the maximum (100%)

2. 🎫 **Mint the ownership NFT**
   - Mint the ERC721 NFT to the creator (`_params.creator`)
   - Each NFT represents ownership of a Memecoin project

3. 💰 **Deploy the Memecoin contract**
   - Deploy the ERC20 Memecoin using `LibClone.cloneDeterministic`
   - Use `tokenId` as the salt to guarantee a deterministic address
   - Initialize the token metadata (name, symbol, tokenUri)

4. 🏦 **Deploy the MemecoinTreasury contract**
   - Deploy the treasury contract using the same salt
   - Used to manage the project's funds

5. 📦 **Mint the initial supply**
   - Mint `TokenSupply.INITIAL_SUPPLY` to the `PositionManager`
   - Used for the subsequent fair launch and liquidity provision

**Key code location:** `src/contracts/Flaunch.sol:146-192`

---

### 2️⃣ **Cross-chain Bridging System**

#### Initialize bridging: `initializeBridge(uint _tokenId, uint _chainId)`

**Functionality:**
- Validate that the destination chain is not the current chain
- Check that bridging has not already been completed
- Prevent re-triggering within the bridging window (1-hour window)
- Fetch the Memecoin metadata
- Send a cross-chain message via the `L2ToL2CrossDomainMessenger`

**Key code location:** `src/contracts/Flaunch.sol:334-387`

#### Finalize bridging: `finalizeBridge(uint _tokenId, MemecoinMetadata memory _metadata)`

**Functionality:**
- Validate the cross-domain message source (can only be triggered by a message sent by itself)
- Deploy the Memecoin on the destination chain using the same salt (tokenId)
- Initialize the metadata, keeping cross-chain addresses consistent
- Mark bridging as completed

**Key code location:** `src/contracts/Flaunch.sol:396-408`

**Cross-chain flow:**
```
L2-A chain: initializeBridge()
    ↓
L2ToL2CrossDomainMessenger.sendMessage()
    ↓
L2-B chain: finalizeBridge() (triggered automatically)
    ↓
Deploy the Memecoin at the same address
```

---

### 3️⃣ **Access Control and Metadata**

#### `setMemecoinMetadata(address _memecoin, string calldata name_, string calldata symbol_)`
- Allows the contract owner to fix improper metadata (malicious content, formatting errors, etc.)

#### `setBaseURI(string memory _baseURI)`
- Updates the base URI of the ERC721 NFT

#### `setMemecoinImplementation(address _memecoinImplementation)`
- Upgrades the Memecoin implementation contract address

#### `setMemecoinTreasuryImplementation(address _memecoinTreasuryImplementation)`
- Upgrades the MemecoinTreasury implementation contract address

**Key code location:** `src/contracts/Flaunch.sol:203-239`

---

### 4️⃣ **Query Interface**

#### `memecoin(uint _tokenId) → address`
- Returns the corresponding Memecoin address for a given NFT tokenId

#### `memecoinTreasury(uint _tokenId) → address payable`
- Returns the corresponding MemecoinTreasury address for a given NFT tokenId

#### `poolId(uint _tokenId) → PoolId`
- Returns the corresponding Uniswap V4 PoolId for a given NFT tokenId

#### `tokenURI(uint _tokenId) → string`
- Returns the NFT's metadata URI
- If the baseURI is empty, returns the Memecoin's tokenURI
- Otherwise returns `baseURI + tokenId`

**Key code location:** `src/contracts/Flaunch.sol:283-307`

---

## 🔐 Security Mechanisms

### Access Control

#### `onlyPositionManager` modifier
- Only the `PositionManager` contract can call the `flaunch()` function
- Prevents unauthorized token launches

#### `onlyCrossDomainCallback` modifier
- Verifies that the message sender must be the `L2ToL2CrossDomainMessenger`
- Verifies that the cross-domain message source must be the contract itself
- Prevents malicious cross-chain calls

**Key code location:** `src/contracts/Flaunch.sol:413-428`

### Parameter Limits

```solidity
uint public constant MAX_FAIR_LAUNCH_TOKENS = TokenSupply.INITIAL_SUPPLY;
uint public constant MAX_CREATOR_ALLOCATION = 100_00;  // 100%
uint public constant MAX_SCHEDULE_DURATION = 30 days;
uint public constant MAX_BRIDGING_WINDOW = 1 hours;
```

---

## 🔄 Key Design Patterns

### 1. **Deterministic Deployment**
- Uses `LibClone.cloneDeterministic` + `tokenId` as the salt
- Guarantees the same address across cross-chain deployments
- Facilitates cross-chain state synchronization

### 2. **Proxy Pattern (Clone Pattern)**
- Every Memecoin and Treasury is a minimal proxy
- Dramatically reduces deployment cost
- Makes unified upgrades easy

### 3. **Ownership NFT Pattern**
- Holding the ERC721 NFT = owning control of the Memecoin project
- Ownership can be transferred
- Facilitates governance and revenue distribution

### 4. **Retry Mechanism**
- After a bridging failure, it can be retried once the 1-hour window has elapsed
- Prevents a permanently locked state

---

## 📊 Data Flow Summary

```
User → PositionManager.flaunch()
    ↓
Flaunch.flaunch()
    ├─ Mint the ERC721 NFT
    ├─ Deploy the Memecoin (ERC20)
    ├─ Deploy the MemecoinTreasury
    └─ Mint the initial supply to the PositionManager
    
ERC721 holder → initializeBridge()
    ↓
L2ToL2Messenger
    ↓
Destination chain finalizeBridge()
    └─ Deploy the Memecoin at the same address
```

---

## 📝 Important Events

- `TokenBridging(uint _tokenId, uint _chainId, address _memecoin)` - bridging started
- `TokenBridged(uint _tokenId, uint _chainId, address _memecoin, uint _messageSource)` - bridging completed
- `BaseURIUpdated(string _newBaseURI)` - base URI updated
- `MemecoinImplementationUpdated(address _newImplementation)` - implementation address updated
- `MemecoinTreasuryImplementationUpdated(address _newImplementation)` - treasury implementation address updated

---

## 🔗 Related Contracts

- **PositionManager**: calls `flaunch()` to create a new token
- **Memecoin**: the ERC20 token implementation
- **MemecoinTreasury**: the treasury contract implementation
- **L2ToL2CrossDomainMessenger**: Optimism cross-chain message passing

---

## 💡 Design Highlights

1. **Cross-chain consistency**: deterministic deployment guarantees identical addresses across chains
2. **Cost optimization**: the Clone pattern dramatically reduces deployment costs
3. **Flexible governance**: NFT ownership enables transfer of project control
4. **Secure and reliable**: multiple validation mechanisms prevent malicious operations
