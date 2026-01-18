---
task_id: 0008
affected_files:
  - src/services/config.service.js
  - src/engine/loop.engine.js
  - src/services/ai.service.js
validation_cmd: npm test
---

# Custom Model Configuration

Establish a robust and configurable system for defining the AI model to be used during task execution. This system must support global defaults and granular overrides at the task level, integrating seamlessly with the multi-provider template system.

## Requirements

1. **Global Model Configuration**:
   - Ensure `config.service.js` supports a top-level `model` property.
   - This property should serve as the fallback if no model is specified in the task front matter.

2. **Task-Level Model Override**:
   - Support a `model` field in the YAML front matter of task files (e.g., `model: gemini-1.5-pro`).
   - The task-level model must take precedence over the global default.

3. **Template Integration**:
   - The selected model string must be provided to the `ai.service.js` for injection into provider command templates (using the `{model}` placeholder defined in task 0007).
   - If a provider's template does not include the `{model}` placeholder, the model configuration should still be tracked but will effectively be ignored for that specific provider's execution.

4. **Sensible Defaults**:
   - The system should maintain a sensible default model (e.g., `gemini-1.5-flash`) to ensure out-of-the-box functionality.

## Acceptance Criteria

- [ ] Global `model` configuration is correctly loaded from `ralph.config.js`.
- [ ] Task files can successfully override the model via YAML front matter.
- [ ] The resolved model is passed to the AI service.
- [ ] Tests verify the priority of task-level overrides over global defaults.
- [ ] Logic is in place to handle cases where a model is not specified (fallback to default).
