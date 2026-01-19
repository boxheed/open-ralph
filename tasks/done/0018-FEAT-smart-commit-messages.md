---
task_id: "FEAT-018"
validation_cmd: "npm test"
affected_files: ["src/services/git.service.js", "src/engine/loop.engine.js"]
---

# Objective: Implement Smart Commit Message Derivation

We need to replace the static "automated task resolution" commit message with a dynamic one derived from the task file. This should follow the Conventional Commits format: `type(scope): subject`.

## Heuristics for Derivation

### 1. Type (Heuristic from Filename)
The `type` should be derived from the task's filename (e.g., `0018-FEAT-smart-commit.md`):
- If the filename contains `FIX` or `BUG` -> `fix`.
- If the filename contains `TEST` -> `test`.
- If the filename contains `DOCS` -> `docs`.
- Default to `feat`.

### 2. Scope (From Frontmatter)
The `scope` must be the `task_id` defined in the frontmatter.

### 3. Subject (From Content)
The `subject` should be extracted using this priority:
1. **Objective Section:** The text immediately following a `# Objective` header.
2. **First H1:** The first `# Header` found in the file.
3. **Filename Fallback:** A humanized version of the filename (e.g., `run-single-task`).

**Constraints:**
- The subject must be truncated to 72 characters.
- If truncated, append `...` to the end.

## Acceptance Criteria
1. **Extraction Logic:** Implement a service or helper to parse the task file and extract these components.
2. **Commit Execution:** Update `LoopEngine` to pass this derived message to `GitService.commit()`.
3. **Formatting:** Ensure the final message looks like: `feat(FEAT-018): Implement Smart Commit Message Derivation`.
4. **Resilience:** If the Markdown is completely malformed, it should gracefully fall back to a humanized filename.

## Success Criteria
- A task named `0015-FIX-logic-error.md` with `task_id: "L-01"` results in: `fix(L-01): ...`
- Unit tests verify the parsing logic for various Markdown structures and filenames.


## Results
- Status: DONE
### Attempt 1
YOLO mode is enabled. All tool calls will be automatically approved.
Loaded cached credentials.
[ERROR] [IDEClient] Failed to connect to IDE companion extension. Please ensure the extension is running. To install the extension, run /ide install.
I will begin by examining the current implementation of `src/engine/loop.engine.js` and `src/services/git.service.js` to understand how commits are currently handled.
I will now examine `src/services/task.repository.js` to understand how task data is structured and loaded.
I will read `src/services/git.service.test.js` to understand the testing patterns used in the project.
I will create `src/services/task.msg.service.test.js` and implement the tests for the commit message derivation logic.
I will now implement the `deriveCommitMessage` function in `src/services/task.msg.service.js` based on the specified heuristics.
I will now run the tests to ensure that the `deriveCommitMessage` function is working correctly.
I will refine the `deriveType` and `humanizeFilename` functions in `src/services/task.msg.service.js` to correctly handle the filename structure and avoid false positives.
I will now re-run the tests for `TaskMsgService` to verify that the fixes have resolved the previous failures.
I will examine `bin/ralph.js` to see how `LoopEngine` is instantiated and determine where to integrate the `TaskMsgService`.
I will read `src/engine/loop.engine.test.js` to see the existing tests and determine how to verify the integration of the dynamic commit message derivation.
I will update `src/engine/loop.engine.js` to import `deriveCommitMessage` from `task.msg.service` and use it in `_commitTask`.
I will now update the `_commitTask` method in `src/engine/loop.engine.js` to call `deriveCommitMessage(task)` instead of using the hardcoded message.
I will add a new test case to `src/engine/loop.engine.test.js` to verify that `LoopEngine` correctly uses the derived commit message when a task is completed.
I will now run all the tests in the project to ensure that the changes haven't introduced any regressions and that the new feature is working as expected.
I will refine the `deriveCommitMessage` function in `src/services/task.msg.service.js` to omit the scope parentheses if `task_id` is not present, following standard Conventional Commits practice.
I will update the test case for missing `task_id` in `src/services/task.msg.service.test.js` to reflect the change where parentheses are omitted when the scope is empty.
I will run the tests once more to confirm that the changes to scope handling and the corresponding test update are correct.
I have implemented dynamic commit message derivation for Ralph. The commit message is now automatically generated based on the task's filename (type), frontmatter (scope/task_id), and content (subject).

### Changes:
- **New Service:** `src/services/task.msg.service.js` handles the logic for extracting `type`, `scope`, and `subject` from task files using the specified heuristics.
- **Engine Update:** `LoopEngine` now utilizes `deriveCommitMessage` to generate conventional commit messages (e.g., `feat(FEAT-018): Implement Smart Commit Message Derivation`) when a task is completed.
- **Testing:** Added comprehensive unit tests in `src/services/task.msg.service.test.js` covering various filename formats, content structures, and truncation rules. Also added an integration test in `src/engine/loop.engine.test.js`.
- **Formatting:** Subjects are truncated to 72 characters with `...` appended if necessary. If no headers are found, the service falls back to a humanized version of the filename.

All 100 tests in the project are passing.
