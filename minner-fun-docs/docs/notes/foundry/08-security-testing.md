# Security Testing

Learn how to test for security vulnerabilities in your smart contracts using Foundry.

## Common Vulnerability Testing

### Reentrancy

```solidity
contract ReentrancyTest is Test {
    VulnerableContract public target;
    Attacker public attacker;
    
    function setUp() public {
        target = new VulnerableContract();
        attacker = new Attacker(address(target));
        
        vm.deal(address(target), 10 ether);
    }
    
    function test_ReentrancyAttack() public {
        vm.deal(address(attacker), 1 ether);
        
        attacker.deposit{value: 1 ether}();
        
        vm.expectRevert();
        attacker.attack();
    }
}

contract Attacker {
    VulnerableContract public target;
    uint256 public attackCount;
    
    constructor(address _target) {
        target = VulnerableContract(_target);
    }
    
    function deposit() external payable {
        target.deposit{value: msg.value}();
    }
    
    function attack() external {
        target.withdraw();
    }
    
    receive() external payable {
        if (attackCount < 5) {
            attackCount++;
            target.withdraw();
        }
    }
}
```

### Integer Overflow/Underflow

```solidity
function test_IntegerOverflow() public {
    vm.expectRevert();
    calculator.add(type(uint256).max, 1);
}

function test_IntegerUnderflow() public {
    vm.expectRevert();
    calculator.subtract(0, 1);
}

function testFuzz_NoOverflow(uint256 a, uint256 b) public {
    vm.assume(a <= type(uint256).max - b);
    
    uint256 result = calculator.add(a, b);
    assertGe(result, a);
    assertGe(result, b);
}
```

### Access Control

```solidity
function test_OnlyOwnerCanWithdraw() public {
    // Owner can withdraw
    vm.prank(owner);
    vault.withdraw(100);
    
    // Non-owner cannot withdraw
    vm.prank(attacker);
    vm.expectRevert("Not owner");
    vault.withdraw(100);
}

function test_RoleBasedAccess() public {
    vm.prank(admin);
    accessControl.grantRole(MINTER_ROLE, minter);
    
    vm.prank(minter);
    token.mint(user, 100);  // Should work
    
    vm.prank(user);
    vm.expectRevert();
    token.mint(user, 100);  // Should fail
}
```

### Front-running

```solidity
function test_FrontRunningProtection() public {
    // User submits transaction
    uint256 expectedPrice = 100;
    
    vm.prank(user);
    bytes32 commitment = keccak256(abi.encodePacked(user, expectedPrice));
    exchange.commit(commitment);
    
    // Attacker tries to front-run
    vm.prank(attacker);
    vm.expectRevert("Must commit first");
    exchange.swap(expectedPrice);
    
    // User reveals after commit
    vm.prank(user);
    exchange.reveal(expectedPrice);
}
```

## Economic Attack Testing

### Flash Loan Attacks

```solidity
function test_FlashLoanAttack() public {
    // Setup pool with liquidity
    deal(address(token), address(pool), 1000000e18);
    
    // Simulate flash loan attack
    vm.startPrank(attacker);
    
    uint256 loanAmount = 1000000e18;
    pool.flashLoan(address(attackContract), loanAmount);
    
    // Verify protection worked
    assertEq(vault.priceOracle(), expectedPrice, "Price should not be manipulated");
    
    vm.stopPrank();
}
```

### Price Manipulation

```solidity
function test_PriceManipulationResistance() public {
    uint256 initialPrice = oracle.getPrice();
    
    // Large buy trying to manipulate price
    vm.prank(attacker);
    deal(address(tokenA), attacker, 1000000e18);
    
    router.swap(address(tokenA), address(tokenB), 1000000e18);
    
    // Price should not deviate too much
    uint256 newPrice = oracle.getPrice();
    uint256 deviation = newPrice > initialPrice 
        ? newPrice - initialPrice 
        : initialPrice - newPrice;
    
    assertLt(deviation, initialPrice / 10, "Price manipulation detected");
}
```

### Sandwich Attacks

```solidity
function test_SandwichAttackProtection() public {
    uint256 userAmount = 100e18;
    
    // Front-run: Attacker buys first
    vm.prank(attacker);
    router.swap(tokenA, tokenB, 1000e18);
    
    // Victim's transaction
    vm.prank(victim);
    uint256 received = router.swap(tokenA, tokenB, userAmount);
    
    // Back-run: Attacker sells
    vm.prank(attacker);
    router.swap(tokenB, tokenA, 1000e18);
    
    // Verify slippage protection
    uint256 expectedMin = userAmount * 95 / 100;
    assertGe(received, expectedMin, "Slippage protection should work");
}
```

## Governance Attacks

### Governance Manipulation

```solidity
function test_GovernanceAttack() public {
    // Attacker gets large voting power
    deal(address(govToken), attacker, 1000000e18);
    
    vm.startPrank(attacker);
    
    // Delegate to self
    govToken.delegate(attacker);
    
    // Try to pass malicious proposal
    uint256 proposalId = governor.propose(
        targets,
        values,
        calldatas,
        "Malicious proposal"
    );
    
    // Fast forward
    vm.roll(block.number + governor.votingDelay() + 1);
    
    // Vote
    governor.castVote(proposalId, 1);
    
    // Check if timelock protection works
    vm.roll(block.number + governor.votingPeriod() + 1);
    governor.execute(proposalId);
    
    // Verify timelock delay
    vm.expectRevert("Timelock not passed");
    maliciousContract.execute();
    
    vm.stopPrank();
}
```

## Oracle Attacks

### Oracle Manipulation

```solidity
function test_OracleManipulation() public {
    // Setup TWAP oracle
    pool.sync();
    
    vm.warp(block.timestamp + 1 hours);
    
    // Large swap to manipulate spot price
    vm.prank(attacker);
    router.swap(tokenA, tokenB, 1000000e18);
    
    // TWAP should not be affected immediately
    uint256 twapPrice = oracle.getTWAP();
    uint256 spotPrice = pool.getSpotPrice();
    
    assertTrue(twapPrice != spotPrice, "TWAP should resist manipulation");
}
```

## Invariant Security Testing

### Security Invariants

```solidity
contract SecurityInvariantTest is Test {
    Token public token;
    Vault public vault;
    Handler public handler;
    
    function setUp() public {
        token = new Token();
        vault = new Vault(address(token));
        handler = new Handler(vault, token);
        
        targetContract(address(handler));
    }
    
    // Solvency invariant
    function invariant_VaultSolvency() public {
        assertGe(
            token.balanceOf(address(vault)),
            vault.totalSupply(),
            "Vault must remain solvent"
        );
    }
    
    // No unauthorized minting
    function invariant_NoUnauthorizedMinting() public {
        assertLe(
            token.totalSupply(),
            handler.ghost_totalMinted(),
            "No unauthorized minting"
        );
    }
    
    // Access control invariant
    function invariant_OnlyAuthorizedCanMint() public {
        // All mints should be from authorized addresses
        assertTrue(handler.allMintsAuthorized(), "All mints must be authorized");
    }
}
```

## Static Analysis Integration

### Slither Integration

```bash
# Run Slither
slither . --filter-paths "test|lib"

# Check for specific vulnerabilities
slither . --detect reentrancy-eth
slither . --detect unchecked-transfer
```

### Mythril Integration

```bash
# Run Mythril
myth analyze src/Contract.sol

# With specific timeout
myth analyze src/Contract.sol --execution-timeout 300
```

## Formal Verification

### Certora Integration

```solidity
// Contract.spec
methods {
    balanceOf(address) returns (uint256) envfree
    totalSupply() returns (uint256) envfree
}

invariant totalSupplyIsSumOfBalances()
    totalSupply() == sumOfBalances()
```

## Fuzzing for Security

### Echidna Integration

```yaml
# echidna.yaml
testMode: assertion
testLimit: 10000
timeout: 600
coverage: true
```

```solidity
contract EchidnaTest {
    Token token;
    
    constructor() {
        token = new Token();
    }
    
    function echidna_no_unauthorized_mint() public returns (bool) {
        return token.totalSupply() <= 1000000e18;
    }
}
```

## Best Practices

1. **Test all access control paths**
2. **Verify economic invariants**
3. **Test with realistic attack scenarios**
4. **Use multiple testing approaches** (unit, fuzzing, formal verification)
5. **Test in forked environments**
6. **Simulate adversarial conditions**
7. **Verify all assumptions**
8. **Test upgrade paths**

## Security Testing Checklist

- [ ] Reentrancy protection
- [ ] Integer overflow/underflow
- [ ] Access control
- [ ] Front-running protection
- [ ] Flash loan attack resistance
- [ ] Price manipulation resistance
- [ ] Governance attack protection
- [ ] Oracle manipulation resistance
- [ ] Proper event emission
- [ ] Safe external calls
- [ ] Correct use of delegatecall
- [ ] Proper initialization
- [ ] Upgrade safety

## Next Steps

- [Real World Examples](./09-real-world-examples.md) - See security testing in practice
- [Troubleshooting](./10-troubleshooting.md) - Debug security issues
- [Cheatcodes](./11-cheatcodes.md) - Advanced testing techniques

## References

- [Smart Contract Security Best Practices](https://consensys.github.io/smart-contract-best-practices/)
- [Slither](https://github.com/crytic/slither)
- [Echidna](https://github.com/crytic/echidna)
- [Certora](https://www.certora.com/)

