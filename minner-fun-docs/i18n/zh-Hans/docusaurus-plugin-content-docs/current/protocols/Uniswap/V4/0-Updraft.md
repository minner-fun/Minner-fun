Currency 保存的0地址表示的是该链的原生代币，非零的即为ERC-20代币

Currency类型 把原生代币与erc20代币，的转账，查询余额等操作统一了。在外部统一用Currency，在Curreny内部再判断代币类型，执行对应的转账，查余额等方法。典型应用就是用着PoolKey结构中。
对于转账都使用了汇编语言，可以再看下transfer方法如何使用的。一个问题，创建代币池的时候如何把eth转成Currency的


PoolKey：是人类友好的结构，定义交易对的唯一性，代币对，加上费率，价格变动的颗粒度，加上hook的用户自定义逻辑，这5个元素，共同标记了一个流动性池的唯一性   
PoolId：机器友好，把PoolKey进行keccak256哈希的结果。是bytes32类型，在univ4，作为查询某个流动性池的主键
```solidity
struct PoolKey {
    /// @notice The lower currency of the pool, sorted numerically
    Currency currency0;
    /// @notice The higher currency of the pool, sorted numerically
    Currency currency1;
    /// @notice The pool LP fee
    uint24 fee;          // 1/1,000,000,, 3000 表示 0.3%   3000/1,000,000 = 3/1,000 = 即千分之3 百分之0.3
    /// @notice The tick spacing for the pool
    int24 tickSpacing;     // 费用等级和 刻度间隔是对应关系，0.3% 对应60
    /// @notice The hooks contract for the pool
    IHooks hooks;          // 默认为address(0) 
}
```
User Defined Value Types (UDVTs)
UDVTs 用户自定义类型
```solidity
type Currency is address;
type PoolId is bytes32;
```
两个方法：
```solidity
unwrap() 把用户自定义类型转回原始的类型
wrap() 把原始类型转回自定义类型
```
在log中，需要现将自定义类型转换原始类型，才能在log中输出
```solidity

// To log it, we must convert it back to bytes32
bytes32 i = PoolId.unwrap(id);
console.logBytes32(i);   // 转成原始类型打印
​
// To convert a bytes32 back to a PoolId, we use wrap()
PoolId p = PoolId.wrap(i);  // 转回自定义类型用于其他逻辑
```
根据Poolid 查询Poolkey的信息，可以去dune上的表里查询
```sql
select * from uniswap_v4_ethereum.poolmanager_evt_initialize where id = 0x3ea74c37fbb79dfcd6d760870f0f4e00cf4c3960b3259d0d43f211c0547394c1
```



调用swap的流程：要先调用unlock方法，然后unlock方法会回调，该合约的的unlockCallback方法。所以只能是合约才能调用unlock方法，并且这个合约要实现了unlockCallback方法，也就是要实现IUnlockCallback接口。在这个过程中使用了两相技术，瞬态存储transient storage，和结算检查（Settlement Check）

也就是说要想调用PoolManager.sol的unlock，必须是实现unlockCallback方法的合约。


lock 与 unlock是把状态做了瞬态存储

Transient vs State storage 两点主要的不同：1、生命周期，T只在一个交易内。S永久保存在链上。所以就有了2. Gas消耗的不同T消耗的少，S消耗的多。
T的两个典型应用：Re-entrancy Locks重入锁。数据只在一个调用周期有用，调用结束，数据即用不到了，完美契合T。如果用S反而还要主动清除，并且gas消耗高，没有必要。另外一个应用是，可以传递上下文参数，在多个外部调用直接共享数据。PM合约中的sync方法，与_settle方法中的erc20代币的分支就是用到了CurrencyReserves.sol中的方法，实现了传递数据
在EIP-1153中引入，solidity>=0.8.24可用
```solidity
tstore(slot, value) 把数据存储在给的slot位置。 slot是bytes32类型。
tload(slot)
```

检查NonzeroDeltaCount，进行结算检查
NonzeroDeltaCount 故名思意，就是非零的Delta的个数，Delta通常表示变化的量。所以这里表示的是没有被平掉的账单的个数。只是记录的个数。
```solidity
(int256 previous, int256 next) = currency.applyDelta(target, delta);
// previous:表示原本值，如果原本的值是0，表示是新加了账单，所以要NonzeroDeltaCount 要加一
// next：表示applyDelta后的值，如果是0表示某个账单被平了，所以要减一
```

_accountDelta方法中的delta参数 的正负是从PoolManager的角度来评判的： 负数 用户要支付的。即为表示用户已经从PoolManager提取了代币,或者声称要给，还没给。所以总的来说这个负数，就代表后续用户要给PM钱，用户欠PM的。正 用户要提取的。表示已经向PoolManager发送了代币，或者用户声称要从MP取钱，结果用户还没取走，总之正表示用户接下来可以从PM拿钱，是PM欠用户的。
```solidity
function _accountDelta(Currency currency, int128 delta, address target) internal {
    if (delta == 0) return;
    // applyDelta方法在 /library/CurrencyDelta.sol中
    // applyDelta方法逻辑很简单，就是从TS里，取出来previous然后加上delta的值(delta是有符号的)，然后得到next
    (int256 previous, int256 next) = currency.applyDelta(target, delta); // 这里就是个加法
    if (next == 0) {
        NonzeroDeltaCount.decrement();
    } else if (previous == 0) {
        NonzeroDeltaCount.increment();
    }
}
```
假如你take了100，NonzeroDeltaCount 变为1，然后settle 90，TS的previous=-100, delta = 90, 一加，得 -10.你的欠款没还完。所以NonzeroDeltaCount不变。还是1。


"Sync Before Settle" Workflow: 就是在调用Settle付钱之前，要调用Sync去把之前的余额同步一下到一个瞬态存储槽内，然后Settle方法内会去读取之前存储的值与当前值做差，然后算出增加了多少

swap的流程
```
router合约调用MP的unlock

回调router中的unlockCallback

unlockCallback中  执行swap，take， sync(), settle()

最后，unlockCallback结束
unlock执行检测NonzeroDeltaCount是否为0
```
关键点：sync，必须在settle前调用。因为要先把转账之前的余额暂存好，才能取出来用
关键点：因为take和settle并不先后调用顺序，所以，直接调用take，拿走一部分钱，去干anything，然后再调用sync与settle把钱还回去就好了，根本不用调用swap。只要NonzeroDelteCount为0就行。unlock检测就能过。就结束了。所以实现了无手续费闪电贷

Flash loan VS. Swap ： flash loan 直接take, 然后settle对应的额度，take的额度取决的用户想loan多少。swap多了一个计算的过程，相当于我loan A but settle B。


BalanceDelta 是int256，一份为二，高128位存amount0的Delta，低128为存amount1的Delta，利用了一种位压缩计算。 balanceDelta := or(shl(128, _amount0), and(sub(shl(128, 1), 1), _amount1))

解压：amount0往右移动128位，直接用汇编操作码sar(Arithmetic Shift Right) _amount0 := sar(128, balanceDelta), amount1  _amount1 := signextend(15, balanceDelta) 表示取后 15*8+7位

关于读取状态变量state类型的数据
```
v4-core\src\Extsload.sol  # 这个是最底层的库方法
        src\libraries\StateLibrary.sol  # 对Extsload.sol进行了封装，目的是供合约使用
v4-periphery/src/lens/StateView.sol     # 日常调用最好调用这个，这是最佳实践
```
关于读取瞬时存储Transient
```
v4-core\src\Exttload.sol  # 底层方法
        src\libraries\TransientStateLibrary.sol  # 了解余额变化用这个
v4-periphery/src/base/DeltaResolver.sol 
```



 流动性的添加前的hook调用



hook合约的权限是通过create2把权限写到hook合约地址的后几位上，所以就需要找合适的solt来使合约地址恰好能表达hook的函数的开通权限

在hook中调用到初始的发送交易的地址。通过在router中建立 getMsgSender方法，然后PoolManager把router以sender参数，传递给hook合约中的方法总，然后在hook中在回调router中的getMseSender方法。从而就拿到了
最初的外部调用地址

hook视角的调用关系：hook合约声明权限->寻找salt部署create2 -> 创建池PoolKey中携带地址 -> PM合约中initialize方法检查hook地址有效性 -> PM中swap，modifyLiquidity等进入具体hook方法 -> 先进入Hook库方法中的具体hook方法 -> 最后进入IHook实现的方法，也就是具体的外部hook合约的方法。

Hook.sol中, 拓展了IHooks的方法。在PoolManager中是先进入了Hook中拓展到IHook是的方法，并且在调用外部hook合约方法之前，都会再用hasPermission判断是否有对应方法。
```solidity
using Hooks for IHooks; 
```

hook合约 权限最佳实际，要在constructor中实现自检
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


市价单：立即成交，但是会有价格变动，滑点的风险
限价单：指定价格，但是不一定能成交

限价单是在最小单位的tick上提供流动性，在交易完成后，通过hook撤回流动性，v3也能实现，但是v3没有hook，依赖外部合约或者链下触发

限价单hook 原理是把很多个订单放到一个buckets 里面，每个价格对应的tick作为一个buckets。并不是存入solt中，solt只是一个概念，是根据solt排序

bucket_id: 表示是的 某个池子，某个tick，某个交易方向，是由这三个参数hash生成的，bucket_id并不是具体某个bucket生成的。而是代表着一类bucket。
slots： 在bucket_id所表示的某个池子中，的某个tick上的某个方向的交易的这一类的bucket中，某个bucket的编号。
bucket：把（某个池子中，tick相同，交易方向相同的用户发出的限价单）合并后，创建一个单独的头寸。

在限价单的测试代码中，还有很多需要学习的地方。




position的构成由这4部分。创建position的过程：positionManager中使用owner，tickLower，tickUpper来创建NFT，用NFT的id作为salt参数，再传给poolManager
```solidity
owner,
tickLower
tickUpper
salt
```
PositionInfoLibrary.sol 是一个辅助库，用来压缩解压owner，tickLower，tickUpper等数据，压缩成一个uint256，在positionManager创建一个positionInfo mapping，来存放NFT的tokenId与压缩后的数据的对应关系
positionManager.sol:定义position由owner，tickLower，tickUpper来定义。使用PositionInfoLibrary.sol把这些meta数据压缩到一个uint256中。然后存入positionInfo mapping中，通过NFT的tokenid来访问。
PoolManager.sol:通过这些position提供的流动性数据保存在PoolManager中。流动性数据，流动性的所有者（是这个positionManager合约），tick的范围还有salt（也就是NFT的id）共同构成了池状态
dapp一般要查PositionManager.sol PoolManager.sol才能获取到完整的某个NFT position的信息，PositionManager查meta信息，PoolManager查询流动性信息。


```solidity
function modifyLiquidities(bytes calldata unlockData, uint256 deadline){} // 依旧是unlock unlockCallback的模式，一般都用这个
function modifyLiquiditiesWithoutUnlock(bytes calldata actions, bytes[] calldata params){} // 直接调用逻辑了，在已经解锁的状态下调用
```
modifyLiquidities的调用流程：首先，假如要mint新的position，要执行   MINT_POSTITION 和 SETTLE两个动作。一个只是创建账单，另一个付账单。
调用流程：positionManager ->  BaseActionsRouter -> SafeCallback 存在着这样的继承关系，所以，调用从抽象到实现有个链路。
```
positionManager.modifyLiquidities ->BaseActionsRouter._executeActions -> poolManager.unlock 
-> SafeCallback.unlockCallback -> SafeCallback._unlockCallback -> BaseActionsRouter._unlockCallback
-> BaseActionsRouter._executeActionsWithoutUnlock -> positionManager._handleAction
```

具体例子mint 一个position：1、Actions.MINT_POSITION创建仓位，和账单。1、Actions.SETTLE_PAIR付账单
_settlePair 里面分别是currency0和currency1的_settle，因为是添加流动性，两个代币都需要提供
特殊情况，如果创建仓位，其中1个是eth，这就需要我们在最初调用modifyLiquidities的时候就要把eth转给PositionManager。所以最后需要额外执行一步 SWEEP,用来回收没有用完的eth。因为在用户创建的时候是不清楚具体需要多少eth的，首先要支付多一些eth，然后实际创建的时候，可能有剩余


v4中提取fee：Zero-Liquidity Decrease，用减少流动性的动作出发，但是减少的量为0。因为每次多流动性的变动，都会从新计算费用。
```solidity
Actions.DECREASE_LIQUIDITY # 减少的量为0
Actions.TAKE_PAIR
```

三个其他的操作
```solidity
CLOSE_CURRENCY  # 当你进行了一系列操作，你也不知道最后是欠还是被欠，直接调用这个动作，会自动调用poolManager.currencyDelta来进行判断，如果是负的，表示欠钱，就调_settle，否则就调_take
CLEAR_OR_TAKE # 如果金额太小不值当的提取，那么就直接清除掉。需要提供一个阈值，小于这个值就清除，大于这个值正常_take提取
SWEEP   # 把用户提供的多与eth返回给用户,不仅仅是eth，erc20也一样。通用的
```

mint: MINT_POSITION, SETTLE_PAIR, SWEEP 创建账单，然后同时付两个代币的钱，然后如果有多余的eth就返回回来

increaseLiquidity: INCREASE_LIQUIDITY, CLOSE_CURRENCY, CLOSE_CURRENCY, SWEEP,这里比较复杂，有一种情况是，假如已经添加过某种代币了，然后这些代币产生了收益，这些收益比再次要添加的还要多。那么此时，是需要提取的。所以使用了两个CLOSE_CURRENCY，然后最后还是要SWEEP一下，防止有多余的eth
decreaseLiquidity：DECREASE_LIQUIDITY, TAKE_PAIR, 这个比较简单，创建账单，然后取走
burn：BURN_POSITION, TAKE_PAIR  和decreaseLiquidity一样


Subscriber: v4首创的订阅者模式，就相当于创建一个观察者合约，来接受某个position的变化信息，这个观察者只能是当前position的所有者可以创建。Subscriber合约要实现4个方法，添加订阅，取消订阅，流通性销毁，流动性变换。这些方法都是PositionManager在相应动作触发的时候来回调到Subscriber合约的。

添加订阅的原理，与解除订阅时候的gas限制，再研究一下

Reposition重新调整仓位，调用动作：BURN_POSITION， MINT_POSITION_FROM_DELTAS， TAKE_PAIR


Universal Router:UniversalRouter.sol合约中的execute() public方法为入口点，循环执行命令，还有对应的参数。然后调用Dispatch.sol中的dispatch方法来做具体的命令的识别,在整个调用过程中，与调用v4的PositiomManager.sol有点类似。就是把命令与参数打包起来。但是不同的是，这里多了一层，commond参数，表示选v2，v3,v4的某个操作，然后执行的命令名字有所不同。从UniversalRouter.sol触发的调用，是调用的V4Route.sol。


每个指令的最高位用来控制其成功与否的行为：默认0，表示此命令失败，整个交易都失败。1，此命令失败将被忽略，然后继续执行。关键判断代码如下，在UniversalRouter.sol的execute中。
```solidity
if (!success && successRequired(command)) {
    revert ExecutionFailed({commandIndex: commandIndex, message: output});
}
```

v3 的pool 有token0， token1，fee，tickSpacing 4个元素构成
price = \left(\frac{\sqrt{P_{X96}}}{2^{96}}\right)^2
关键指标
TVL:总锁仓量，也就是这个池子里两种代币的总的价值，所以是数量*价格。amount0 * price0 + amount1 * price1. 数量，直接拿着池子的地址去对应token的balance方法去查。price 更具squtPriceX96来计算。这个当前只能获取到当前的amount，所以只能算当前的TVL。
Volume_24H: 24小时交易量。根据某一个代币的转入转出量的绝对值，求和。只需要盯着一个算。
Volume/TVL: 资金利用率。衡量资金活跃度。活跃度越高越好。
Fee APR: 年化收益率。 fee = volume * fee_rate。    APR = daily_fee × 365 / TVL
Volatility: 波动率。价格的标准差
LP Score：综合打分
```
score =
0.4 × volume_tvl
+
0.3 × fee_apr
-
0.2 × volatility
-
0.1 × liquidity_density
```
还是先整好自动调整的动作，这个简单，难的是策略，和回撤计算。