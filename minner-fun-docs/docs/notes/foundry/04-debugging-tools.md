# Debugging Tools

Master Foundry's powerful debugging tools to troubleshoot and optimize your smart contracts.

## Console Logging

### Basic Logging

```solidity
import {console} from "forge-std/console.sol";

function test_WithLogging() public {
    console.log("Starting test");
    console.log("Balance:", token.balanceOf(user));
    console.log("Address:", user);
}
```

### Available Console Functions

```solidity
console.log(string memory);
console.log(uint256);
console.log(address);
console.log(bool);
console.logBytes(bytes memory);
console.logBytes32(bytes32);
```

## Verbosity Levels

Control output detail with verbosity flags:

```bash
# Level 1: Show test results
forge test

# Level 2: Show logs for failing tests
forge test -v

# Level 3: Show logs for all tests
forge test -vv

# Level 4: Show traces for failing tests
forge test -vvv

# Level 5: Show traces for all tests  
forge test -vvvv
```

## Stack Traces

### Reading Stack Traces

```bash
forge test -vvvv

# Output shows:
# [PASS] test_Transfer()
#   [1234] Token::transfer(0x123..., 100)
#     ├─ [5678] IERC20::balanceOf(0x123...)
#     │   └─ ← 1000
#     ├─ emit Transfer(from: 0x123..., to: 0x456..., value: 100)
#     └─ ← true
```

## Gas Reporting

### Basic Gas Reports

```bash
forge test --gas-report
```

### Detailed Gas Reports

```bash
# Per contract
forge test --gas-report

# Save to file
forge test --gas-report > gas-report.txt
```

### Gas Snapshots

```bash
# Create gas snapshot
forge snapshot

# Compare with snapshot
forge snapshot --diff

# Update snapshot
forge snapshot --check
```

## Debugging Failed Tests

### Using Traces

```solidity
function test_FailingTest() public {
    // This will fail
    token.transfer(user2, 1000000000);
}
```

```bash
forge test --match-test test_FailingTest -vvvv
```

### Inspecting Reverts

```bash
# Shows why transaction reverted
forge test -vvvv
```

## Breakpoint Debugging

### Using vm.breakpoint

```solidity
function test_WithBreakpoint() public {
    token.mint(user1, 100);
    
    // Inspect state here
    vm.breakpoint("after_mint");
    
    token.transfer(user2, 50);
}
```

## State Inspection

### Reading Storage

```solidity
function test_InspectStorage() public {
    bytes32 value = vm.load(address(token), bytes32(uint256(0)));
    console.logBytes32(value);
}
```

### Checking Balances

```solidity
function test_CheckBalances() public {
    console.log("ETH Balance:", address(this).balance);
    console.log("Token Balance:", token.balanceOf(address(this)));
}
```

## Debugger Mode

### Interactive Debugging

```bash
# Run with debugger
forge test --debug test_Function
```

### Debugger Commands

- `n` - Next step
- `s` - Step into
- `c` - Continue
- `q` - Quit
- `p <var>` - Print variable

## Coverage Analysis

### Generate Coverage Report

```bash
forge coverage
```

### Detailed Coverage

```bash
# HTML report
forge coverage --report lcov
genhtml lcov.info --output-directory coverage

# Open in browser
open coverage/index.html
```

## Fork Debugging

### Debug on Fork

```solidity
function test_ForkDebug() public {
    uint256 fork = vm.createFork("mainnet");
    vm.selectFork(fork);
    
    // Debug against real state
    console.log("Block:", block.number);
}
```

### Replay Transactions

```bash
# Replay specific transaction
cast run <TX_HASH> --debug
```

## Common Debugging Patterns

### Debug Helper Functions

```solidity
function _logState() internal view {
    console.log("=== State ===");
    console.log("Balance:", token.balanceOf(user));
    console.log("Total Supply:", token.totalSupply());
    console.log("============");
}

function test_WithHelper() public {
    _logState();
    token.mint(user, 100);
    _logState();
}
```

### Conditional Logging

```solidity
function test_ConditionalLog() public {
    uint256 balance = token.balanceOf(user);
    
    if (balance > 100) {
        console.log("High balance:", balance);
    }
}
```

## Performance Profiling

### Measure Gas Usage

```solidity
function test_GasProfile() public {
    uint256 gasBefore = gasleft();
    
    token.transfer(user2, 100);
    
    uint256 gasUsed = gasBefore - gasleft();
    console.log("Gas used:", gasUsed);
}
```

### Benchmark Functions

```solidity
function test_Benchmark() public {
    uint256 iterations = 100;
    uint256 gasBefore = gasleft();
    
    for (uint i = 0; i < iterations; i++) {
        token.transfer(user2, 1);
    }
    
    uint256 gasUsed = gasBefore - gasleft();
    console.log("Avg gas per call:", gasUsed / iterations);
}
```

## Advanced Debugging

### Memory Inspection

```solidity
function test_InspectMemory() public {
    bytes memory data = abi.encode(123, "hello");
    console.logBytes(data);
}
```

### Event Debugging

```solidity
function test_DebugEvents() public {
    vm.recordLogs();
    
    token.transfer(user2, 100);
    
    Vm.Log[] memory logs = vm.getRecordedLogs();
    console.log("Events emitted:", logs.length);
}
```

## Troubleshooting Tools

### Check Expectations

```solidity
function test_ExpectationCheck() public {
    vm.expectRevert();
    token.transfer(user2, 999999);
    
    console.log("Revert was expected");
}
```

### Snapshot Debugging

```solidity
function test_SnapshotDebug() public {
    uint256 snap = vm.snapshot();
    
    token.mint(user, 100);
    console.log("After mint:", token.balanceOf(user));
    
    vm.revertTo(snap);
    console.log("After revert:", token.balanceOf(user));
}
```

## Best Practices

1. **Use appropriate verbosity**: Start with `-vv`, increase as needed
2. **Strategic logging**: Add logs at key decision points
3. **Gas snapshots**: Track gas changes over time
4. **Coverage checks**: Aim for high test coverage
5. **Clean up logs**: Remove debug logs before committing

## Common Issues

### Issue: Tests passing locally but failing in CI

```bash
# Check for randomness issues
forge test --seed 123456

# Check for gas differences
forge test --gas-report
```

### Issue: Unclear revert reason

```bash
# Use maximum verbosity
forge test --match-test test_Name -vvvvv
```

### Issue: Slow tests

```bash
# Profile to find bottlenecks
forge test --gas-report

# Check specific test
forge test --match-test test_Slow -vv
```

## Next Steps

- [Best Practices](./05-best-practices.md) - Learn testing best practices
- [Performance Optimization](./06-performance-optimization.md) - Optimize your tests
- [Troubleshooting](./10-troubleshooting.md) - Common problems and solutions

## References

- [Foundry Debugger](https://book.getfoundry.sh/forge/debugger)
- [Forge Gas Reports](https://book.getfoundry.sh/forge/gas-reports)
- [Coverage Reports](https://book.getfoundry.sh/forge/coverage)

