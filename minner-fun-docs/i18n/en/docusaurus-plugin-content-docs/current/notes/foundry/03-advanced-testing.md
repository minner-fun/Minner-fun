# 3、Advanced Testing

Master advanced testing techniques including fuzzing, invariant testing, and property-based testing.

## Fuzz Testing

Fuzz testing automatically generates random inputs to test your contracts.

### Basic Fuzzing

```solidity
function testFuzz_Addition(uint256 a, uint256 b) public {
    vm.assume(a < type(uint256).max - b); // Prevent overflow
    
    uint256 result = calculator.add(a, b);
    assertEq(result, a + b);
}
```

### Multiple Parameters

```solidity
function testFuzz_Transfer(address from, address to, uint256 amount) public {
    vm.assume(from != address(0));
    vm.assume(to != address(0));
    vm.assume(from != to);
    vm.assume(amount <= token.totalSupply());
    
    token.mint(from, amount);
    vm.prank(from);
    token.transfer(to, amount);
    
    assertEq(token.balanceOf(to), amount);
}
```

### Configuring Fuzz Runs

```toml
# foundry.toml
[fuzz]
runs = 1000
max_test_rejects = 65536
```

## Invariant Testing

Invariant tests ensure certain properties always hold true, no matter what actions are taken.

### Basic Invariant Test

```solidity
contract TokenInvariantTest is Test {
    Token public token;
    Handler public handler;
    
    function setUp() public {
        token = new Token();
        handler = new Handler(token);
        
        targetContract(address(handler));
    }
    
    function invariant_TotalSupplyMatchesBalances() public {
        uint256 sumOfBalances = handler.sumOfBalances();
        assertEq(token.totalSupply(), sumOfBalances);
    }
}
```

### Handler Pattern

```solidity
contract Handler is Test {
    Token public token;
    uint256 public sumOfBalances;
    
    constructor(Token _token) {
        token = _token;
    }
    
    function mint(address to, uint256 amount) public {
        amount = bound(amount, 0, 1e18);
        to = address(uint160(bound(uint160(to), 1, type(uint160).max)));
        
        token.mint(to, amount);
        sumOfBalances += amount;
    }
    
    function burn(address from, uint256 amount) public {
        amount = bound(amount, 0, token.balanceOf(from));
        
        vm.prank(from);
        token.burn(amount);
        sumOfBalances -= amount;
    }
}
```

## Property-Based Testing

Test properties that should always be true:

```solidity
function testProperty_Commutative(uint256 a, uint256 b) public {
    vm.assume(a < type(uint128).max);
    vm.assume(b < type(uint128).max);
    
    assertEq(calculator.add(a, b), calculator.add(b, a));
}

function testProperty_Associative(uint256 a, uint256 b, uint256 c) public {
    vm.assume(a < type(uint85).max);
    vm.assume(b < type(uint85).max);
    vm.assume(c < type(uint85).max);
    
    uint256 left = calculator.add(calculator.add(a, b), c);
    uint256 right = calculator.add(a, calculator.add(b, c));
    assertEq(left, right);
}
```

## State Machine Testing

Test complex state transitions:

```solidity
contract StateMachineTest is Test {
    MyContract public myContract;
    
    enum Action { Create, Start, Pause, Resume, Complete }
    
    function testFuzz_ValidStateTransitions(Action[] memory actions) public {
        vm.assume(actions.length > 0 && actions.length <= 10);
        
        for (uint i = 0; i < actions.length; i++) {
            try this.executeAction(actions[i]) {
                // Action succeeded
            } catch {
                // Action failed - ensure it was an invalid transition
                assertTrue(isInvalidTransition(myContract.state(), actions[i]));
            }
        }
    }
    
    function executeAction(Action action) public {
        if (action == Action.Create) myContract.create();
        else if (action == Action.Start) myContract.start();
        else if (action == Action.Pause) myContract.pause();
        else if (action == Action.Resume) myContract.resume();
        else if (action == Action.Complete) myContract.complete();
    }
}
```

## Differential Testing

Compare implementations:

```solidity
function testDifferential_AgainstReference(uint256 a, uint256 b) public {
    vm.assume(b != 0);
    
    uint256 optimizedResult = optimizedDiv.divide(a, b);
    uint256 referenceResult = referenceDiv.divide(a, b);
    
    assertEq(optimizedResult, referenceResult);
}
```

## Fork Testing

Test against real blockchain state:

```solidity
contract ForkTest is Test {
    uint256 mainnetFork;
    
    function setUp() public {
        mainnetFork = vm.createFork(vm.envString("MAINNET_RPC_URL"));
        vm.selectFork(mainnetFork);
    }
    
    function test_SwapOnUniswap() public {
        address UNISWAP_ROUTER = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
        address WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
        address DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
        
        // Test against real Uniswap contracts
        deal(WETH, address(this), 1 ether);
        
        // ... perform swap and assertions
    }
}
```

## Advanced Fuzzing Techniques

### Bounded Fuzzing

```solidity
function testFuzz_BoundedInput(uint256 amount) public {
    amount = bound(amount, 1, 1000000);
    
    // Test with bounded amount
    token.mint(user, amount);
    assertLe(amount, 1000000);
    assertGe(amount, 1);
}
```

### Structured Fuzzing

```solidity
struct FuzzInput {
    address user;
    uint256 amount;
    uint256 deadline;
}

function testFuzz_Structured(FuzzInput memory input) public {
    input.user = address(uint160(bound(uint160(input.user), 1, type(uint160).max)));
    input.amount = bound(input.amount, 1, 1e18);
    input.deadline = bound(input.deadline, block.timestamp, block.timestamp + 365 days);
    
    // Use structured input
}
```

## Assume vs Bound

### Using vm.assume

```solidity
function testFuzz_WithAssume(uint256 amount) public {
    vm.assume(amount > 0);
    vm.assume(amount <= 1e18);
    
    // Test with valid amount
}
```

### Using bound

```solidity
function testFuzz_WithBound(uint256 amount) public {
    amount = bound(amount, 1, 1e18);
    
    // Test with bounded amount
}
```

**Tip**: Prefer `bound` over `vm.assume` for better performance.

## Invariant Testing Best Practices

### 1. Use Handlers

Always use handlers to constrain the action space:

```solidity
contract Handler is Test {
    MyContract public target;
    
    function validAction(uint256 input) public {
        input = bound(input, MIN, MAX);
        target.action(input);
    }
}
```

### 2. Track Ghost Variables

```solidity
contract Handler is Test {
    uint256 public ghost_totalDeposited;
    uint256 public ghost_totalWithdrawn;
    
    function deposit(uint256 amount) public {
        vault.deposit(amount);
        ghost_totalDeposited += amount;
    }
    
    function withdraw(uint256 amount) public {
        vault.withdraw(amount);
        ghost_totalWithdrawn += amount;
    }
}
```

### 3. Multiple Invariants

```solidity
function invariant_SolvencyMaintained() public {
    assertGe(vault.totalAssets(), vault.totalLiabilities());
}

function invariant_AccountingConsistent() public {
    assertEq(
        handler.ghost_totalDeposited() - handler.ghost_totalWithdrawn(),
        vault.totalAssets()
    );
}
```

## Next Steps

- [Debugging Tools](./04-debugging-tools.md) - Learn debugging techniques
- [Best Practices](./05-best-practices.md) - Master testing best practices
- [Real World Examples](./09-real-world-examples.md) - See advanced testing in action

## References

- [Foundry Book - Fuzzing](https://book.getfoundry.sh/forge/fuzz-testing)
- [Foundry Book - Invariant Testing](https://book.getfoundry.sh/forge/invariant-testing)

