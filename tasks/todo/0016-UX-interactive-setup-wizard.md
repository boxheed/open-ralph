---
task_id: 0016
affected_files:
  - bin/ralph.js
  - src/services/setup.service.js
  - package.json
  - ralph.config.js
validation_cmd: npm test
provider: gemini
model: gemini-3-flash-preview
---

# Interactive Setup Wizard & Auto-Trigger

Implement a user-friendly, interactive selection process for AI providers and enable the CLI to automatically trigger this wizard when run for the first time in an interactive environment.

## Functional Requirements

### 1. Interactive Provider Selection
- Integrate `@inquirer/prompts` to create a CLI selection menu.
- **Provider Discovery:** The wizard should list all available providers (Built-in + User-defined).
- **Selection:** When a user selects a provider, write it to `ralph.config.js` in the current directory.

### 2. Auto-Trigger (Option B)
- Update `bin/ralph.js` "Smart Entry" logic:
    - If `provider` is missing AND the environment is interactive (TTY) AND not CI:
        - Print: `Welcome to Ralph! It looks like you haven't configured an AI provider yet.`
        - Automatically trigger the `setup` wizard.
        - After setup completes successfully, proceed to run the task loop (if tasks exist).

### 3. Headless Setup Support
- Enhance the `setup` command to support non-interactive flags:
    - `ralph setup --provider aider --model gpt-4`
- This allows CI/automation to initialize the environment without the wizard.

## Non-Functional Requirements
- **Dependency Management:** Add `@inquirer/prompts` to `package.json` dependencies.
- **Idempotency:** The wizard should be able to update an existing `ralph.config.js` without corrupting other settings.

## Acceptance Criteria
- [ ] Running `ralph` in a fresh directory (locally) triggers the provider selection menu.
- [ ] Selecting a provider correctly creates/updates `ralph.config.js`.
- [ ] `ralph setup --provider name` works without user interaction.
- [ ] The user can cancel the wizard (Ctrl+C) and be informed how to run it later.
