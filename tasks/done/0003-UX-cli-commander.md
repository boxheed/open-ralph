---
task_id: "UX-003"
validation_cmd: "npm test"
affected_files: "bin/ralph.js, package.json"
---

# Objective: Improve CLI Argument Parsing

The current CLI parsing in `bin/ralph.js` uses raw `process.argv` checks (e.g., `includes('--interactive')`). This is brittle and doesn't support help text, version info, or complex flags well.

We should migrate to a robust library like `commander` or `yargs`.

## Implementation Steps
1.  Install `commander` or `yargs`.
2.  Refactor `bin/ralph.js` to define the CLI program:
    *   Command: `run` (default).
    *   Option: `-i, --interactive` (Enable interactive mode).
    *   Option: `-c, --config <path>` (Path to config file, optional).
3.  Ensure `--help` works and displays usage instructions.

## Success Criteria
1.  Running `ralph --help` shows proper documentation.
2.  The existing functionality (running tasks) works with the new parser.
3.  `--interactive` flag is correctly recognized.


## Results
- Status: ./tasks/done

**Summary of Changes:**
1.  **Refactored `bin/ralph.js`**: Integrated `commander` for robust CLI argument parsing. Added `-i/--interactive` and `-c/--config` flags.
2.  **Updated `src/services/config.service.js`**: Modified `loadConfig` to accept an explicit configuration file path.
3.  **Dependencies**: Added `commander` to `package.json`.

**Verification:**
-   Verified `ralph --help` outputs correct usage.
-   Verified `ralph run` executes the loop (and detects dirty git state).
-   Ran `npm test` to ensure no regressions.
