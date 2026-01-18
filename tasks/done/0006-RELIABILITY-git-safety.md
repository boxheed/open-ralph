---
task_id: "RELIABILITY-006"
validation_cmd: "npm test"
affected_files: "src/services/git.service.js"
---

# Objective: Improve Git Safety

Currently, `GitService.commit()` runs `git add .`, which stages *everything* in the directory. This is dangerous as it might include accidental changes or untracked files that shouldn't be part of the commit.

We should be more selective or provide a way to scope what gets committed.

## Implementation Steps
1.  Update `GitService.commit()` to accept an optional `paths` argument (array of strings).
2.  If `paths` is provided, only `git add` those specific files.
3.  Update the engine to pass the `affected_files` list (from the task markdown) to the commit method, ensuring only relevant files are committed.
4.  (Optional) Ensure the task file itself is also added to the commit list.

## Success Criteria
1.  `GitService.commit(['src/foo.js'])` only stages `src/foo.js`.
2.  The loop engine passes the correct file list.


## Results
- Status: ./tasks/done
### Attempt 1
YOLO mode is enabled. All tool calls will be automatically approved.
Loaded cached credentials.
[ERROR] [IDEClient] Failed to connect to IDE companion extension. Please ensure the extension is running. To install the extension, run /ide install.
I will read `src/services/git.service.js` and `src/engine/loop.engine.js` to understand the current implementation.
I will read `src/services/git.service.test.js` to understand how to verify the changes.
I will read `src/engine/loop.engine.test.js` to see how to test the loop engine changes.
I will update `src/services/git.service.js` to accept the `paths` argument in the `commit` method. If `paths` are provided, I will add only those files; otherwise, I will default to adding all files. I will also make sure to quote the paths to handle spaces correctly.
I will update `src/services/git.service.test.js` to verify that `commit` correctly handles the `paths` argument. I'll add a test case to ensure that when `paths` are provided, `git add` is called with the specific files, and when not provided, it defaults to `git add .`.
I will run the tests to verify that the changes to `GitService` are working as expected.
I will read `src/engine/loop.engine.js` again to ensure I have the correct context for implementing the file commitment logic.
I will modify `src/engine/loop.engine.js` to determine the specific files to commit, including the moved task file and any affected files specified in the data. Then, I'll update the `gitService.commit` call to pass these files.
I will re-read `src/engine/loop.engine.test.js` to check if I need to update any test expectations regarding `gitService.commit`.
I will add two new test cases to `src/engine/loop.engine.test.js` to verify that `gitService.commit` is called with the correct file list, handling both array and comma-separated string formats for `affected_files`, along with the moved task file.
I will run the tests again to verify the `LoopEngine` changes.
I will run all the tests one last time to ensure everything is working correctly.
I have completed the task.
1.  **Modified `src/services/git.service.js`**: The `commit` method now accepts an optional `paths` array. If provided, it scopes `git add` to those files.
2.  **Modified `src/engine/loop.engine.js`**: The `runTask` function now passes `affected_files` and the moved task file to `gitService.commit`.
3.  **Updated Tests**:
    -   `src/services/git.service.test.js`: Added a test case for `commit` with specific paths.
    -   `src/engine/loop.engine.test.js`: Added test cases to verify that `runTask` correctly gathers and passes the file list (including handling array vs string `affected_files`).
4.  **Verified**: Ran `npx vitest run` and all tests passed.

The `GitService.commit` is now safer and the loop engine correctly limits the scope of commits.
I will commit the changes with the message "feat(git): scoped commits and safe file additions".
I will check the status one last time to ensure everything is clean.
The task to improve Git safety by scoping commits to affected files is complete.

**Summary of Changes:**

1.  **`src/services/git.service.js`**: Updated the `commit` method to accept an optional `paths` argument. If provided, `git add` is restricted to the specified files (quoted for safety). If not, it defaults to `git add .`.
2.  **`src/engine/loop.engine.js`**: Updated `runTask` to identify the files to be committed. This list now includes:
    *   The moved task file (in the `done/` directory).
    *   Any files specified in the `affected_files` field of the task frontmatter (handling both array and comma-separated string formats).
    This list is passed to `gitService.commit`.
3.  **Tests**:
    *   **`src/services/git.service.test.js`**: Added a test case to verify `commit` works correctly with a list of specific paths.
    *   **`src/engine/loop.engine.test.js`**: Added test cases to ensure `runTask` correctly gathers and passes the file list (including `affected_files` parsing) to the git service.

**Verification:**
All tests passed using `npx vitest run`. The changes have been committed to the repository.
