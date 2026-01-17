---
task_id: "QUALITY-004"
validation_cmd: "npm test"
affected_files: "src/services/logger.service.js, src/engine/loop.engine.js"
---

# Objective: Implement Structured Logging

The application currently relies on `console.log` and `console.error` scattered throughout the codebase. This makes it hard to control output verbosity (e.g., debug vs. info) or format logs for machine reading.

We should implement a simple Logger service.

## Implementation Steps
1.  Create `src/services/logger.service.js`.
2.  Support levels: `debug`, `info`, `warn`, `error`.
3.  Inject this service into `loop.engine.js` (following the new DI pattern).
4.  Replace `console.log` calls in the engine with `logger.info`, etc.

## Success Criteria
1.  No direct `console.log` calls in `src/engine/loop.engine.js`.
2.  The logger is injectable and testable.
