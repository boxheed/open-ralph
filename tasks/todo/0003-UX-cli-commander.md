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
