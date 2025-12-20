# Performance Optimization

Learn how to optimize your Foundry tests for speed and efficiency.

## Test Execution Performance

### Parallel Test Execution

Foundry runs tests in parallel by default:

```bash
# Runs tests in parallel (default)
forge test

# Control number of threads
forge test --jobs 4
```

### Selective Test Execution

```bash
# Run specific test file
forge test --match-path test/Token.t.sol

# Run specific test function
forge test --match-test test_Transfer

# Run tests matching pattern
forge test --match-contract TokenTest

# Exclude tests
forge test --no-match-test testFuzz
```

### Fast Fail

```bash
# Stop on first failure
forge test --fail-fast
```

## Compilation Optimization

### Compiler Settings

```toml
# foundry.toml
[profile.default]
optimizer = true
optimizer_runs = 200

# For production
[profile.production]
optimizer = true
optimizer_runs = 1000000

# For testing (faster compilation)
[profile.test]
optimizer = true
optimizer_runs = 200
via_ir = false
```

### Compilation Cache

```bash
# Forge caches by default
forge build

# Clear cache if needed
forge clean

# Rebuild without cache
forge build --force
```

## Fuzzing Configuration

### Optimize Fuzz Runs

```toml
# foundry.toml
[fuzz]
runs = 256          # Default
max_test_rejects = 65536

# For faster testing
[profile.ci.fuzz]
runs = 100

# For thorough testing
[profile.intense.fuzz]
runs = 10000
```

### Bounded Fuzzing

```solidity
// ✅ Good - Efficient
function testFuzz_Transfer(uint256 amount) public {
    amount = bound(amount, 1, 1e18);
    // All inputs are valid
}

// ❌ Bad - Inefficient
function testFuzz_Transfer(uint256 amount) public {
    vm.assume(amount > 0);
    vm.assume(amount <= 1e18);
    // Many inputs rejected
}
```

## Gas Optimization

### Measure Gas Usage

```bash
# Generate gas report
forge test --gas-report

# Save gas snapshots
forge snapshot

# Compare snapshots
forge snapshot --diff
```

### Optimize Contract Gas

```solidity
// Before optimization
function test_Gas_Unoptimized() public {
    for (uint i = 0; i < 10; i++) {
        token.transfer(bob, 1);
    }
}

// After optimization
function test_Gas_Optimized() public {
    token.transfer(bob, 10);
}
```

### Track Gas in Tests

```solidity
function test_GasUsage() public {
    uint256 gasBefore = gasleft();
    
    token.transfer(bob, 100);
    
    uint256 gasUsed = gasBefore - gasleft();
    assertLt(gasUsed, 50000, "Transfer uses too much gas");
}
```

## Memory Optimization

### Efficient Data Structures

```solidity
// ✅ Good - Minimal storage
function test_Efficient() public {
    uint256[] memory amounts = new uint256[](3);
    amounts[0] = 100;
    amounts[1] = 200;
    amounts[2] = 300;
}

// ❌ Bad - Unnecessary storage
uint256[] public testAmounts;

function test_Inefficient() public {
    testAmounts.push(100);
    testAmounts.push(200);
    testAmounts.push(300);
}
```

### Reuse Variables

```solidity
// ✅ Good
function test_Reuse() public {
    uint256 balance;
    
    balance = token.balanceOf(alice);
    assertEq(balance, 100);
    
    balance = token.balanceOf(bob);
    assertEq(balance, 200);
}

// ❌ Bad
function test_NoReuse() public {
    uint256 aliceBalance = token.balanceOf(alice);
    assertEq(aliceBalance, 100);
    
    uint256 bobBalance = token.balanceOf(bob);
    assertEq(bobBalance, 200);
}
```

## Fork Testing Optimization

### Cache Fork State

```solidity
contract ForkTest is Test {
    uint256 mainnetFork;
    
    // Create fork once in setUp
    function setUp() public {
        mainnetFork = vm.createFork(vm.envString("MAINNET_RPC_URL"));
    }
    
    function test_OnFork() public {
        vm.selectFork(mainnetFork);
        // Test on fork
    }
}
```

### Persistent Fork

```bash
# Start Anvil with fork
anvil --fork-url $MAINNET_RPC_URL

# Run tests against local fork
forge test --fork-url http://localhost:8545
```

### Fork at Specific Block

```solidity
function setUp() public {
    // Fork at specific block (cached by RPC)
    mainnetFork = vm.createFork(
        vm.envString("MAINNET_RPC_URL"),
        18_000_000
    );
}
```

## CI/CD Optimization

### Efficient CI Configuration

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          submodules: recursive
      
      - name: Install Foundry
        uses: foundry-rs/foundry-toolchain@v1
      
      # Cache dependencies
      - name: Cache
        uses: actions/cache@v3
        with:
          path: |
            ~/.foundry
            cache
            out
          key: ${{ runner.os }}-foundry-${{ hashFiles('foundry.toml') }}
      
      # Run tests efficiently
      - name: Run tests
        run: forge test --gas-report
```

### Parallel CI Jobs

```yaml
jobs:
  test:
    strategy:
      matrix:
        test-group: [unit, integration, invariant]
    steps:
      - name: Run ${{ matrix.test-group }} tests
        run: |
          forge test --match-path "test/${{ matrix.test-group }}/*"
```

## Storage Optimization

### Minimize State Changes

```solidity
// ✅ Good - Read once
function test_Optimized() public {
    uint256 supply = token.totalSupply();
    assertGt(supply, 0);
    assertLt(supply, 1000000);
}

// ❌ Bad - Read multiple times
function test_Unoptimized() public {
    assertGt(token.totalSupply(), 0);
    assertLt(token.totalSupply(), 1000000);
}
```

### Efficient Setup

```solidity
// ✅ Good - Setup once
function setUp() public {
    token = new Token();
    deal(address(token), alice, 1000);
}

// ❌ Bad - Setup in each test
function test_Transfer() public {
    Token localToken = new Token();
    deal(address(localToken), alice, 1000);
    // Test...
}
```

## Test Organization for Speed

### Group Related Tests

```solidity
contract TokenUnitTest is Test {
    // Fast unit tests only
}

contract TokenIntegrationTest is Test {
    // Slower integration tests
}

contract TokenForkTest is Test {
    // Slowest fork tests
}
```

### Run Fast Tests First

```bash
# In CI: run unit tests first
forge test --match-path "test/unit/*" || exit 1
forge test --match-path "test/integration/*" || exit 1
forge test --match-path "test/fork/*"
```

## Invariant Testing Performance

### Efficient Handlers

```solidity
contract Handler is Test {
    Token token;
    
    // ✅ Good - Bounded inputs
    function mint(uint256 amount) public {
        amount = bound(amount, 1, 1e18);
        token.mint(msg.sender, amount);
    }
    
    // ❌ Bad - Many assumptions
    function mint(uint256 amount) public {
        vm.assume(amount > 0);
        vm.assume(amount < 1e18);
        vm.assume(msg.sender != address(0));
        token.mint(msg.sender, amount);
    }
}
```

### Configure Invariant Runs

```toml
# foundry.toml
[invariant]
runs = 256
depth = 15
fail_on_revert = false

# Faster for CI
[profile.ci.invariant]
runs = 100
depth = 10
```

## Profiling and Benchmarking

### Benchmark Tests

```solidity
function test_Benchmark_Transfer() public {
    uint256 iterations = 100;
    uint256 startGas = gasleft();
    
    for (uint i = 0; i < iterations; i++) {
        token.transfer(bob, 1);
    }
    
    uint256 gasPerTransfer = (startGas - gasleft()) / iterations;
    console.log("Gas per transfer:", gasPerTransfer);
}
```

### Compare Implementations

```solidity
function test_Compare_Implementations() public {
    uint256 gasOld = _measureGas(address(oldImplementation));
    uint256 gasNew = _measureGas(address(newImplementation));
    
    console.log("Gas saved:", gasOld - gasNew);
    assertLt(gasNew, gasOld, "New implementation should be more efficient");
}

function _measureGas(address implementation) internal returns (uint256) {
    uint256 gasBefore = gasleft();
    IContract(implementation).execute();
    return gasBefore - gasleft();
}
```

## Build Optimization

### Selective Building

```bash
# Build specific contracts
forge build --contracts src/Token.sol

# Skip test contracts
forge build --skip test
```

### Watch Mode

```bash
# Rebuild on file changes
forge build --watch
```

## Best Practices Summary

1. **Use `bound` instead of `vm.assume`** for fuzzing
2. **Run tests in parallel** (default behavior)
3. **Cache compilation** artifacts
4. **Optimize fuzz runs** for CI vs local
5. **Group tests** by speed (unit, integration, fork)
6. **Minimize storage** reads and writes
7. **Reuse test fixtures** via setUp
8. **Profile gas usage** regularly
9. **Use gas snapshots** to track regressions
10. **Optimize CI** with caching and parallelization

## Measuring Impact

### Before Optimization

```bash
forge test
# Time: 30s
# Gas: 1,000,000 per test
```

### After Optimization

```bash
forge test --gas-report
# Time: 10s
# Gas: 500,000 per test
# 66% faster, 50% less gas
```

## Next Steps

- [CI/CD Integration](./07-cicd-integration.md) - Automate optimized tests
- [Real World Examples](./09-real-world-examples.md) - See optimization in action
- [Troubleshooting](./10-troubleshooting.md) - Debug performance issues

## References

- [Foundry Configuration](https://book.getfoundry.sh/config/)
- [Gas Optimization](https://book.getfoundry.sh/forge/gas-reports)
- [Fork Testing](https://book.getfoundry.sh/forge/fork-testing)

