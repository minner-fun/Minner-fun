In `Currency`, the zero address represents the chain's native token, while a non-zero address is an ERC-20 token.

The `Currency` type unifies operations such as transfers and balance queries across native tokens and ERC-20 tokens. Externally everything uses `Currency`, and internally `Currency` checks the token type and dispatches to the corresponding transfer, balance-query, etc. methods. A typical use is within the `PoolKey` struct.
All transfers are implemented in assembly; it's worth studying how the transfer method is used. One open question: when creating a token pool, how is ETH turned into a `Currency`?


`PoolKey`: a human-friendly struct that defines the uniqueness of a trading pair. The token pair, plus the fee, plus the price-movement granularity, plus the user-defined hook logic — these 5 elements together identify a liquidity pool uniquely.
`PoolId`: machine-friendly; the result of taking the keccak256 hash of the `PoolKey`. It is a bytes32 value and, in Uniswap v4, serves as the primary key for querying a particular liquidity pool.
```solidity
struct PoolKey {
    /// @notice The lower currency of the pool, sorted numerically
    Currency currency0;
    /// @notice The higher currency of the pool, sorted numerically
    Currency currency1;
    /// @notice The pool LP fee
    uint24 fee;          // in units of 1/1,000,000; 3000 means 0.3%  3000/1,000,000 = 3/1,000 = 3 per mille = 0.3 percent
    /// @notice The tick spacing for the pool
    int24 tickSpacing;     // fee tier and tick spacing are paired; 0.3% maps to 60
    /// @notice The hooks contract for the pool
    IHooks hooks;          // defaults to address(0) 
}
```
User Defined Value Types (UDVTs)
UDVTs — user-defined value types
```solidity
type Currency is address;
type PoolId is bytes32;
```
Two methods:
```solidity
unwrap() converts a user-defined type back to its underlying type
wrap() converts an underlying type into the user-defined type
```
When logging, you must first convert the user-defined type back to its underlying type before it can be output in the log
```solidity

// To log it, we must convert it back to bytes32
bytes32 i = PoolId.unwrap(id);
console.logBytes32(i);   // convert to the underlying type and print
​
// To convert a bytes32 back to a PoolId, we use wrap()
PoolId p = PoolId.wrap(i);  // convert back to the user-defined type for further logic
```
To look up a `PoolKey` from a `PoolId`, you can query the tables on Dune
```sql
select * from uniswap_v4_ethereum.poolmanager_evt_initialize where id = 0x3ea74c37fbb79dfcd6d760870f0f4e00cf4c3960b3259d0d43f211c0547394c1
```



The swap flow: you must first call `unlock`, which then calls back into your contract's `unlockCallback` method. So only a contract can call `unlock`, and that contract must implement `unlockCallback` — i.e. it must implement the `IUnlockCallback` interface. This process relies on two techniques: transient storage and the settlement check.

In other words, to call `unlock` on `PoolManager.sol`, you must be a contract that implements `unlockCallback`.


`lock` and `unlock` place state into transient storage.

Transient vs. state storage — two main differences: 1) Lifetime: transient storage lives only within a single transaction, whereas state storage is persisted permanently on-chain. This leads to 2) Gas cost: transient consumes less, state consumes more.
Two typical uses of transient storage: re-entrancy locks. The data is only useful within a single call cycle, and once the call ends the data is no longer needed — a perfect fit for transient storage. Using state storage would instead require you to actively clear it and would cost more gas, with no upside. The other use is passing context parameters to share data across multiple external calls. The `sync` method in the PM contract and the ERC-20 branch of the `_settle` method both use methods from `CurrencyReserves.sol` to pass data along.
Introduced in EIP-1153; available in solidity >= 0.8.24.
```solidity
tstore(slot, value) stores the value at the given slot. slot is a bytes32 value.
tload(slot)
```

Checking `NonzeroDeltaCount` to perform the settlement check
`NonzeroDeltaCount`, as the name suggests, is the count of non-zero deltas. A delta typically represents an amount of change. So here it represents the number of unsettled bills. It only tracks the count.
```solidity
(int256 previous, int256 next) = currency.applyDelta(target, delta);
// previous: the original value; if the original value was 0, it means a new bill was added, so NonzeroDeltaCount must be incremented
// next: the value after applyDelta; if it is 0, a bill was settled, so the count must be decremented
```

The sign of the `delta` parameter in `_accountDelta` is judged from the PoolManager's perspective: negative means the user owes. It indicates the user has already withdrawn tokens from the PoolManager, or has claimed they will pay but hasn't yet. So overall, a negative value means the user will subsequently owe the PM money — the user owes the PM. Positive means the user is owed. It indicates tokens have already been sent to the PoolManager, or the user has claimed they will withdraw from the PM but hasn't yet; overall, positive means the user can subsequently take money from the PM — the PM owes the user.
```solidity
function _accountDelta(Currency currency, int128 delta, address target) internal {
    if (delta == 0) return;
    // the applyDelta method is in /library/CurrencyDelta.sol
    // applyDelta's logic is simple: it takes previous out of transient storage, adds delta to it (delta is signed), and produces next
    (int256 previous, int256 next) = currency.applyDelta(target, delta); // this is just an addition
    if (next == 0) {
        NonzeroDeltaCount.decrement();
    } else if (previous == 0) {
        NonzeroDeltaCount.increment();
    }
}
```
Suppose you take 100; `NonzeroDeltaCount` becomes 1. Then you settle 90: transient storage previous = -100, delta = 90, and adding gives -10. Your debt is not fully repaid, so `NonzeroDeltaCount` stays unchanged — still 1.


"Sync Before Settle" workflow: before calling `settle` to pay, you must call `sync` to snapshot the previous balance into a transient storage slot. The `settle` method then reads the previously stored value, diffs it against the current value, and computes how much was added.

The swap flow
```
the router contract calls the PM's unlock

unlock calls back into the router's unlockCallback

inside unlockCallback, execute swap, take, sync(), settle()

finally, unlockCallback returns
unlock then checks whether NonzeroDeltaCount is 0
```
Key point: `sync` must be called before `settle`, because the pre-transfer balance must be stashed first so it can later be read back and used.
Key point: since `take` and `settle` have no required ordering, you can call `take` directly, grab some funds, go do anything with them, and then call `sync` and `settle` to return the funds — without ever calling `swap`. As long as `NonzeroDeltaCount` is 0, the `unlock` check passes and it's done. This is how a fee-free flash loan is implemented.

Flash loan vs. swap: a flash loan simply takes, then settles the corresponding amount; the amount taken depends on how much the user wants to loan. A swap adds an extra computation step — it's essentially "loan A but settle B".


`BalanceDelta` is an int256 split in two: the high 128 bits store the delta of amount0, the low 128 bits store the delta of amount1, using a bit-packing technique. balanceDelta := or(shl(128, _amount0), and(sub(shl(128, 1), 1), _amount1))

Unpacking: shift amount0 right by 128 bits, directly using the assembly opcode sar (Arithmetic Shift Right): _amount0 := sar(128, balanceDelta); for amount1, _amount1 := signextend(15, balanceDelta), which means taking the lower 15*8+7 bits.

Reading state-storage data
```
v4-core\src\Extsload.sol  # the lowest-level library method
        src\libraries\StateLibrary.sol  # wraps Extsload.sol so contracts can use it
v4-periphery/src/lens/StateView.sol     # best to call this in day-to-day use; this is the recommended practice
```
Reading transient storage
```
v4-core\src\Exttload.sol  # the low-level method
        src\libraries\TransientStateLibrary.sol  # use this to understand balance changes
v4-periphery/src/base/DeltaResolver.sol 
```



 The hook call before adding liquidity
For liquidity-related calculations, refer to this library: D:\qifumin\flaunchgg-contracts\lib\v4-core\test\utils\LiquidityAmounts.sol
Given tokens and a lower/upper tick range, compute the liquidity that can be added
Given liquidity and a lower/upper range, compute how many tokens you need to provide


Conversion tool between tick and sqrtPriceX96: D:\qifumin\cyfrin\SafeLaunch\lib\v4-core\src\libraries\TickMath.sol
Query all available ticks
Compute the tick from a price
Compute the price from a tick


A hook contract's permissions are encoded into the last few bits of the hook contract's address via create2, so you need to find a suitable salt that makes the contract address express exactly which hook functions are enabled.

To reach the original transaction-sending address inside a hook: define a `getMsgSender` method in the router, have the PoolManager pass the router as the `sender` argument to the hook contract's methods, and then have the hook call back into the router's `getMsgSender` method. That way you obtain
the original external caller address.

The call relationship from the hook's perspective: the hook contract declares permissions -> find a salt and deploy via create2 -> create the pool, carrying the hook address in the PoolKey -> the `initialize` method in the PM contract checks the hook address's validity -> `swap`, `modifyLiquidity`, etc. in the PM enter the specific hook methods -> first enter the specific hook method in the Hooks library -> finally enter the method implemented by IHooks, i.e. the method on the concrete external hook contract.

In Hooks.sol, the IHooks methods are extended. In the PoolManager, you first enter the IHooks-extended methods in Hooks, and before calling the external hook contract's methods, `hasPermission` is checked again to determine whether the corresponding method is enabled.
```solidity
using Hooks for IHooks; 
```

Hook contract permission best practice: perform a self-check in the constructor
```solidity
    constructor(address _poolManager) {
        poolManager = IPoolManager(_poolManager);
        Hooks.validateHookPermissions(address(this), getHookPermissions());
    }

    function getHookPermissions()
        public
        pure
        returns (Hooks.Permissions memory)
    {
        return Hooks.Permissions({
            beforeInitialize: false,
            afterInitialize: false,
            beforeAddLiquidity: true,
            afterAddLiquidity: false,
            beforeRemoveLiquidity: true,
            afterRemoveLiquidity: false,
            beforeSwap: true,
            afterSwap: true,
            beforeDonate: false,
            afterDonate: false,
            beforeSwapReturnDelta: false,
            afterSwapReturnDelta: false,
            afterAddLiquidityReturnDelta: false,
            afterRemoveLiquidityReturnDelta: false
        });
    }
```


Market order: fills immediately, but carries the risk of price movement and slippage
Limit order: a specified price, but is not guaranteed to fill

A limit order provides liquidity on the smallest-unit tick, and after the trade completes, the liquidity is withdrawn via a hook. v3 can also do this, but v3 has no hooks and relies on external contracts or off-chain triggering.

The limit-order hook works by placing many orders into a single bucket, where each price's tick corresponds to a bucket. They are not stored in slots; slots are just a concept — ordering is done by slot.

bucket_id: represents a particular pool, a particular tick, and a particular trade direction; it is hashed from these three parameters. A bucket_id is not generated from a single concrete bucket — it represents a class of buckets.
slots: within the pool represented by a bucket_id, the index of a particular bucket among this class of buckets (those for a particular tick and a particular direction).
bucket: merges the limit orders submitted by users in the same pool, at the same tick, and in the same trade direction, and creates a single combined position.

There is much more to learn from the limit-order test code.




A position is made up of these 4 parts. The process of creating a position: the PositionManager uses owner, tickLower, and tickUpper to mint the NFT, uses the NFT's id as the salt parameter, and passes that to the PoolManager.
```solidity
owner,
tickLower
tickUpper
salt
```
PositionInfoLibrary.sol is a helper library used to pack/unpack data such as owner, tickLower, and tickUpper into a single uint256. In the PositionManager it creates a positionInfo mapping that stores the correspondence between an NFT's tokenId and its packed data.
positionManager.sol: defines a position by owner, tickLower, and tickUpper. It uses PositionInfoLibrary.sol to pack this metadata into a single uint256, then stores it in the positionInfo mapping, accessed by the NFT's tokenId.
PoolManager.sol: the liquidity data provided by these positions is stored in the PoolManager. The liquidity data, the liquidity owner (which is this PositionManager contract), the tick range, and the salt (i.e. the NFT's id) together constitute the pool state.
A dApp generally needs to query both PositionManager.sol and PoolManager.sol to obtain the complete information about an NFT position: the PositionManager for the metadata, and the PoolManager for the liquidity information.


```solidity
function modifyLiquidities(bytes calldata unlockData, uint256 deadline){} // still the unlock / unlockCallback pattern; generally use this one
function modifyLiquiditiesWithoutUnlock(bytes calldata actions, bytes[] calldata params){} // calls the logic directly, invoked while already in the unlocked state
```
The modifyLiquidities call flow: first, suppose you want to mint a new position; you execute two actions, MINT_POSITION and SETTLE. One merely creates the bill, the other pays the bill.
Call flow: positionManager -> BaseActionsRouter -> SafeCallback form such an inheritance chain, so the call goes from abstract to concrete along this path.
```
positionManager.modifyLiquidities ->BaseActionsRouter._executeActions -> poolManager.unlock 
-> SafeCallback.unlockCallback -> SafeCallback._unlockCallback -> BaseActionsRouter._unlockCallback
-> BaseActionsRouter._executeActionsWithoutUnlock -> positionManager._handleAction
```

A concrete example, minting a position: 1) Actions.MINT_POSITION creates the position and the bill. 2) Actions.SETTLE_PAIR pays the bill.
`_settlePair` contains a `_settle` for currency0 and one for currency1 respectively, because when adding liquidity both tokens must be provided.
Special case: if one of the two tokens in the position is ETH, then we must transfer the ETH to the PositionManager when we initially call modifyLiquidities. So at the end we need an extra SWEEP step to reclaim any unused ETH. Because at creation time the user doesn't know exactly how much ETH is needed, they pay a bit extra up front, and when the position is actually created there may be a leftover.


Collecting fees in v4: a zero-liquidity decrease — trigger it with a decrease-liquidity action where the decreased amount is 0. Because every liquidity change recomputes the fees.
```solidity
Actions.DECREASE_LIQUIDITY # decreased amount is 0
Actions.TAKE_PAIR
```

Three other operations
```solidity
CLOSE_CURRENCY  # after a series of operations, when you don't know whether you end up owing or being owed, just call this action; it automatically calls poolManager.currencyDelta to decide — if negative, you owe, so it calls _settle, otherwise it calls _take
CLEAR_OR_TAKE # if the amount is too small to be worth withdrawing, just clear it. You provide a threshold: below it the amount is cleared, above it it's withdrawn normally via _take
SWEEP   # returns the excess ETH the user provided back to them; not just ETH — ERC-20 works the same way. It's generic
```

mint: MINT_POSITION, SETTLE_PAIR, SWEEP — create the bill, then pay for both tokens at once, then return any excess ETH

increaseLiquidity: INCREASE_LIQUIDITY, CLOSE_CURRENCY, CLOSE_CURRENCY, SWEEP. This is more involved: one scenario is that if you've already added some of a token and that token has accrued yield exceeding the amount you now want to add again, then at that point you actually need to withdraw. That's why two CLOSE_CURRENCY actions are used, and in the end you still SWEEP to guard against leftover ETH.
decreaseLiquidity: DECREASE_LIQUIDITY, TAKE_PAIR — this one is simpler: create the bill, then withdraw.
burn: BURN_POSITION, TAKE_PAIR — same as decreaseLiquidity.


Subscriber: a subscriber pattern pioneered by v4, equivalent to creating an observer contract that receives change notifications for a particular position. Only the current owner of the position can create this observer. The Subscriber contract must implement 4 methods: subscribe, unsubscribe, liquidity burn, and liquidity change. These methods are all called back by the PositionManager into the Subscriber contract when the corresponding actions are triggered.

The mechanics of subscribing, and the gas limit on unsubscribing, warrant further study.

Reposition — readjust a position; actions called: BURN_POSITION, MINT_POSITION_FROM_DELTAS, TAKE_PAIR


Universal Router: the entry point is the `execute()` public method in the UniversalRouter.sol contract, which loops through commands along with their corresponding parameters. It then calls the `dispatch` method in Dispatch.sol to identify the specific command. This whole calling process is somewhat similar to calling v4's PositionManager.sol — it packs commands and parameters together. The difference is that there's an extra layer here: the command parameter, which selects a particular v2, v3, or v4 operation, with different command names for the executed operations. Calls triggered from UniversalRouter.sol go to V4Router.sol.


The highest bit of each command controls its behavior on success/failure: default 0 means that if this command fails, the entire transaction fails; 1 means a failure of this command is ignored and execution continues. The key check is the following code, inside `execute` in UniversalRouter.sol.
```solidity
if (!success && successRequired(command)) {
    revert ExecutionFailed({commandIndex: commandIndex, message: output});
}
```
