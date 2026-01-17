---
task_id: "ARCH-002"
validation_cmd: "npm test"
affected_files: "bin/ralph.js, src/config.js"
---

# Objective: Implement Configuration Management

Currently, configuration values such as directory paths (`tasks/todo`, etc.) and retry limits are hardcoded in `bin/ralph.js` and `src/engine/loop.engine.js`. This makes the agent inflexible and hard to customize for different projects.

We need to implement a configuration loader that can read from a config file (e.g., `ralph.config.js` or `.ralphrc`) or fall back to sensible defaults.

## Implementation Steps
1.  Create a new service `src/services/config.service.js` or a module `src/config.js`.
2.  Define default values:
    *   Task Directories (`todo`, `done`, `failed`).
    *   Retry Limit (default: 3).
    *   Model Name (if applicable).
3.  Update `bin/ralph.js` to load this config and pass it to the engine.
4.  Refactor `loop.engine.js` to use the passed configuration instead of hardcoded constants.

## Success Criteria
1.  A configuration module exists.
2.  `ralph` can still run without a config file (using defaults).
3.  Unit tests verify that values are correctly loaded.
