# 7、CI/CD Integration

Learn how to integrate Foundry tests into your CI/CD pipeline for automated testing.

## GitHub Actions

### Basic Workflow

Create `.github/workflows/test.yml`:

```yaml
name: Foundry Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  FOUNDRY_PROFILE: ci

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          submodules: recursive

      - name: Install Foundry
        uses: foundry-rs/foundry-toolchain@v1
        with:
          version: nightly

      - name: Run tests
        run: forge test -vvv

      - name: Run gas report
        run: forge test --gas-report
```

### Advanced Workflow

```yaml
name: Advanced Tests

on: [push, pull_request]

env:
  FOUNDRY_PROFILE: ci

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          submodules: recursive

      - name: Install Foundry
        uses: foundry-rs/foundry-toolchain@v1

      - name: Check formatting
        run: forge fmt --check

      - name: Check compilation
        run: forge build --sizes

  test:
    needs: check
    runs-on: ubuntu-latest
    strategy:
      matrix:
        test-group: [unit, integration, invariant]
    steps:
      - uses: actions/checkout@v3
        with:
          submodules: recursive

      - name: Install Foundry
        uses: foundry-rs/foundry-toolchain@v1

      - name: Cache
        uses: actions/cache@v3
        with:
          path: |
            ~/.foundry/cache
            cache
            out
          key: ${{ runner.os }}-foundry-${{ hashFiles('**/foundry.toml') }}

      - name: Run ${{ matrix.test-group }} tests
        run: forge test --match-path "test/${{ matrix.test-group }}/**/*.sol"

  coverage:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          submodules: recursive

      - name: Install Foundry
        uses: foundry-rs/foundry-toolchain@v1

      - name: Generate coverage
        run: forge coverage --report lcov

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./lcov.info
          flags: foundry
```

## CI Configuration

### Foundry Profile for CI

```toml
# foundry.toml

[profile.default]
src = "src"
out = "out"
libs = ["lib"]
test = "test"
optimizer = true
optimizer_runs = 200

# CI profile - faster tests
[profile.ci]
fuzz = { runs = 100 }
invariant = { runs = 100, depth = 10 }
# Don't show logs in CI unless test fails
verbosity = 2

# Intense profile - thorough testing
[profile.intense]
fuzz = { runs = 10000 }
invariant = { runs = 1000, depth = 50 }
```

### Environment Variables

```yaml
# .github/workflows/test.yml
env:
  FOUNDRY_PROFILE: ci
  MAINNET_RPC_URL: ${{ secrets.MAINNET_RPC_URL }}
  ETHERSCAN_API_KEY: ${{ secrets.ETHERSCAN_API_KEY }}
```

## Caching Strategy

### Effective Caching

```yaml
- name: Cache Foundry
  uses: actions/cache@v3
  with:
    path: |
      ~/.foundry/cache
      ~/.foundry/bin
      cache
      out
    key: ${{ runner.os }}-foundry-${{ hashFiles('foundry.toml') }}
    restore-keys: |
      ${{ runner.os }}-foundry-
```

### Node Modules Cache

```yaml
- name: Cache Node Modules
  uses: actions/cache@v3
  with:
    path: node_modules
    key: ${{ runner.os }}-node-${{ hashFiles('package-lock.json') }}
```

## Quality Gates

### Test Coverage Threshold

```yaml
- name: Check coverage
  run: |
    forge coverage --report summary > coverage.txt
    COVERAGE=$(cat coverage.txt | grep "Total" | awk '{print $2}' | sed 's/%//')
    if (( $(echo "$COVERAGE < 80" | bc -l) )); then
      echo "Coverage is below 80%"
      exit 1
    fi
```

### Gas Threshold

```yaml
- name: Check gas usage
  run: |
    forge snapshot --check
    if [ $? -ne 0 ]; then
      echo "Gas usage increased beyond threshold"
      exit 1
    fi
```

### Code Size Check

```yaml
- name: Check contract sizes
  run: |
    forge build --sizes
    # Fail if contracts exceed 24KB
    forge build --sizes | grep -E "^[^|]*\|[^|]*\|[^|]*24\.[5-9]|25\." && exit 1 || exit 0
```

## Automated Reporting

### Gas Report

```yaml
- name: Generate gas report
  run: forge test --gas-report > gas-report.txt

- name: Comment gas report on PR
  uses: actions/github-script@v6
  if: github.event_name == 'pull_request'
  with:
    script: |
      const fs = require('fs');
      const report = fs.readFileSync('gas-report.txt', 'utf8');
      github.rest.issues.createComment({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: `## Gas Report\n\`\`\`\n${report}\n\`\`\``
      });
```

### Coverage Report

```yaml
- name: Generate coverage report
  run: |
    forge coverage --report lcov
    genhtml lcov.info --output-directory coverage

- name: Upload coverage report
  uses: actions/upload-artifact@v3
  with:
    name: coverage-report
    path: coverage/
```

## Slack Notifications

### Setup Notifications

```yaml
- name: Notify Slack on failure
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "Tests failed on ${{ github.ref }}",
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "❌ Tests failed on branch `${{ github.ref }}`\nCommit: ${{ github.sha }}\nAuthor: ${{ github.actor }}"
            }
          }
        ]
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

## Fork Testing in CI

### Setup Fork Tests

```yaml
- name: Run fork tests
  env:
    MAINNET_RPC_URL: ${{ secrets.MAINNET_RPC_URL }}
  run: |
    forge test --match-path "test/fork/**/*.sol" --fork-url $MAINNET_RPC_URL
```

### Archive Node Requirement

```yaml
- name: Run historical fork tests
  env:
    ARCHIVE_RPC_URL: ${{ secrets.ARCHIVE_RPC_URL }}
  run: |
    forge test \
      --match-path "test/fork/historical/**/*.sol" \
      --fork-url $ARCHIVE_RPC_URL \
      --fork-block-number 18000000
```

## Security Scanning

### Slither Integration

```yaml
- name: Run Slither
  uses: crytic/slither-action@v0.3.0
  with:
    target: 'src/'
    slither-args: '--filter-paths "test|lib"'
```

### Mythril Integration

```yaml
- name: Run Mythril
  run: |
    pip3 install mythril
    myth analyze src/**/*.sol
```

## Deployment Checks

### Pre-deployment Tests

```yaml
deploy:
  needs: test
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v3
    
    - name: Install Foundry
      uses: foundry-rs/foundry-toolchain@v1
    
    - name: Dry run deployment
      run: |
        forge script script/Deploy.s.sol --rpc-url ${{ secrets.MAINNET_RPC_URL }}
    
    - name: Deploy (mainnet)
      if: github.ref == 'refs/heads/main'
      run: |
        forge script script/Deploy.s.sol \
          --rpc-url ${{ secrets.MAINNET_RPC_URL }} \
          --private-key ${{ secrets.DEPLOYER_PRIVATE_KEY }} \
          --broadcast \
          --verify
```

## Multi-chain Testing

### Test on Multiple Networks

```yaml
test-networks:
  runs-on: ubuntu-latest
  strategy:
    matrix:
      network: [mainnet, polygon, arbitrum]
  steps:
    - name: Test on ${{ matrix.network }}
      env:
        RPC_URL: ${{ secrets[format('{0}_RPC_URL', matrix.network)] }}
      run: |
        forge test --fork-url $RPC_URL
```

## Best Practices

### 1. Fail Fast

```yaml
- name: Quick checks
  run: |
    forge fmt --check || exit 1
    forge build || exit 1
    
- name: Run tests
  run: forge test
```

### 2. Parallel Testing

```yaml
strategy:
  matrix:
    test-suite: [unit, integration, fork, invariant]
  fail-fast: false
```

### 3. Smart Caching

```yaml
# Cache invalidation on config changes
key: ${{ runner.os }}-${{ hashFiles('foundry.toml', 'lib/**') }}
```

### 4. Conditional Jobs

```yaml
- name: Run expensive tests
  if: github.event_name == 'push' && github.ref == 'refs/heads/main'
  run: forge test --match-path "test/expensive/**/*.sol"
```

## Example Complete Workflow

```yaml
name: Complete CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: foundry-rs/foundry-toolchain@v1
      - run: forge fmt --check

  build:
    needs: lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: foundry-rs/foundry-toolchain@v1
      - run: forge build --sizes

  test:
    needs: build
    runs-on: ubuntu-latest
    strategy:
      matrix:
        test-type: [unit, integration, invariant]
    steps:
      - uses: actions/checkout@v3
      - uses: foundry-rs/foundry-toolchain@v1
      - run: forge test --match-path "test/${{ matrix.test-type }}/**/*.sol"

  coverage:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: foundry-rs/foundry-toolchain@v1
      - run: forge coverage --report lcov
      - uses: codecov/codecov-action@v3

  deploy:
    needs: [test, coverage]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: foundry-rs/foundry-toolchain@v1
      - run: forge script script/Deploy.s.sol --broadcast
```

## Next Steps

- [Security Testing](./08-security-testing.md) - Add security checks
- [Real World Examples](./09-real-world-examples.md) - See CI/CD in production
- [Troubleshooting](./10-troubleshooting.md) - Debug CI issues

## References

- [GitHub Actions](https://docs.github.com/en/actions)
- [Foundry CI/CD](https://book.getfoundry.sh/config/continuous-integration)

