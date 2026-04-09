# 10、Troubleshooting

Common issues and their solutions when working with Foundry.

## Compilation Issues

### Issue: "Compiler version not found"

**Problem:**
```bash
Error: Compiler version 0.8.20 not found
```

**Solution:**
```bash
# Update Foundry
foundryup

# Or specify a different version in foundry.toml
[profile.default]
solc = "0.8.19"
```

### Issue: "Stack too deep"

**Problem:**
```solidity
CompilerError: Stack too deep
```

**Solutions:**
```solidity
// Solution 1: Use fewer local variables
function problematic() public {
    uint a = 1;
    uint b = 2;
    // ... many more variables
}

// Better: Use structs
struct Params {
    uint a;
    uint b;
    // ...
}

function better() public {
    Params memory params;
    params.a = 1;
    params.b = 2;
}

// Solution 2: Enable via-ir in foundry.toml
[profile.default]
via_ir = true
```

### Issue: "Out of memory during compilation"

**Problem:**
```bash
Error: Out of memory
```

**Solution:**
```toml
# foundry.toml
[profile.default]
optimizer_runs = 200  # Reduce from higher value
via_ir = false
```

## Test Execution Issues

### Issue: "Test passes locally but fails in CI"

**Problem:**
Tests pass on your machine but fail in CI.

**Solutions:**
```bash
# 1. Use consistent random seed
forge test --seed 12345

# 2. Check for timestamp dependencies
# Use vm.warp() to set consistent timestamps

# 3. Check for network dependencies
# Use forge test --fork-url instead of relying on local state
```

### Issue: "Expected revert not triggered"

**Problem:**
```solidity
function test_ShouldRevert() public {
    vm.expectRevert("Error message");
    myContract.someFunction();  // Doesn't revert
}
```

**Solutions:**
```solidity
// Solution 1: Check the exact error message
vm.expectRevert("Exact error message");

// Solution 2: Use custom error selector
vm.expectRevert(MyContract.CustomError.selector);

// Solution 3: Check if condition is met
vm.expectRevert();  // Any revert
```

### Issue: "Gas estimation failed"

**Problem:**
```bash
Error: Gas estimation failed
```

**Solutions:**
```bash
# 1. Increase gas limit
forge test --gas-limit 30000000

# 2. Check for infinite loops
forge test -vvvv  # See trace

# 3. Check for reverts in constructor
```

## Fuzzing Issues

### Issue: "Too many rejects in fuzzing"

**Problem:**
```bash
Warning: Fuzzing test rejected too many inputs
```

**Solutions:**
```solidity
// ❌ Bad: Uses vm.assume() too much
function testFuzz_Bad(uint256 x) public {
    vm.assume(x > 100);
    vm.assume(x < 1000);
    vm.assume(x % 2 == 0);
}

// ✅ Good: Use bound()
function testFuzz_Good(uint256 x) public {
    x = bound(x, 100, 1000);
    if (x % 2 != 0) x++;  // Adjust instead of reject
}
```

### Issue: "Invariant test fails inconsistently"

**Problem:**
Invariant tests pass sometimes, fail other times.

**Solutions:**
```solidity
// 1. Add better constraints in handler
function mint(uint256 amount) public {
    amount = bound(amount, 0, MAX_MINT);
    // ...
}

// 2. Increase runs for consistency
// foundry.toml
[invariant]
runs = 1000
depth = 50

// 3. Track ghost variables
uint256 public ghost_sumOfBalances;
```

## Fork Testing Issues

### Issue: "RPC rate limit exceeded"

**Problem:**
```bash
Error: Rate limit exceeded
```

**Solutions:**
```bash
# 1. Use archive node or paid RPC
export MAINNET_RPC_URL="https://eth-mainnet.g.alchemy.com/v2/YOUR-KEY"

# 2. Cache fork state
# Anvil will cache requests

# 3. Fork at specific block
forge test --fork-url $RPC --fork-block-number 18000000
```

### Issue: "Fork tests are slow"

**Problem:**
Fork tests take a long time to run.

**Solutions:**
```bash
# 1. Use local Anvil fork
anvil --fork-url $MAINNET_RPC_URL &
forge test --fork-url http://localhost:8545

# 2. Run fork tests separately
forge test --no-match-path "test/fork/**"

# 3. Use specific block number (cached by RPC)
forge test --fork-block-number 18000000
```

## Dependency Issues

### Issue: "Library not found"

**Problem:**
```bash
Error: Library not found
```

**Solutions:**
```bash
# 1. Install the dependency
forge install OpenZeppelin/openzeppelin-contracts

# 2. Update dependencies
forge update

# 3. Check remappings
# remappings.txt
@openzeppelin/=lib/openzeppelin-contracts/
```

### Issue: "Git submodule issues"

**Problem:**
```bash
Error: Submodule not initialized
```

**Solutions:**
```bash
# Initialize submodules
git submodule update --init --recursive

# Or clone with submodules
git clone --recursive <repo-url>
```

## Debugging Issues

### Issue: "Cannot see console.log output"

**Problem:**
`console.log()` doesn't show output.

**Solutions:**
```bash
# Use correct verbosity
forge test -vv  # Shows logs for all tests

# Or
forge test -v  # Shows logs only for failing tests
```

### Issue: "Stack trace is unclear"

**Problem:**
Can't understand the error from stack trace.

**Solutions:**
```bash
# 1. Use maximum verbosity
forge test -vvvvv

# 2. Use debug mode
forge test --debug test_FunctionName

# 3. Add more console.log statements
console.log("Checkpoint 1");
console.log("Value:", value);
```

## Coverage Issues

### Issue: "Coverage report is inaccurate"

**Problem:**
Coverage report shows incorrect numbers.

**Solutions:**
```bash
# 1. Clean and rebuild
forge clean
forge coverage

# 2. Exclude test files
forge coverage --report lcov --no-match-path "test/**"

# 3. Update Foundry
foundryup
```

## Performance Issues

### Issue: "Tests are too slow"

**Problem:**
Test suite takes too long to run.

**Solutions:**
```bash
# 1. Run tests in parallel (default)
forge test

# 2. Run specific tests
forge test --match-test test_Fast

# 3. Reduce fuzz runs for CI
# foundry.toml
[profile.ci.fuzz]
runs = 100
```

### Issue: "Out of memory during tests"

**Problem:**
```bash
Error: Out of memory
```

**Solutions:**
```solidity
// 1. Clean up state between tests
function setUp() public {
    // Fresh state for each test
}

// 2. Don't create too many contracts
// Reuse contracts when possible

// 3. Reduce fuzz runs
[fuzz]
runs = 256  # Instead of 10000
```

## Cheatcode Issues

### Issue: "vm.prank not working"

**Problem:**
```solidity
vm.prank(alice);
// Multiple calls here - only first is pranked!
myContract.call1();
myContract.call2();  // Not pranked
```

**Solutions:**
```solidity
// Solution 1: Use startPrank/stopPrank
vm.startPrank(alice);
myContract.call1();
myContract.call2();
vm.stopPrank();

// Solution 2: Multiple pranks
vm.prank(alice);
myContract.call1();
vm.prank(alice);
myContract.call2();
```

### Issue: "vm.expectRevert not catching"

**Problem:**
```solidity
vm.expectRevert("Error");
myContract.noRevert();  // Doesn't revert but test passes
```

**Solutions:**
```solidity
// vm.expectRevert only affects the NEXT call
vm.expectRevert("Error");
myContract.willRevert();  // Must be immediately after

// For internal calls, they're not caught
// Must test external calls only
```

## Common Error Messages

### "EvmError: Revert"

**Meaning:** Transaction reverted without message.

**Debug:**
```bash
forge test -vvvvv  # See full trace
```

### "EvmError: OutOfGas"

**Meaning:** Transaction ran out of gas.

**Fix:**
```solidity
// Check for infinite loops or very expensive operations
```

### "EvmError: InvalidOpcode"

**Meaning:** Invalid EVM instruction.

**Fix:**
```bash
# Usually a compiler issue
foundryup  # Update Foundry
forge clean && forge build
```

## Best Practices to Avoid Issues

1. **Keep Foundry updated**: `foundryup` regularly
2. **Use consistent versions**: Lock solc version in `foundry.toml`
3. **Clean build often**: `forge clean` when things act weird
4. **Use appropriate verbosity**: `-vv` for most debugging
5. **Bound fuzz inputs**: Use `bound()` instead of `vm.assume()`
6. **Test in CI**: Catch environment-specific issues
7. **Use gas snapshots**: Track performance regressions
8. **Profile slow tests**: Find and optimize bottlenecks

## Getting Help

### Check Documentation

```bash
# Forge help
forge --help
forge test --help

# Foundry Book
https://book.getfoundry.sh
```

### Community Support

- [Foundry Telegram](https://t.me/foundry_support)
- [GitHub Issues](https://github.com/foundry-rs/foundry/issues)
- [Foundry Discord](https://discord.gg/foundry)

### Debug Checklist

- [ ] Updated Foundry to latest version?
- [ ] Cleaned build artifacts?
- [ ] Checked test with `-vvvvv`?
- [ ] Tried on a fresh clone?
- [ ] Checked for environment differences?
- [ ] Reviewed recent Foundry changelogs?

## Next Steps

- [Cheatcodes Reference](./11-cheatcodes.md) - Complete cheatcodes guide
- [Foundry Book](https://book.getfoundry.sh) - Official documentation

## References

- [Foundry Troubleshooting](https://book.getfoundry.sh/faq)
- [Foundry GitHub Issues](https://github.com/foundry-rs/foundry/issues)

