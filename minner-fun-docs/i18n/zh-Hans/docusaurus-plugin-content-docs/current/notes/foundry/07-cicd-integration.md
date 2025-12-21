# 7、CI/CD 集成指南

## GitHub Actions 集成

### 基础工作流配置

```yaml
# .github/workflows/foundry.yml
name: Foundry Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  FOUNDRY_PROFILE: ci

jobs:
  check:
    strategy:
      fail-fast: true

    name: Foundry project
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: recursive

      - name: Install Foundry
        uses: foundry-rs/foundry-toolchain@v1
        with:
          version: nightly

      - name: Show Foundry version
        run: |
          forge --version
          cast --version
          anvil --version
          chisel --version

      - name: Run Forge build
        run: |
          forge --version
          forge build --sizes

      - name: Run Forge tests
        run: |
          forge test -vvv
```

### 高级工作流配置

```yaml
# .github/workflows/advanced-foundry.yml
name: Advanced Foundry Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  schedule:
    # 每天运行一次完整测试
    - cron: '0 0 * * *'

env:
  FOUNDRY_PROFILE: ci

jobs:
  lint-and-format:
    name: Lint and Format
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Foundry
        uses: foundry-rs/foundry-toolchain@v1

      - name: Check formatting
        run: forge fmt --check

      - name: Run Solhint
        run: |
          npm install -g solhint
          solhint 'src/**/*.sol'

  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    needs: lint-and-format
    
    strategy:
      matrix:
        profile: [default, intense]
    
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: recursive

      - name: Install Foundry
        uses: foundry-rs/foundry-toolchain@v1

      - name: Cache Foundry
        uses: actions/cache@v3
        with:
          path: |
            cache
            out
          key: foundry-${{ runner.os }}-${{ matrix.profile }}-${{ hashFiles('foundry.toml') }}-${{ hashFiles('lib/**') }}
          restore-keys: |
            foundry-${{ runner.os }}-${{ matrix.profile }}-

      - name: Build contracts
        run: forge build

      - name: Run unit tests
        run: |
          FOUNDRY_PROFILE=${{ matrix.profile }} forge test \
            --match-path "test/unit/*" \
            --gas-report \
            --json > test-results-${{ matrix.profile }}.json

      - name: Upload test results
        uses: actions/upload-artifact@v3
        with:
          name: test-results-${{ matrix.profile }}
          path: test-results-${{ matrix.profile }}.json

  integration-tests:
    name: Integration Tests
    runs-on: ubuntu-latest
    needs: unit-tests
    
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: recursive

      - name: Install Foundry
        uses: foundry-rs/foundry-toolchain@v1

      - name: Cache Foundry
        uses: actions/cache@v3
        with:
          path: |
            cache
            out
          key: foundry-${{ runner.os }}-integration-${{ hashFiles('foundry.toml') }}

      - name: Run integration tests
        run: |
          forge test \
            --match-path "test/integration/*" \
            --gas-report

  fuzz-tests:
    name: Fuzz Tests
    runs-on: ubuntu-latest
    needs: unit-tests
    
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: recursive

      - name: Install Foundry
        uses: foundry-rs/foundry-toolchain@v1

      - name: Run fuzz tests
        run: |
          forge test \
            --match-test "testFuzz_" \
            --fuzz-runs 10000

  invariant-tests:
    name: Invariant Tests
    runs-on: ubuntu-latest
    needs: unit-tests
    
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: recursive

      - name: Install Foundry
        uses: foundry-rs/foundry-toolchain@v1

      - name: Run invariant tests
        run: |
          forge test \
            --match-test "invariant_" \
            --invariant-runs 1000 \
            --invariant-depth 20

  fork-tests:
    name: Fork Tests
    runs-on: ubuntu-latest
    needs: unit-tests
    if: github.event_name == 'push' || github.event_name == 'schedule'
    
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: recursive

      - name: Install Foundry
        uses: foundry-rs/foundry-toolchain@v1

      - name: Run fork tests
        run: |
          forge test \
            --match-path "test/fork/*" \
            --fork-url ${{ secrets.MAINNET_RPC_URL }}
        env:
          MAINNET_RPC_URL: ${{ secrets.MAINNET_RPC_URL }}
          POLYGON_RPC_URL: ${{ secrets.POLYGON_RPC_URL }}

  coverage:
    name: Coverage
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests]
    
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: recursive

      - name: Install Foundry
        uses: foundry-rs/foundry-toolchain@v1

      - name: Install lcov
        run: sudo apt-get install -y lcov

      - name: Run coverage
        run: |
          forge coverage --report lcov
          lcov --remove lcov.info -o lcov.info \
            'test/*' \
            'script/*' \
            'lib/*'

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./lcov.info
          token: ${{ secrets.CODECOV_TOKEN }}

  gas-report:
    name: Gas Report
    runs-on: ubuntu-latest
    needs: unit-tests
    
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: recursive

      - name: Install Foundry
        uses: foundry-rs/foundry-toolchain@v1

      - name: Generate gas report
        run: |
          forge test --gas-report --json > gas-report.json

      - name: Compare gas usage
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const gasReport = JSON.parse(fs.readFileSync('gas-report.json', 'utf8'));
            
            // 分析 gas 使用情况并创建评论
            const comment = `## Gas Report\n\n${JSON.stringify(gasReport, null, 2)}`;
            
            if (context.eventName === 'pull_request') {
              github.rest.issues.createComment({
                issue_number: context.issue.number,
                owner: context.repo.owner,
                repo: context.repo.repo,
                body: comment
              });
            }

  security-analysis:
    name: Security Analysis
    runs-on: ubuntu-latest
    needs: unit-tests
    
    steps:
      - uses: actions/checkout@v4

      - name: Install Foundry
        uses: foundry-rs/foundry-toolchain@v1

      - name: Install Slither
        run: |
          pip3 install slither-analyzer
          pip3 install solc-select
          solc-select install 0.8.19
          solc-select use 0.8.19

      - name: Run Slither
        run: |
          slither . --json slither-report.json || true

      - name: Upload Slither report
        uses: actions/upload-artifact@v3
        with:
          name: slither-report
          path: slither-report.json

  deploy-testnet:
    name: Deploy to Testnet
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests, fuzz-tests]
    if: github.ref == 'refs/heads/develop'
    
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: recursive

      - name: Install Foundry
        uses: foundry-rs/foundry-toolchain@v1

      - name: Deploy to Sepolia
        run: |
          forge script script/Deploy.s.sol:Deploy \
            --rpc-url ${{ secrets.SEPOLIA_RPC_URL }} \
            --private-key ${{ secrets.SEPOLIA_PRIVATE_KEY }} \
            --broadcast \
            --verify \
            --etherscan-api-key ${{ secrets.ETHERSCAN_API_KEY }}
```

## 配置文件优化

### foundry.toml 多环境配置

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
test = "test"
cache_path = "cache"

solc_version = "0.8.19"
optimizer = true
optimizer_runs = 200
via_ir = false

verbosity = 2
fuzz = { runs = 256 }
invariant = { runs = 256, depth = 15 }

[profile.ci]
# CI 环境优化配置
optimizer = true
optimizer_runs = 1000
via_ir = true
verbosity = 4
fuzz = { runs = 10000 }
invariant = { runs = 1000, depth = 20 }

[profile.intense]
# 深度测试配置
fuzz = { runs = 50000 }
invariant = { runs = 5000, depth = 50 }

[profile.lite]
# 快速测试配置
fuzz = { runs = 100 }
invariant = { runs = 100, depth = 10 }

# RPC 端点配置
[rpc_endpoints]
mainnet = "${MAINNET_RPC_URL}"
sepolia = "${SEPOLIA_RPC_URL}"
polygon = "${POLYGON_RPC_URL}"
arbitrum = "${ARBITRUM_RPC_URL}"

# 以太扫描配置
[etherscan]
mainnet = { key = "${ETHERSCAN_API_KEY}" }
sepolia = { key = "${ETHERSCAN_API_KEY}" }
polygon = { key = "${POLYGONSCAN_API_KEY}", url = "https://api.polygonscan.com/" }

# 格式化配置
[fmt]
line_length = 120
tab_width = 4
bracket_spacing = true
int_types = "long"
```

## 自动化脚本

### 预提交钩子

```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "Running pre-commit checks..."

# 格式化检查
echo "Checking code formatting..."
if ! forge fmt --check; then
    echo "❌ Code formatting issues found. Run 'forge fmt' to fix."
    exit 1
fi

# 编译检查
echo "Building contracts..."
if ! forge build; then
    echo "❌ Build failed."
    exit 1
fi

# 运行快速测试
echo "Running quick tests..."
if ! forge test --match-path "test/unit/*" --gas-limit 30000000; then
    echo "❌ Unit tests failed."
    exit 1
fi

# 运行静态分析
if command -v slither &> /dev/null; then
    echo "Running Slither analysis..."
    if ! slither . --exclude-dependencies; then
        echo "⚠️  Slither found potential issues. Review before committing."
    fi
fi

echo "✅ All pre-commit checks passed!"
```

### 测试脚本

```bash
#!/bin/bash
# scripts/test.sh

set -e

# 解析命令行参数
PROFILE="default"
VERBOSE=""
PATTERN=""
COVERAGE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --profile)
            PROFILE="$2"
            shift 2
            ;;
        --verbose|-v)
            VERBOSE="-vvv"
            shift
            ;;
        --pattern|-p)
            PATTERN="--match-test $2"
            shift 2
            ;;
        --coverage|-c)
            COVERAGE=true
            shift
            ;;
        *)
            echo "Unknown option $1"
            exit 1
            ;;
    esac
done

echo "🔧 Using profile: $PROFILE"

# 设置环境变量
export FOUNDRY_PROFILE=$PROFILE

# 编译合约
echo "🏗️  Building contracts..."
forge build

# 运行测试
echo "🧪 Running tests..."
if [ "$COVERAGE" = true ]; then
    echo "📊 Running with coverage..."
    forge coverage $PATTERN $VERBOSE
else
    forge test $PATTERN $VERBOSE --gas-report
fi

echo "✅ Tests completed!"
```

### 部署脚本

```bash
#!/bin/bash
# scripts/deploy.sh

set -e

NETWORK=$1
VERIFY=${2:-false}

if [ -z "$NETWORK" ]; then
    echo "Usage: $0 <network> [verify]"
    echo "Networks: sepolia, mainnet, polygon"
    exit 1
fi

# 检查环境变量
case $NETWORK in
    sepolia)
        RPC_URL=$SEPOLIA_RPC_URL
        PRIVATE_KEY=$SEPOLIA_PRIVATE_KEY
        ETHERSCAN_KEY=$ETHERSCAN_API_KEY
        ;;
    mainnet)
        RPC_URL=$MAINNET_RPC_URL
        PRIVATE_KEY=$MAINNET_PRIVATE_KEY
        ETHERSCAN_KEY=$ETHERSCAN_API_KEY
        ;;
    polygon)
        RPC_URL=$POLYGON_RPC_URL
        PRIVATE_KEY=$POLYGON_PRIVATE_KEY
        ETHERSCAN_KEY=$POLYGONSCAN_API_KEY
        ;;
    *)
        echo "Unknown network: $NETWORK"
        exit 1
        ;;
esac

# 检查必需的环境变量
if [ -z "$RPC_URL" ] || [ -z "$PRIVATE_KEY" ]; then
    echo "Missing required environment variables for $NETWORK"
    exit 1
fi

echo "🚀 Deploying to $NETWORK..."

# 构建部署命令
DEPLOY_CMD="forge script script/Deploy.s.sol:Deploy \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --broadcast"

# 添加验证选项
if [ "$VERIFY" = "true" ] && [ -n "$ETHERSCAN_KEY" ]; then
    DEPLOY_CMD="$DEPLOY_CMD --verify --etherscan-api-key $ETHERSCAN_KEY"
fi

# 执行部署
eval $DEPLOY_CMD

echo "✅ Deployment completed!"
```

## GitLab CI 集成

### .gitlab-ci.yml 配置

```yaml
# .gitlab-ci.yml
image: ghcr.io/foundry-rs/foundry:latest

variables:
  GIT_SUBMODULE_STRATEGY: recursive

stages:
  - build
  - test
  - security
  - deploy

cache:
  paths:
    - cache/
    - out/

before_script:
  - forge --version

build:
  stage: build
  script:
    - forge build --sizes
  artifacts:
    paths:
      - out/
    expire_in: 1 hour

unit-tests:
  stage: test
  script:
    - forge test --match-path "test/unit/*" --gas-report
  coverage: '/Total coverage: (\d+\.\d+)%/'

integration-tests:
  stage: test
  script:
    - forge test --match-path "test/integration/*"
  only:
    - main
    - develop

fuzz-tests:
  stage: test
  script:
    - forge test --match-test "testFuzz_" --fuzz-runs 10000
  allow_failure: true

security-analysis:
  stage: security
  image: python:3.9
  before_script:
    - pip install slither-analyzer
  script:
    - slither . --json slither-report.json
  artifacts:
    reports:
      junit: slither-report.json
  allow_failure: true

deploy-testnet:
  stage: deploy
  script:
    - forge script script/Deploy.s.sol:Deploy --rpc-url $SEPOLIA_RPC_URL --private-key $SEPOLIA_PRIVATE_KEY --broadcast
  only:
    - develop
  environment:
    name: testnet
```

## 质量门控

### 质量检查脚本

```bash
#!/bin/bash
# scripts/quality-gate.sh

set -e

echo "🚪 Running quality gate checks..."

# 1. 代码覆盖率检查
echo "📊 Checking test coverage..."
COVERAGE=$(forge coverage --report summary | grep -oP 'Total coverage: \K[\d.]+')
COVERAGE_THRESHOLD=80

if (( $(echo "$COVERAGE < $COVERAGE_THRESHOLD" | bc -l) )); then
    echo "❌ Coverage $COVERAGE% is below threshold $COVERAGE_THRESHOLD%"
    exit 1
fi

echo "✅ Coverage: $COVERAGE%"

# 2. Gas 使用检查
echo "⛽ Checking gas usage..."
forge test --gas-report | tee gas-report.txt

# 检查是否有函数超过 gas 限制
if grep -q "FAIL.*gas" gas-report.txt; then
    echo "❌ Some functions exceed gas limits"
    exit 1
fi

# 3. 安全检查
echo "🔒 Running security checks..."
if command -v slither &> /dev/null; then
    slither . --exclude-dependencies --json slither-output.json
    
    # 检查是否有高危漏洞
    HIGH_ISSUES=$(jq '[.results.detectors[] | select(.impact == "High")] | length' slither-output.json)
    if [ "$HIGH_ISSUES" -gt 0 ]; then
        echo "❌ Found $HIGH_ISSUES high-impact security issues"
        exit 1
    fi
fi

# 4. 代码复杂度检查
echo "🧮 Checking code complexity..."
# 可以添加复杂度检查工具

echo "✅ All quality gate checks passed!"
```

### 自动化报告

```javascript
// scripts/generate-report.js
const fs = require('fs');
const path = require('path');

class TestReportGenerator {
    constructor() {
        this.report = {
            timestamp: new Date().toISOString(),
            summary: {},
            tests: [],
            coverage: {},
            gas: {},
            security: {}
        };
    }

    async generateReport() {
        console.log('📋 Generating test report...');
        
        await this.parseTestResults();
        await this.parseCoverageResults();
        await this.parseGasReport();
        await this.parseSecurityReport();
        
        this.writeReport();
        this.generateMarkdown();
        
        console.log('✅ Report generated successfully!');
    }

    async parseTestResults() {
        // 解析测试结果
        if (fs.existsSync('test-results.json')) {
            const results = JSON.parse(fs.readFileSync('test-results.json', 'utf8'));
            this.report.summary = {
                total: results.total,
                passed: results.passed,
                failed: results.failed,
                skipped: results.skipped
            };
        }
    }

    async parseCoverageResults() {
        // 解析覆盖率报告
        if (fs.existsSync('lcov.info')) {
            // 解析 LCOV 格式的覆盖率数据
            const lcovData = fs.readFileSync('lcov.info', 'utf8');
            this.report.coverage = this.parseLcov(lcovData);
        }
    }

    async parseGasReport() {
        // 解析 Gas 报告
        if (fs.existsSync('gas-report.json')) {
            const gasData = JSON.parse(fs.readFileSync('gas-report.json', 'utf8'));
            this.report.gas = gasData;
        }
    }

    async parseSecurityReport() {
        // 解析安全报告
        if (fs.existsSync('slither-output.json')) {
            const securityData = JSON.parse(fs.readFileSync('slither-output.json', 'utf8'));
            this.report.security = {
                high: securityData.results.detectors.filter(d => d.impact === 'High').length,
                medium: securityData.results.detectors.filter(d => d.impact === 'Medium').length,
                low: securityData.results.detectors.filter(d => d.impact === 'Low').length,
                info: securityData.results.detectors.filter(d => d.impact === 'Informational').length
            };
        }
    }

    writeReport() {
        fs.writeFileSync('test-report.json', JSON.stringify(this.report, null, 2));
    }

    generateMarkdown() {
        const markdown = `
# Test Report

**Generated:** ${this.report.timestamp}

## Summary
- **Total Tests:** ${this.report.summary.total || 0}
- **Passed:** ${this.report.summary.passed || 0}
- **Failed:** ${this.report.summary.failed || 0}
- **Skipped:** ${this.report.summary.skipped || 0}

## Coverage
- **Line Coverage:** ${this.report.coverage.lineRate || 'N/A'}%
- **Branch Coverage:** ${this.report.coverage.branchRate || 'N/A'}%

## Security Issues
- **High:** ${this.report.security.high || 0}
- **Medium:** ${this.report.security.medium || 0}
- **Low:** ${this.report.security.low || 0}
- **Info:** ${this.report.security.info || 0}

## Gas Usage
${this.generateGasTable()}
        `;

        fs.writeFileSync('test-report.md', markdown);
    }

    generateGasTable() {
        if (!this.report.gas.contracts) return 'No gas data available';

        let table = '| Contract | Function | Gas Used |\n|----------|----------|----------|\n';
        
        for (const [contract, functions] of Object.entries(this.report.gas.contracts)) {
            for (const [func, gas] of Object.entries(functions)) {
                table += `| ${contract} | ${func} | ${gas} |\n`;
            }
        }

        return table;
    }

    parseLcov(lcovData) {
        // 简化的 LCOV 解析
        const lines = lcovData.split('\n');
        let totalLines = 0;
        let coveredLines = 0;

        for (const line of lines) {
            if (line.startsWith('LF:')) {
                totalLines += parseInt(line.split(':')[1]);
            }
            if (line.startsWith('LH:')) {
                coveredLines += parseInt(line.split(':')[1]);
            }
        }

        return {
            lineRate: totalLines > 0 ? (coveredLines / totalLines * 100).toFixed(2) : 0
        };
    }
}

// 运行报告生成器
if (require.main === module) {
    const generator = new TestReportGenerator();
    generator.generateReport().catch(console.error);
}

module.exports = TestReportGenerator;
```

## 监控和通知

### Slack 通知集成

```yaml
# .github/workflows/notifications.yml
name: Test Notifications

on:
  workflow_run:
    workflows: ["Foundry Tests"]
    types: [completed]

jobs:
  notify:
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion != 'success' }}
    
    steps:
      - name: Notify Slack on failure
        uses: 8398a7/action-slack@v3
        with:
          status: failure
          channel: '#dev-alerts'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
          fields: repo,message,commit,author,action,eventName,ref,workflow
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

### 自定义通知脚本

```bash
#!/bin/bash
# scripts/notify.sh

STATUS=$1
MESSAGE=$2

# Discord Webhook 通知
send_discord_notification() {
    local webhook_url=$1
    local message=$2
    local color=$3

    curl -H "Content-Type: application/json" \
         -X POST \
         -d "{\"embeds\": [{\"color\": $color, \"description\": \"$message\"}]}" \
         "$webhook_url"
}

# 根据状态发送通知
case $STATUS in
    "success")
        send_discord_notification "$DISCORD_WEBHOOK" "✅ Tests passed: $MESSAGE" 65280
        ;;
    "failure")
        send_discord_notification "$DISCORD_WEBHOOK" "❌ Tests failed: $MESSAGE" 16711680
        ;;
    "warning")
        send_discord_notification "$DISCORD_WEBHOOK" "⚠️ Warning: $MESSAGE" 16776960
        ;;
esac
```

## 最佳实践

1. **分层测试**: 将不同类型的测试分别运行
2. **缓存优化**: 使用适当的缓存策略减少构建时间
3. **并行执行**: 利用并行能力加速测试
4. **质量门控**: 设置明确的质量标准
5. **自动报告**: 生成详细的测试报告
6. **通知机制**: 及时通知团队测试状态
7. **环境管理**: 正确管理不同环境的配置

## 下一步

完成 CI/CD 集成后，继续学习：

1. [安全测试](./08-security-testing.md)
2. [实战案例](./09-real-world-examples.md)
3. [故障排除](./10-troubleshooting.md)
