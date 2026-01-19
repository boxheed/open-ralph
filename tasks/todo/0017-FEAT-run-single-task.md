---
task_id: "FEAT-017"
validation_cmd: "npm test"
affected_files: ["bin/ralph.js", "src/engine/loop.engine.js"]
---

# Objective: Implement Single Task Execution Flag

Currently, Ralph always processes all tasks found in the `tasks/todo` directory in alphabetical order. While this is great for automation, it makes debugging or iterating on a specific task difficult. 

We need to add a command-line flag to the `run` command (the default command) that allows a user to target a single specific task file.

## User Story
As a developer, I want to execute a specific task file (e.g., `05_fix_bugs.md`) by name so that I can iterate quickly on a single problem without waiting for the entire queue.

## Acceptance Criteria
1.  **New Flag:** Add a `--task <filename>` (or `-t <filename>`) option to the `ralph run` command.
2.  **Targeted Execution:** When this flag is provided, Ralph should ignore all other files in `tasks/todo` and only execute the specified file.
3.  **Path Resolution:** The user should be able to provide just the filename (e.g., `01-test.md`). Ralph should look for it in the configured `todo` directory.
4.  **Error Handling:** If the specified file does not exist in the `todo` directory, Ralph should log an error and exit with a non-zero code.
5.  **Backward Compatibility:** If the flag is NOT provided, Ralph must continue its default behavior of running all tasks in the `todo` directory.

## Success Criteria
- Running `ralph --task your-task.md` only executes that task.
- Running `ralph` still executes all tasks.
- A unit test verifies the `LoopEngine.runTask` is called correctly when a specific file is targeted.
