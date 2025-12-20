# Real World Examples

Explore real-world testing scenarios with complete examples.

## ERC20 Token Testing

### Complete ERC20 Test Suite

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test} from "forge-std/Test.sol";
import {MyToken} from "../src/MyToken.sol";

contract MyTokenTest is Test {
    MyToken public token;
    
    address public owner;
    address public alice;
    address public bob;
    
    uint256 constant INITIAL_SUPPLY = 1_000_000e18;
    
    function setUp() public {
        owner = address(this);
        alice = makeAddr("alice");
        bob = makeAddr("bob");
        
        token = new MyToken("My Token", "MTK", INITIAL_SUPPLY);
    }
    
    function test_InitialState() public {
        assertEq(token.totalSupply(), INITIAL_SUPPLY);
        assertEq(token.balanceOf(owner), INITIAL_SUPPLY);
        assertEq(token.name(), "My Token");
        assertEq(token.symbol(), "MTK");
        assertEq(token.decimals(), 18);
    }
    
    function test_Transfer() public {
        uint256 amount = 100e18;
        
        token.transfer(alice, amount);
        
        assertEq(token.balanceOf(alice), amount);
        assertEq(token.balanceOf(owner), INITIAL_SUPPLY - amount);
    }
    
    function test_TransferFrom() public {
        uint256 amount = 100e18;
        
        token.approve(alice, amount);
        
        vm.prank(alice);
        token.transferFrom(owner, bob, amount);
        
        assertEq(token.balanceOf(bob), amount);
        assertEq(token.allowance(owner, alice), 0);
    }
    
    function testFuzz_Transfer(address to, uint256 amount) public {
        vm.assume(to != address(0));
        vm.assume(to != owner);
        amount = bound(amount, 0, INITIAL_SUPPLY);
        
        token.transfer(to, amount);
        
        assertEq(token.balanceOf(to), amount);
    }
}
```

## AMM/DEX Testing

### Uniswap V2 Style Testing

```solidity
contract AMM_Test is Test {
    Token public tokenA;
    Token public tokenB;
    Pair public pair;
    Router public router;
    
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");
    
    function setUp() public {
        tokenA = new Token("Token A", "TKNA");
        tokenB = new Token("Token B", "TKNB");
        pair = new Pair(address(tokenA), address(tokenB));
        router = new Router(address(pair));
        
        // Setup liquidity
        tokenA.mint(address(this), 1000e18);
        tokenB.mint(address(this), 1000e18);
        
        tokenA.approve(address(router), type(uint256).max);
        tokenB.approve(address(router), type(uint256).max);
        
        router.addLiquidity(
            address(tokenA),
            address(tokenB),
            1000e18,
            1000e18
        );
    }
    
    function test_AddLiquidity() public {
        uint256 liquidityBefore = pair.balanceOf(address(this));
        
        router.addLiquidity(
            address(tokenA),
            address(tokenB),
            100e18,
            100e18
        );
        
        assertGt(pair.balanceOf(address(this)), liquidityBefore);
    }
    
    function test_Swap() public {
        uint256 amountIn = 10e18;
        
        tokenA.mint(alice, amountIn);
        
        vm.startPrank(alice);
        tokenA.approve(address(router), amountIn);
        
        uint256 balanceBefore = tokenB.balanceOf(alice);
        
        router.swap(
            address(tokenA),
            address(tokenB),
            amountIn,
            0
        );
        
        uint256 balanceAfter = tokenB.balanceOf(alice);
        assertGt(balanceAfter, balanceBefore);
        
        vm.stopPrank();
    }
    
    function test_PriceImpact() public {
        uint256 smallSwap = 1e18;
        uint256 largeSwap = 100e18;
        
        // Small swap
        uint256 smallOutput = router.getAmountOut(
            smallSwap,
            address(tokenA),
            address(tokenB)
        );
        
        // Large swap
        uint256 largeOutput = router.getAmountOut(
            largeSwap,
            address(tokenA),
            address(tokenB)
        );
        
        // Price impact should be higher for large swap
        uint256 smallRate = (smallOutput * 1e18) / smallSwap;
        uint256 largeRate = (largeOutput * 1e18) / largeSwap;
        
        assertLt(largeRate, smallRate, "Large swap should have worse rate");
    }
    
    function invariant_K_Never_Decreases() public {
        (uint256 reserveA, uint256 reserveB,) = pair.getReserves();
        uint256 k = reserveA * reserveB;
        
        assertGe(k, pair.kLast(), "K should never decrease");
    }
}
```

## Lending Protocol Testing

### Compound-style Lending

```solidity
contract LendingTest is Test {
    Token public underlying;
    CToken public cToken;
    PriceOracle public oracle;
    
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");
    
    function setUp() public {
        underlying = new Token("Underlying", "UND");
        oracle = new PriceOracle();
        cToken = new CToken(address(underlying), address(oracle));
        
        // Setup users
        underlying.mint(alice, 1000e18);
        underlying.mint(bob, 1000e18);
    }
    
    function test_Supply() public {
        uint256 supplyAmount = 100e18;
        
        vm.startPrank(alice);
        underlying.approve(address(cToken), supplyAmount);
        cToken.supply(supplyAmount);
        
        assertEq(cToken.balanceOf(alice), supplyAmount);
        assertEq(underlying.balanceOf(address(cToken)), supplyAmount);
        vm.stopPrank();
    }
    
    function test_Borrow() public {
        // Alice supplies collateral
        vm.startPrank(alice);
        underlying.approve(address(cToken), 1000e18);
        cToken.supply(1000e18);
        vm.stopPrank();
        
        // Bob borrows
        vm.startPrank(bob);
        underlying.approve(address(cToken), 100e18);
        cToken.supply(100e18);  // Supply some collateral
        
        uint256 borrowAmount = 50e18;
        cToken.borrow(borrowAmount);
        
        assertEq(underlying.balanceOf(bob), 1000e18 - 100e18 + borrowAmount);
        assertEq(cToken.borrowBalance(bob), borrowAmount);
        vm.stopPrank();
    }
    
    function test_Liquidation() public {
        // Setup borrower
        vm.startPrank(alice);
        underlying.approve(address(cToken), 100e18);
        cToken.supply(100e18);
        cToken.borrow(50e18);
        vm.stopPrank();
        
        // Price drops, making position underwater
        oracle.setPrice(address(underlying), 0.5e18);
        
        // Bob liquidates
        vm.startPrank(bob);
        underlying.approve(address(cToken), 50e18);
        cToken.liquidate(alice, 50e18);
        
        assertEq(cToken.borrowBalance(alice), 0);
        vm.stopPrank();
    }
    
    function test_InterestAccrual() public {
        vm.startPrank(alice);
        underlying.approve(address(cToken), 100e18);
        cToken.supply(100e18);
        vm.stopPrank();
        
        // Time passes
        vm.warp(block.timestamp + 365 days);
        
        // Accrue interest
        cToken.accrueInterest();
        
        // Withdraw should include interest
        vm.prank(alice);
        uint256 withdrawn = cToken.withdraw(type(uint256).max);
        
        assertGt(withdrawn, 100e18, "Should earn interest");
    }
}
```

## NFT Marketplace Testing

### NFT Marketplace Example

```solidity
contract NFTMarketplaceTest is Test {
    NFT public nft;
    Marketplace public marketplace;
    Token public paymentToken;
    
    address public seller = makeAddr("seller");
    address public buyer = makeAddr("buyer");
    
    uint256 public tokenId = 1;
    uint256 public price = 100e18;
    
    function setUp() public {
        nft = new NFT();
        paymentToken = new Token("Payment", "PAY");
        marketplace = new Marketplace(address(nft), address(paymentToken));
        
        // Mint NFT to seller
        nft.mint(seller, tokenId);
        
        // Give buyer tokens
        paymentToken.mint(buyer, 1000e18);
    }
    
    function test_ListNFT() public {
        vm.startPrank(seller);
        nft.approve(address(marketplace), tokenId);
        marketplace.list(tokenId, price);
        
        (address listedSeller, uint256 listedPrice) = marketplace.listings(tokenId);
        assertEq(listedSeller, seller);
        assertEq(listedPrice, price);
        vm.stopPrank();
    }
    
    function test_BuyNFT() public {
        // Seller lists
        vm.startPrank(seller);
        nft.approve(address(marketplace), tokenId);
        marketplace.list(tokenId, price);
        vm.stopPrank();
        
        // Buyer purchases
        vm.startPrank(buyer);
        paymentToken.approve(address(marketplace), price);
        marketplace.buy(tokenId);
        
        assertEq(nft.ownerOf(tokenId), buyer);
        assertEq(paymentToken.balanceOf(seller), price);
        vm.stopPrank();
    }
}
```

## Staking Contract Testing

### Staking Rewards

```solidity
contract StakingTest is Test {
    Token public stakingToken;
    Token public rewardToken;
    Staking public staking;
    
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");
    
    uint256 constant REWARD_RATE = 1e18;  // 1 token per second
    
    function setUp() public {
        stakingToken = new Token("Stake", "STK");
        rewardToken = new Token("Reward", "RWD");
        staking = new Staking(
            address(stakingToken),
            address(rewardToken),
            REWARD_RATE
        );
        
        // Fund staking contract with rewards
        rewardToken.mint(address(staking), 1000000e18);
        
        // Give users staking tokens
        stakingToken.mint(alice, 1000e18);
        stakingToken.mint(bob, 1000e18);
    }
    
    function test_Stake() public {
        uint256 amount = 100e18;
        
        vm.startPrank(alice);
        stakingToken.approve(address(staking), amount);
        staking.stake(amount);
        
        assertEq(staking.balanceOf(alice), amount);
        assertEq(stakingToken.balanceOf(address(staking)), amount);
        vm.stopPrank();
    }
    
    function test_EarnRewards() public {
        uint256 stakeAmount = 100e18;
        
        vm.startPrank(alice);
        stakingToken.approve(address(staking), stakeAmount);
        staking.stake(stakeAmount);
        vm.stopPrank();
        
        // Time passes
        vm.warp(block.timestamp + 100);
        
        // Check earned rewards
        uint256 earned = staking.earned(alice);
        assertApproxEqAbs(earned, REWARD_RATE * 100, 1e18);
    }
    
    function test_ClaimRewards() public {
        vm.startPrank(alice);
        stakingToken.approve(address(staking), 100e18);
        staking.stake(100e18);
        
        vm.warp(block.timestamp + 100);
        
        uint256 balanceBefore = rewardToken.balanceOf(alice);
        staking.claim();
        uint256 balanceAfter = rewardToken.balanceOf(alice);
        
        assertGt(balanceAfter, balanceBefore);
        vm.stopPrank();
    }
}
```

## Next Steps

- [Troubleshooting](./10-troubleshooting.md) - Debug common issues
- [Cheatcodes](./11-cheatcodes.md) - Advanced testing techniques

## References

- [OpenZeppelin Contracts](https://github.com/OpenZeppelin/openzeppelin-contracts)
- [Uniswap V2](https://github.com/Uniswap/v2-core)
- [Compound Protocol](https://github.com/compound-finance/compound-protocol)

