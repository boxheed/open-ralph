---
task_id: "SAFETY-005"
validation_cmd: "npm test"
affected_files: "src/services/git.service.js, src/services/ai.service.js"
---

# Objective: Add Timeouts to External Processes

The agent calls external processes (Gemini CLI, Git, Validation commands) without explicit timeouts. If a command hangs (e.g., a test suite that deadlocks), the agent will hang indefinitely.

We need to add safety timeouts to `spawn` and `execSync` calls.

## Implementation Steps
1.  Update `GitService` to accept a `timeout` option in `runValidation`.
2.  Update `AiService` to handle timeouts in the `spawn` process (kill the child if it takes too long).
3.  Expose these timeout values in the configuration (defaulting to reasonable values, e.g., 5 minutes for validation, 2 minutes for AI).

## Success Criteria
1.  A hanging validation command throws an error after the timeout.
2.  Unit tests verify that the timeout logic triggers correctly.
