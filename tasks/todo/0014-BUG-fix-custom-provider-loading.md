---
task_id: 0014
affected_files:
  - src/services/config.service.js
  - src/services/config.service.test.js
  - src/services/ai.service.test.js
validation_cmd: npm test
provider: qwen
---

# Fix Custom Provider Loading

Users report that creating a custom provider in `.ralph/providers/` does not work as expected. The system fails to recognize or load the custom module.

## Investigation & Requirements

1.  **Path Resolution:**
    - Verify `config.service.js` correctly resolves the path to `.ralph/providers`.
    - Ensure `require()` works for these dynamic paths (absolute paths are preferred).

2.  **Naming Convention:**
    - The system should register the provider using the `name` property exported by the module, NOT the filename (though they should ideally match).
    - If the user configures `provider: "my-ai"`, the loaded provider object must have `name: "my-ai"`.

3.  **Error Handling:**
    - If a custom provider fails to load (syntax error, missing deps), the system should warn but not crash the entire config loader. It should just skip that provider.

## Reproduction Steps (Test Case)
1.  Create a temporary file `.ralph/providers/test-custom.js` that exports:
    ```javascript
    module.exports = {
        name: "custom-test",
        build: (prompt) => ({ command: "echo", args: ["custom", prompt] })
    };
    ```
2.  Run `loadConfig()` and verify `providers['custom-test']` exists.
3.  Run `ai.service` with `provider: "custom-test"` and verify it executes the custom logic.

## Acceptance Criteria
- [ ] Integration test added that simulates a user-defined provider.
- [ ] `config.service.js` correctly loads user providers.
- [ ] Documentation (README) verified to match the implementation.
