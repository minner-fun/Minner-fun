
# updraft

## Other cast commands
### Convert hexadecimal
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
[Official docs](https://www.getfoundry.sh/reference/cast/wallet) — there are also a few commands related to mnemonics, as well as commands for signing.
The encrypted data lives in the `.foundry/keystores` folder under your home directory.

### Create an address
```shell
cast wallet new or n
cast wallet n
```

### Import an account
```shell
cast wallet import or i
cast wallet import xxxx-name --private-key xxxxxxxx-key  pass the private key in plaintext directly
cast wallet i xxxx-name --interactive  enter the private key interactively
```
Best practice:
```shell
Open a new terminal
cast wallet i xxxx-name --interactive  enter the private key interactively
then
history -c
close the terminal
```


### Remove
To remove an account you must pass `--name`
```shell
cast wallet remove or rm
cast wallet remove --name anvil-02
```
### List
```shell
cast wallet list or ls  list the saved account aliases
cast wallet ls
```
### Look up the public key by alias
```shell
cast wallet address or a or addr
cast wallet address --account anvil-01
```
### Look up the private key by alias
```shell
cast wallet decrypt-keystore or dk
cast wallet decrypt-keystore anvil-01
```

## env
In the `.env` file there must be no spaces around the `=`.
```shell
source .env  
echo $PRIVATE_KEY
```
`.env` template
```shell
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/xxxxx
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/xxxxxx
ARBITRUM_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/xxxxxxx
ANVIL_RPC_URL=http://127.0.0.1:8545
ANVIL_PRIVATE_KEY=xxxxxxxxxxxxxxxxxxxx
```

## makeFile

## foundry.toml file


## forge test
forge test --mt testPriceFeedVersionIsAccurate

### Understanding the cheatcodes
```solidity
assertEq (fundMe.i_owner ( ), address ( this ));  // assert equality

hoax = deal + prank  add ETH directly + switch msg.sender

address alice = makeAddr("alice"); create the user alice
vm.deal(alice, BALANCE) give alice some funds
vm.prank(alice) the next line is executed as alice

vm.startPrank(alice)
...all lines in between are executed as alice
vm.stopPrank()


vm.startBroadcast();  // marks the code in between as transactions to be sent; a transaction is any action that modifies on-chain state
HelperConfig helperConfig = new HelperConfig();
FundMe fundMe = new FundMe(helperConfig.activeNetworkConfig());
vm.stopBroadcast();


vm.warp(block.timestamp + interval + 1); // change the timestamp
vm.roll(block.number + 1);    // increment the block number by one


vm.txGasPrice(GAS_PRICE); a Foundry cheatcode used to change tx.gasprice

vm.envBytes32() read a bytes32 value from an environment variable
vm.envUint() read a uint256 value from an environment variable
```

### Testing whether an event is emitted
First re-declare the event in the test file, then:
```solidity
function testEmitsEventOnEntrance() public {
    vm.prank(alice);
    // the event we expect to be emitted
    vm.expectEmit(true, false, false, false, address(raffle));
    // emit it ourselves once in the test file
    emit EnteredRaffle(alice);
    // call the actual code
    raffle.enterRaffle{value: 0.5 ether}();
}
```

### Testing event parameters
```solidity
vm.recordLogs();  // start recording
raffle.performUpkeep("");  // trigger
Vm.Log[] memory entries = vm.getRecordedLogs(); // get the recorded logs
bytes32 requestId = entries[1].topics[1];  // extract the target data

```

### Testing custom errors
You need the selector of the custom error, ABI-encode it together with the revert arguments to define exactly the expected revert, and then trigger the call.
```solidity
vm.expectRevert(); // just expects a revert; passes as long as something reverts, regardless of the error name or type

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

### Fuzz testing
If a Foundry test method takes parameters, it becomes a fuzz test, and Foundry automatically supplies random values for those parameters.
Fuzz tests use `bound` to constrain the range of a parameter.
```solidity
uint256 additionalEntrants = bound(additionalEntrantsNum, 1, 10000);
```


### Test coverage
```shell
the --report xxx flag takes an option; debug is also viewable, while summary is essentially the same as plain forge coverage

forge coverage --fork-url $SEPOLIA_RPC_URL 
forge coverage --report debug > coverage.txt
```


### What the number of -v's means
```
Verbosity levels:
- 2: Print logs for all tests
- 3: Print execution traces for failing tests
- 4: Print execution traces for all tests, and setup traces for failing tests
- 5: Print execution and setup traces for all tests
```

### Types of tests
Unit tests: focus on isolating and testing individual functions or features of a smart contract.
Integration tests: verify how a smart contract interacts with other contracts or external systems.
Forking tests: a fork is a copy of blockchain state at a specific point in time. This copy (called a fork) is then used to run tests in a simulated environment.
Staging tests: run tests against an already-deployed smart contract in a staging environment before deploying to mainnet.



## Installing dependencies
The GitHub repo is https://github.com/smartcontractkit/chainlink-brownie-contracts
Install command: forge install smartcontractkit/chainlink-brownie-contracts@0.6.1

Install address for Chainlink VRF 2.5: forge install /smartcontractkit/chainlink-brownie-contracts
Project link: https://github.com/smartcontractkit/chainlink-brownie-contracts


## About gas
Check gas prices: https://etherscan.io/gastracker
Conversion tool: https://www.alchemy.com/gwei-calculator
Prices: https://coinmarketcap.com/
```shell
forge snapshot --mt testOwnerIsMsgSender
```
Gas consumption
```solidity
gasleft() a Solidity function that returns the remaining gas
tx.gasprice; a Solidity property holding the gas price of the current transaction

vm.txGasPrice(GAS_PRICE); a Foundry cheatcode used to change tx.gasprice

```
Gas consumption issue: declaring an array and then reassigning it to a fresh array actually consumes a lot of gas, growing with the number of elements. Instead, use a mapping combined with a counter: store the addresses in the mapping and count them with the counter; when you need to clear it, just set the counter back to 0 and start overwriting from the beginning.
```solidity
address payable[] s_players
s_players = new address payable[](0)

mapping(uint256 => address payable) s_players;
uint256 s_players = 0;
```

Measuring the gas consumed by a single call
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
## Analyzing gas through storage
Lesson 21 of FundMe explains how to save gas from the perspective of the storage layout.

vm.load();  load storage data
forge inspect FundMe storageLayout  inspect the storage layout
cast storage 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 2  inspect storage by contract address


## Miscellaneous

forge init   initialize a project
forge init --force

forge fmt  format the code; switch from auto-save to a deliberate save (e.g. cursor-move triggered), without auto-save, and format manually with forge fmt

anvil  start a local virtual environment
Deployment: it currently seems you need --broadcast, which means to broadcast and perform the actual deployment; without it, the deployment is only simulated
```bash
$ forge create SimpleStorage --private-key ac0974bec39a17e36ba4a6b4d238fcbed5efcae784d7bf4f2ff80 --rpc-url http://127.0.0.1:8545 --broadcast
```
Without a private key, you need to know the unlocked and from addresses
```bash
$ forge create SimpleStorage --unlocked --from 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --rpc-url http://127.0.0.1:8545 --broadcast
```

Deploy via a script
forge script script/SimpleStorage.s.sol --private-key ac0974bec39a17e3478cbed5efcae784d7bf4f2ff80 --rpc-url http://127.0.0.1:8545 --broadcast

forge create SimpleStorage --interactive  enter the private key interactively
Without --rpc-url, the Anvil network is used by default

Foundry best practices: https://www.getfoundry.sh/best-practices#scripts
forge-std, the Forge Standard Library, is designed to simplify and enhance scripting and testing within the Foundry development framework

Regarding scripts: running a script populates the broadcast folder, which holds the execution records.
Every script must inherit Script and implement a run method with external visibility.
Scripts all end with .s.sol


forge script script/SimpleStorage.s.sol --rpc-url $RPC_KEY --broadcast --account minner-key --sender 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266


Deploy
forge script script/SimpleStorage.s.sol --rpc-url $RPC_URL_SEPOLIA --broadcast --account sepolia-01 --with-gas-price 2gwei -vvvv

forge script script/DeployFundMe.s.sol:DeployFundMe --rpc-url $(SEPOLIA_RPC_URL) --private-key $(PRIVATE_KEY) --broadcast --verify --etherscan-api-key $(ETHERSCAN_API_KEY) -vvvv

When deploying a contract, if you call new xx() directly inside a test contract, then msg.sender is the test contract. If you use vm.startBroadcast(), msg.sender becomes the address of our default external account. This address has nothing to do with the Anvil chain; it is a built-in account used during testing.



uint160 can be cast directly to the address type, but uint256 cannot.


chisel is an interactive environment.



Deploy
```bash
$ forge script DeployFundMe --rpc-url $ANVIL_RPC_URL --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --broadcast
```

Monad contract verification
```bash
forge verify-contract \
  --rpc-url https://testnet-rpc.monad.xyz \
  --verifier sourcify \
  --verifier-url 'https://sourcify-api-monad.blockvision.org/' \
  0xdE3651Ada44138305Af580E2627d343D6C66d0Eb \
  src/FundMe.sol:FundMe
```


forge install Cyfrin/foundry-devops  install the package


## Code style
### NATSPEC comments
Official docs: https://docs.soliditylang.org/zh-cn/v0.8.24/natspec-format.html#natspec

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

### Order of code layout
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

### Variable naming conventions
Prefix state variables with s_
Prefix immutable variables with i_
Prefix custom errors with the contract name: error Raffle_NotEnoughEthSend();

Events are not used arbitrarily; emit them when state variables change.

### CEI pattern: Checks first, then Effects, and finally Interactions
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

--fork-url  fork the relevant state of a chain locally to run tests against
--rpc-url   specify which chain to act on; only valid when deploying (works for script, not for test)

--broadcast  broadcast, i.e. send the transactions on-chain; without it, running a script only simulates execution


A library that provides ERC20.
```
forge install transmissions11/solmate --no-commit
@solmate/=lib/solmate/src
```

Make git ignore a submodule
git config submodule.lib/chainlink-brownie-contracts.ignore all

forge install Cyfrin/foundry-devops --no-commit

-f force-uninstall a package 
forge remove smartcontractkit/chainlink-brownie-contracts -f

After cloning a fresh repo from GitHub, use this command to initialize and install the dependencies
git submodule update --init --recursive



After installing a library and then repeatedly uninstalling and reinstalling it back and forth
```shell
git submodule deinit -f -- lib/openzeppelin-contracts-upgradeable
git rm -f lib/openzeppelin-contracts-upgradeable
rm -rf .git/modules/lib/openzeppelin-contracts-upgradeable
rm -rf lib/openzeppelin-contracts-upgradeable
forge install OpenZeppelin/openzeppelin-contracts-upgradeable@release-v4.9  # pin the release-v4.9 branch
forge build
```

MLaunch
The onlyOwner / initializer question
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
The three abstract methods of ERC-721 — what does baseURI mean?
