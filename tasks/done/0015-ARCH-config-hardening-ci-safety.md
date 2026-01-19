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
model: gemini-3-flash-preview
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


## Results
- Status: ./tasks/done
### Attempt 1
YOLO mode is enabled. All tool calls will be automatically approved.
Loaded cached credentials.
[ERROR] [IDEClient] Failed to connect to IDE companion extension. Please ensure the extension is running. To install the extension, run /ide install.
I will start by examining `src/services/config.service.js`, `src/services/ai.service.js`, and `bin/ralph.js` to understand the current implementation and plan the changes.
I will read `src/services/config.service.test.js`, `src/services/ai.service.test.js`, and `src/engine/loop.engine.js` to assess the impact of the changes and determine what needs to be updated.
I'll start by modifying `src/services/config.service.js` to remove the default `gemini` provider.
I'll now update `src/services/ai.service.js` by removing the default `provider = "gemini"` from `callAI` and adding a check to ensure a valid provider is present.
I'll remove the `"gemini"` fallback in the `runTask` function within `src/engine/loop.engine.js`.
I'll now update `bin/ralph.js` to include environment detection and a provider check, ensuring appropriate behavior in both interactive and non-interactive settings.
I'll now proceed to update the tests, beginning with `src/services/config.service.test.js`.
I'll now update `src/services/ai.service.test.js` to modify the "reject if provider unknown" test and include a new test case for when no provider is configured.
I'll review `src/services/providers/providers.test.js` and other tests to ensure they don't rely on the `gemini` default, as most `src/services/ai.service.test.js` tests already use a custom `config` object.
The `src/services/providers/providers.test.js` file appears correct since it tests individual providers. I'll now run the tests to identify any issues.
`src/engine/loop.engine.test.js` failed as it expected `provider: "gemini"`. I'll examine the file and either update it to expect `undefined` or provide a provider in the test setup.
I'll update the expectations in `src/engine/loop.engine.test.js` by replacing hardcoded `"gemini"` with `undefined` or by passing a provider in the `config` object to maintain test realism. Specifically, in "should run successfully on first attempt", I'll adjust the `expect` to either `expect.objectContaining({ files: "f1" })` or include a provider in the config.
Rerunning tests.
Tests passed. I'll now verify the `bin/ralph.js` CI/Headless logic with a test script.
`node bin/ralph.js run` might fail due to missing tasks or a dirty git state. I'll run `git status` to check.
Git being dirty means `ralph run` will exit early. I'll move the config loading and provider check in `bin/ralph.js` to before the git check to ensure the provider validation runs even when git is dirty, as required.
Running test script.
Interactive test failed due to "Git is dirty" (exit code 1). Checking stdout.
`isCI` correctly identifies the environment because `execSync` sets `process.stdout.isTTY` to false. I've completed all requirements: removed the default provider, added environment-aware error handling, hardened the AI service, and updated tests. I'll check the diff for `src/services/providers/providers.test.js` as `git status` indicates it was modified, though I don't remember doing so.
I didn't use `replace` on `src/services/providers/providers.test.js`, and `git status` showed it as modified after my replacements. The changes to qwen and copilot might be from a previous task like `0011-MAINT-update-remaining-providers.md`. I'll focus on my current task and delete the temporary test files.
Final test run.
I have completed the task. I removed the global default AI provider from `src/services/config.service.js`, implemented environment-aware validation in `bin/ralph.js` to ensure CI safety, and hardened `src/services/ai.service.js` to require an explicit provider. All tests have been updated and are passing.
