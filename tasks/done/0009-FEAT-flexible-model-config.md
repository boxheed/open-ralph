---
task_id: 0009
affected_files:
  - src/services/ai.service.js
  - src/services/config.service.js
  - README.md
  - src/services/ai.service.test.js
  - src/services/config.service.test.js
validation_cmd: npm test
---

# Flexible Model Configuration

Update the model configuration strategy to prioritize CLI-native defaults and make the model setting optional. The system should no longer enforce a global model configuration and must gracefully handle scenarios where no model is explicitly defined.

## Functional Requirements

1.  **Optional Global Model**:
    - The `model` property in `ralph.config.js` and `DEFAULTS` should be strictly optional.
    - Remove any logic that hard-fails or throws an error if a model is not configured globally.

2.  **"No Model" Handling & Template Injection**:
    - The `ai.service.js` must robustly handle cases where the resolved model is `null`, `undefined`, or an empty string.
    - When resolving the command template:
        - If `{model}` is present in the template but the resolved model value is empty/null, the system must handle this gracefully.
        - **Strategy:** If the resolved model is empty, the `{model}` placeholder (and potentially its flag, e.g., `--model {model}`) should be removed or replaced with an empty string, ensuring the resulting shell command is valid and well-formed.
        - *Note:* Ideally, templates should be robust, but the code should prevent executing `cli --model ""` if possible, or reliance on the user to format templates correctly if the model is optional.

3.  **Hierarchy of Precedence**:
    - The system must respect the following order of operations for determining the model:
        1.  **Task Frontmatter:** (Highest priority)
        2.  **Provider Default:** (From provider definition)
        3.  **Global Config:** (From `ralph.config.js`)
        4.  **CLI Native Default:** (Lowest priority - implies no explicit model argument passed)

## Non-Functional Requirements

1.  **Test Coverage**:
    - **Unit Tests:** New tests must be added to `src/services/ai.service.test.js` and `src/services/config.service.test.js`.
    - **Scenarios:**
        - Verify execution when `model` is undefined (check command string generation).
        - Verify execution when `model` is defined in task frontmatter (override works).
        - Verify execution when `model` is defined in global config.
    - Existing tests must pass without regression.

2.  **Documentation**:
    - Update `README.md` to reflect that the `model` configuration is now optional.
    - Clarify the precedence rules in the "Configuration" section.

3.  **Code Quality**:
    - Code must adhere to existing ESLint/formatting standards.
    - No new console warnings should be introduced during normal operation.

## Acceptance Criteria

- [ ] `config.service.js` successfully loads without a `model` property.
- [ ] `ai.service.js` constructs a valid command string when no model is provided.
- [ ] `ai.service.js` correctly prioritizes Task Frontmatter > Provider Default > Global Config.
- [ ] Unit tests for `ai.service.js` and `config.service.js` are implemented and passing.
- [ ] `README.md` is updated to explain the optional nature of model configuration.


## Results
- Status: ./tasks/done
### Attempt 1
YOLO mode is enabled. All tool calls will be automatically approved.
Loaded cached credentials.
[ERROR] [IDEClient] Failed to connect to IDE companion extension. Please ensure the extension is running. To install the extension, run /ide install.
I will begin by reading the configuration and AI service files, along with their tests and the README, to understand the current implementation of model handling and command generation.
I will read the provider files for `gemini`, `aider`, and `qwen-code` to understand their command templates and how they incorporate the `{model}` placeholder. This will verify if I need to adjust the templates or if the cleaning logic in `ai.service.js` will be sufficient.
I will read the remaining provider files to check for `{model}` usage in their command templates and identify which ones need updating to support the flexible model configuration.
I will create a reproduction script `repro_ai_service.js` to test the current behavior of `ai.service.js` with and without a model. This will help confirm the current limitations and verify the "No Model" handling logic once implemented.
I will execute the reproduction script using `node` to observe the output and confirm the current behavior of the `ai.service.js` logic.
I will now update `src/services/ai.service.js` to implement the flexible model configuration. I'll modify the `callAI` function to intelligently handle the `{model}` placeholder: if a model is resolved, it will be substituted; if not, I'll remove the placeholder and any associated flags (like `--model` or `-m`) to ensure a clean command string.
I will now update `src/services/providers/gemini.js`. I'll modify the command template to include the `--model {model}` flag and remove the `defaultModel` property. This aligns the provider with the new flexible configuration system, allowing the model to be specified dynamically or fall back to the CLI's default if omitted.
I will execute the `repro_ai_service.js` script again using `node`. This will allow me to verify that the changes to `ai.service.js` correctly handle the model configuration scenarios, specifically checking if the `{model}` placeholder and flag are properly removed when no model is provided.
I will now update `src/services/ai.service.test.js` to include new test cases. These tests will verify that the `{model}` placeholder and its associated flags are correctly removed when no model is provided, and that the command string is constructed correctly with varying whitespace scenarios. This ensures the robustness of the "No Model" handling logic.
I will now update `src/services/config.service.test.js` to include a test case that specifically verifies `loadConfig` functions correctly when the `model` property is absent from the configuration. This ensures that the system respects the optional nature of the model configuration as per the new requirements.
I will execute the project's tests using `npm test` to verify that the changes to the configuration and AI services, including the new test cases, are functioning as expected and that no regressions have been introduced.
I will update the `README.md` file to reflect the changes in model configuration. I'll modify the "Configuration" section to explain that the `model` setting is now optional, detail the new precedence rules (Task Frontmatter > Provider Default > Global Config > CLI Native Default), and update the examples to show conditional `{model}` usage.
I will remove the `repro_ai_service.js` file now that I have verified the changes and completed the task.
I have successfully implemented the "Flexible Model Configuration" as requested.

**Summary of Changes:**

1.  **Codebase Updates:**
    -   **`src/services/ai.service.js`**: Updated `callAI` to intelligently handle model resolution. It now prioritizes `Frontmatter > Provider Default > Global Config`. Crucially, if no model is resolved, it actively sanitizes the command string by removing `{model}` placeholders and associated flags (e.g., `--model {model}`, `-m {model}`), allowing the underlying CLI tool to use its native default.
    -   **`src/services/providers/gemini.js`**: Updated the Gemini provider to include `{model}` in its command template (`gemini {prompt} --yolo --model {model}`) and removed the hardcoded `defaultModel`. This enables the new "CLI Native Default" behavior.
    -   **`src/services/config.service.js`**: Verified that no validation logic enforces the presence of a global model.

2.  **Testing:**
    -   **`src/services/ai.service.test.js`**: Added comprehensive unit tests to verify:
        -   Flag removal logic (`--model` and `-m`).
        -   Precedence rules (Frontmatter vs Provider vs Global).
        -   Whitespace cleanup.
    -   **`src/services/config.service.test.js`**: Added a test to explicitly verify that `loadConfig` succeeds without a `model` property.
    -   All existing and new tests passed.

3.  **Documentation:**
    -   **`README.md`**: Updated the "Configuration" section to document the optional nature of the `model` setting, the specific precedence order, and the "No Model" handling behavior.

The system now supports optional model configuration with a robust fallback to CLI-native defaults.

I will create a new commit with the message `feat: make model configuration optional and support CLI-native defaults` to save my changes, which include making the model configuration optional, adding support for CLI-native defaults, updating the precedence rules, and adding relevant tests and documentation.
The implementation of "Flexible Model Configuration" is complete. The system now supports optional model configuration, gracefully defaulting to the underlying CLI's preferences when no model is explicitly defined.

**Key Changes:**
*   **Optional Model:** The `model` configuration in `ralph.config.js` is now strictly optional.
*   **Smart Command Generation:** `ai.service.js` has been updated to robustly handle the "No Model" scenario. If no model is resolved, it actively cleans the command string by removing `{model}` placeholders and associated flags (e.g., `--model`, `-m`).
*   **CLI-Native Defaults:** The `gemini` provider has been updated to use the standard `--model {model}` flag but without a hardcoded default in the wrapper, allowing it to fall back to the global config or the CLI's own default.
*   **Precedence Rules:** The system strictly follows the hierarchy: Task Frontmatter > Provider Default > Global Config > CLI Native Default.

**Verification:**
*   **Unit Tests:** New tests in `src/services/ai.service.test.js` verify flag removal logic, precedence rules, and correct command construction. `src/services/config.service.test.js` confirms the configuration loader accepts missing model properties.
*   **Documentation:** `README.md` has been updated to reflect the new configuration options and precedence rules.

**Next Steps:**
*   Users can now remove `model` from their `ralph.config.js` if they wish to use provider defaults.
*   Custom providers in `.ralph/providers` can be updated to utilize the `{model}` placeholder if they wish to support dynamic model switching.

The changes have been committed to the repository.
