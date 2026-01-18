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
