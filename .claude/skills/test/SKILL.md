# Run All Tests

user-invocable: true
allowed-tools: Bash

## Description

Runs both the Rails and frontend test suites in parallel, then summarizes the combined results.

## Steps

1. **Run both test suites in parallel** using the Bash tool:

   - Rails tests: `bin/rails test`
   - Frontend tests: `npm test`

   Launch both commands simultaneously using parallel Bash tool calls.

2. **Summarize results** after both complete:

   - Report pass/fail counts for each suite
   - List any failures with file and test name
   - Give an overall pass/fail status

## Output Format

```
## Test Results

### Rails (Minitest)
X tests, Y assertions, Z failures, W errors

### Frontend (Vitest)
X tests passed, Y failed

### Overall: PASS / FAIL
```

If there are failures, include the failure details (test name, file, error message) beneath each section.
