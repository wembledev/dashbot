# Run All Tests

user-invocable: true
allowed-tools: Bash

## Description

Runs all test suites and security scans in parallel, then summarizes the combined results.

## Steps

1. **Run all suites and scans in parallel** using the Bash tool:

   - Rails tests: `bin/rails test`
   - System tests: `bin/rails test:system`
   - Frontend tests: `npm test`
   - Security scan: `bin/brakeman --no-pager`
   - Gem audit: `bin/bundler-audit`

   Launch all five commands simultaneously using parallel Bash tool calls.

2. **Summarize results** after all complete:

   - Report pass/fail counts for each suite
   - Report warnings/vulnerabilities for each scan
   - List any failures with file and test name
   - Give an overall pass/fail status

## Output Format

```
## Test Results

### Rails (Minitest)
X tests, Y assertions, Z failures, W errors

### System Tests (Selenium)
X tests, Y assertions, Z failures, W errors

### Frontend (Vitest)
X tests passed, Y failed

### Security
- Brakeman: X warnings
- Bundler Audit: X vulnerabilities

### Overall: PASS / FAIL
```

If there are failures, include the failure details (test name, file, error message) beneath each section.
