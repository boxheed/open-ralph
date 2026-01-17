---
task_id: 0007
affected_files:
  - src/services/ai.service.js
  - src/engine/loop.engine.js
  - src/services/config.service.js
validation_cmd: npm test
---

# Support Multiple AI Coding Assistants

Currently, the agent is hardcoded to use the `gemini` CLI. We need to generalize the AI service to support various coding assistants (aider, github copilot, forge, nanocoder, cline, opencode, qwen-code, etc.) while allowing for extensibility.

## Requirements

1. **Provider Selection**:
   - Add a `provider` field to the YAML front matter of tasks (e.g., `provider: aider`).
   - Allow a global default provider in `ralph.config.js`.
   - Task-level provider overrides the global default.

2. **Command Configuration**:
   - Implement a template-based command execution system in `ai.service.js`.
   - Define sensible default command templates for each supported provider.
   - Allow users to override these templates in the configuration (e.g., `providers: { aider: { command: "aider --model {model} --message {prompt}" } }`).

3. **Extensibility**:
   - The system should make it easy to add new providers by simply adding a new command template.
   - Use placeholders like `{prompt}`, `{model}`, and `{files}` in the templates.

4. **Backward Compatibility**:
   - Maintain `gemini` as the default provider if none is specified, ensuring existing tasks continue to work.

## Acceptance Criteria

- [ ] `ai.service.js` is refactored to handle generic command execution based on templates.
- [ ] `loop.engine.js` correctly extracts and passes the `provider` from front matter.
- [ ] `config.service.js` includes default templates for common tools.
- [ ] Tests verify that different providers can be invoked with their specific flags.
- [ ] Documentation (README) is updated to reflect how to configure and use different providers.
