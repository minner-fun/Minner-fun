# 5、Best Practices

Learn the best practices for writing maintainable, reliable, and efficient smart contract tests.

## Test Organization

### Directory Structure

```
test/
├── unit/
│   ├── Token.t.sol
│   └── Vault.t.sol
├── integration/
│   ├── TokenVault.t.sol
│   └── SwapFlow.t.sol
├── invariant/
│   ├── handlers/
│   │   └── TokenHandler.sol
│   └── TokenInvariant.t.sol
├── fork/
│   └── UniswapFork.t.sol
└── helpers/
    └── TestHelpers.sol
```

### File Naming Conventions

```solidity
// ✅ Good
test/unit/Counter.t.sol
test/integration/SwapFlow.t.sol

// ❌ Bad
test/CounterTests.sol
test/test_counter.sol
```

## Test Naming

### Descriptive Names

```solidity
// ✅ Good - Clear what is being tested
function test_Transfer_RevertsWhen_InsufficientBalance() public {}
function test_Deposit_UpdatesBalance() public {}
function testFuzz_Mint_NeverExceedsMaxSupply(uint256 amount) public {}

// ❌ Bad - Unclear purpose
function test1() public {}
function testTransfer() public {}
function test_stuff() public {}
```

### Naming Patterns

```solidity
// Unit tests
test_<FunctionName>_<ExpectedBehavior>

// Revert tests  
test_<FunctionName>_RevertsWhen_<Condition>

// Fuzz tests
testFuzz_<FunctionName>_<Property>

// Invariant tests
invariant_<PropertyDescription>
```

## Test Structure

### Arrange-Act-Assert Pattern

```solidity
function test_Transfer_UpdatesBalances() public {
    // Arrange
    uint256 amount = 100;
    token.mint(alice, amount);
    uint256 aliceBalanceBefore = token.balanceOf(alice);
    uint256 bobBalanceBefore = token.balanceOf(bob);
    
    // Act
    vm.prank(alice);
    token.transfer(bob, amount);
    
    // Assert
    assertEq(token.balanceOf(alice), aliceBalanceBefore - amount);
    assertEq(token.balanceOf(bob), bobBalanceBefore + amount);
}
```

### One Assertion Per Concept

```solidity
// ✅ Good - Clear failure point
function test_Transfer_DecreasesFromBalance() public {
    uint256 balanceBefore = token.balanceOf(alice);
    vm.prank(alice);
    token.transfer(bob, 100);
    assertEq(token.balanceOf(alice), balanceBefore - 100);
}

function test_Transfer_IncreasesToBalance() public {
    uint256 balanceBefore = token.balanceOf(bob);
    vm.prank(alice);
    token.transfer(bob, 100);
    assertEq(token.balanceOf(bob), balanceBefore + 100);
}

// ❌ Bad - Multiple concepts
function test_Transfer() public {
    vm.prank(alice);
    token.transfer(bob, 100);
    assertEq(token.balanceOf(alice), 0);
    assertEq(token.balanceOf(bob), 100);
    assertEq(token.totalSupply(), 100);
}
```

## Setup and Helpers

### Effective setUp

```solidity
contract TokenTest is Test {
    Token public token;
    address public alice;
    address public bob;
    
    uint256 constant INITIAL_SUPPLY = 1000e18;
    
    function setUp() public {
        token = new Token();
        alice = makeAddr("alice");
        bob = makeAddr("bob");
        
        token.mint(alice, INITIAL_SUPPLY);
        
        vm.label(alice, "Alice");
        vm.label(bob, "Bob");
    }
}
```

### Helper Functions

```solidity
// ✅ Good helpers
function _mintAndApprove(
    address user,
    address spender,
    uint256 amount
) internal {
    token.mint(user, amount);
    vm.prank(user);
    token.approve(spender, amount);
}

function _setupLiquidity(uint256 amount) internal {
    token.mint(address(pool), amount);
    pool.sync();
}

// Use in tests
function test_SwapWithHelper() public {
    _setupLiquidity(1000e18);
    _mintAndApprove(alice, address(router), 100e18);
    // ... test swap
}
```

### Modifiers for Common Patterns

```solidity
modifier funded(address user) {
    vm.deal(user, 100 ether);
    _;
}

modifier approved(address user, address spender, uint256 amount) {
    vm.prank(user);
    token.approve(spender, amount);
    _;
}

function test_SwapWithModifier() 
    public 
    funded(alice) 
    approved(alice, address(router), 100e18) 
{
    // Test with setup already done
}
```

## Constants and Configuration

### Use Constants

```solidity
// ✅ Good
uint256 constant INITIAL_BALANCE = 1000e18;
uint256 constant MAX_SUPPLY = 1_000_000e18;
address constant ZERO_ADDRESS = address(0);

function test_Mint() public {
    token.mint(alice, INITIAL_BALANCE);
    assertEq(token.balanceOf(alice), INITIAL_BALANCE);
}

// ❌ Bad - Magic numbers
function test_Mint() public {
    token.mint(alice, 1000000000000000000000);
    assertEq(token.balanceOf(alice), 1000000000000000000000);
}
```

### Configuration Contracts

```solidity
contract TestConfig {
    uint256 public constant FORK_BLOCK = 18_000_000;
    string public constant MAINNET_RPC = "https://...";
    
    address public constant UNISWAP_ROUTER = 0x7a250d5630...;
    address public constant WETH = 0xC02aaA39b223FE8D...;
}

contract MyTest is Test, TestConfig {
    // Use inherited constants
}
```

## Documentation

### Documenting Tests

```solidity
/// @notice Test that transfer correctly updates balances
/// @dev This test verifies the core transfer functionality
function test_Transfer_UpdatesBalances() public {
    // Given: Alice has 100 tokens
    uint256 amount = 100;
    token.mint(alice, amount);
    
    // When: Alice transfers to Bob
    vm.prank(alice);
    token.transfer(bob, amount);
    
    // Then: Balances are updated correctly
    assertEq(token.balanceOf(alice), 0);
    assertEq(token.balanceOf(bob), amount);
}
```

### Inline Comments

```solidity
function test_ComplexScenario() public {
    // Setup initial state
    _setupLiquidity(1000e18);
    
    // First swap: Alice buys tokens
    vm.prank(alice);
    router.swap(tokenA, tokenB, 100e18);
    
    // Price should have moved
    uint256 priceAfterSwap = pool.getPrice();
    assertGt(priceAfterSwap, initialPrice);
    
    // Second swap: Bob sells tokens (opposite direction)
    vm.prank(bob);
    router.swap(tokenB, tokenA, 50e18);
    
    // Price should move back but not to original
    uint256 finalPrice = pool.getPrice();
    assertLt(finalPrice, priceAfterSwap);
    assertGt(finalPrice, initialPrice);
}
```

## Error Handling

### Clear Revert Messages

```solidity
// ✅ Good
function test_Transfer_RevertsWhen_InsufficientBalance() public {
    vm.prank(alice);
    vm.expectRevert("Insufficient balance");
    token.transfer(bob, 1000);
}

// For custom errors
function test_RevertsWhen_Unauthorized() public {
    vm.expectRevert(Unauthorized.selector);
    token.adminFunction();
}
```

### Testing All Revert Conditions

```solidity
function test_Transfer_RevertsWhen_InsufficientBalance() public {
    vm.expectRevert("Insufficient balance");
    token.transfer(bob, 1000);
}

function test_Transfer_RevertsWhen_ZeroAddress() public {
    vm.expectRevert("Invalid recipient");
    token.transfer(address(0), 100);
}

function test_Transfer_RevertsWhen_ZeroAmount() public {
    vm.expectRevert("Invalid amount");
    token.transfer(bob, 0);
}
```

## State Management

### Use Snapshots for Complex Tests

```solidity
function test_MultipleScenarios() public {
    uint256 checkpoint = vm.snapshot();
    
    // Scenario 1
    _testScenario1();
    
    // Reset to checkpoint
    vm.revertTo(checkpoint);
    checkpoint = vm.snapshot();
    
    // Scenario 2
    _testScenario2();
}
```

### Clean State Between Tests

```solidity
// setUp() runs before each test automatically
function setUp() public {
    // Fresh state for each test
    token = new Token();
    alice = makeAddr("alice");
}
```

## Performance

### Efficient Test Organization

```solidity
// ✅ Good - Specific test selection
forge test --match-contract TokenTest --match-test test_Transfer

// ✅ Good - Parallel execution (default)
forge test

// ❌ Bad - Running all tests when debugging one
forge test -vvvv  // Very slow
```

### Optimize Setup

```solidity
// ✅ Good - Minimal setup
function setUp() public {
    token = new Token();
}

// ❌ Bad - Unnecessary setup
function setUp() public {
    token = new Token();
    // Don't deploy contracts not used in all tests
    unusedContract = new UnusedContract();
    anotherUnused = new AnotherContract();
}
```

## Security Testing

### Test Edge Cases

```solidity
function test_EdgeCase_MaxUint256() public {
    vm.expectRevert();
    token.mint(alice, type(uint256).max);
}

function test_EdgeCase_ZeroAmount() public {
    token.transfer(bob, 0);
    assertEq(token.balanceOf(bob), 0);
}
```

### Test Access Control

```solidity
function test_OnlyOwner_CanMint() public {
    vm.prank(owner);
    token.mint(alice, 100);  // Should succeed
    
    vm.prank(alice);
    vm.expectRevert("Not owner");
    token.mint(bob, 100);  // Should fail
}
```

## Code Reuse

### Base Test Contracts

```solidity
abstract contract BaseTest is Test {
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");
    
    function _dealAndApprove(
        address user,
        address token,
        address spender,
        uint256 amount
    ) internal {
        deal(token, user, amount);
        vm.prank(user);
        IERC20(token).approve(spender, amount);
    }
}

contract TokenTest is BaseTest {
    // Inherits common functionality
}
```

## Next Steps

- [Performance Optimization](./06-performance-optimization.md) - Optimize test performance
- [CI/CD Integration](./07-cicd-integration.md) - Automate your tests
- [Security Testing](./08-security-testing.md) - Advanced security testing

## References

- [Foundry Best Practices](https://book.getfoundry.sh/tutorials/best-practices)
- [Testing Smart Contracts](https://ethereum.org/en/developers/docs/smart-contracts/testing/)

