---
task_id: 0015
affected_files:
  - src/services/config.service.js
  - src/services/ai.service.js
  - bin/ralph.js
  - src/services/config.service.test.js
  - src/services/ai.service.test.js
validation_cmd: npm test
provider: gemini
---

# Config Hardening & CI Safety

Remove the global default AI provider to ensure neutrality and enforce explicit setup. Implement safety checks to distinguish between interactive user environments and headless/CI environments.

## Functional Requirements

### 1. Remove Global Default Provider
- Update `src/services/config.service.js` to remove `provider: "gemini"` from `DEFAULTS`.
- The default `provider` should now be `null` or `undefined`.

### 2. Environment-Aware Error Handling
- Update `bin/ralph.js` to detect if the environment is non-interactive (e.g., `process.env.CI`, `process.env.HEADLESS`, or `!process.stdout.isTTY`).
- **Headless Behavior:** If no provider is configured, the CLI must exit with code `1` and log a specific error: `Error: No AI provider configured. In CI/Headless environments, please provide a config file or use environment variables.`
- **Interactive Behavior:** For now, if no provider is configured, log a warning: `No AI provider configured. Run 'ralph setup' to initialize.` (This will be replaced by the Auto-Wizard in Task 0016).

### 3. Core Hardening in AI Service
- Update `src/services/ai.service.js` to throw a clear error if `callAI` is invoked without a valid provider configuration.

## Non-Functional Requirements
- **Test Compatibility:** Many existing unit tests rely on the `gemini` default. Update these tests to explicitly mock or inject a provider in their configurations to ensure they remain isolated from global defaults.
- **Error Codes:** Ensure all "Missing Configuration" exits use exit code `1`.

## Acceptance Criteria
- [ ] `loadConfig()` returns `provider: undefined` if no user config exists.
- [ ] Running `ralph` in a CI environment without a config file results in a non-zero exit code and a clear error message.
- [ ] Unit tests for `ai.service` and `config.service` are updated and passing.
- [ ] No regression in existing provider logic (if a provider IS configured, it works as before).
