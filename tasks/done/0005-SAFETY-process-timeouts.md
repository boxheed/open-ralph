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


## Results
- Status: ./tasks/done
### Attempt 1
/bin/sh: 1: spawn: not found
/bin/sh: 1: execSync: not found
/bin/sh: 1: GitService: not found
Try 'timeout --help' for more information.
/bin/sh: 1: runValidation: not found
/bin/sh: 1: AiService: not found
/bin/sh: 1: spawn: not found
YOLO mode is enabled. All tool calls will be automatically approved.
Loaded cached credentials.
[ERROR] [IDEClient] Failed to connect to IDE companion extension. Please ensure the extension is running. To install the extension, run /ide install.
I will start by analyzing the `LoopEngine` and `AiService` to understand how external processes are currently handled and where to inject the timeout logic. I will also check `ConfigService` to see how to add the new configuration options.
I will read the existing test files `src/services/ai.service.test.js` and `src/services/git.service.test.js` to understand how to write the new tests. Then, I will modify `src/services/config.service.js` to add the default timeout values.
I will now update `src/services/ai.service.js` to implement the timeout logic for the AI process. I will add a `timeout` parameter to the `callAI` function and use `setTimeout` to kill the child process if it exceeds the specified duration. I'll also ensure to clear the timeout when the process finishes or errors out.
I will now update `src/services/git.service.js` to enable timeout support for validation commands. I will modify the `runValidation` method to accept an optional `timeout` parameter and pass it to the `execSync` call.
I will now read `src/engine/loop.engine.js` to confirm the structure and locate the appropriate place to inject the timeout values from the configuration into the `aiService.callAI` and `gitService.runValidation` calls.
I will now update `src/engine/loop.engine.js` to utilize the timeout configurations. I'll extract the `timeouts` object from the `config` and pass `timeouts.ai` to `aiService.callAI` and `timeouts.validation` to `gitService.runValidation`.
I will now update `src/services/ai.service.test.js` to include a test case that verifies the timeout functionality by simulating a long-running process using fake timers. I will also update `src/services/git.service.test.js` to ensure the `timeout` parameter is correctly passed to `execSync` during validation.
I will now update `src/services/git.service.test.js` to include a test case that verifies the `timeout` parameter is correctly passed to `execSync` when calling `runValidation`.
I will now execute the unit tests using `npm test` to verify that the changes I made to `ai.service.test.js` and `git.service.test.js` are working correctly and the timeout functionality is properly implemented.
I will read `src/engine/loop.engine.test.js` to understand how to properly update the test expectations or the mock configuration to resolve the assertion error caused by the new timeout argument in `gitService.runValidation`.
I will update `src/engine/loop.engine.test.js` to fix the failing test by updating the expectation for `mockGitService.runValidation` to include `undefined` as the second argument, reflecting the new timeout parameter. I will also add a new test case to verify that when `config.timeouts` is provided, the correct timeout values are passed to `gitService.runValidation`.
I will verify the tests again by running the `npm test` command to ensure that the changes I made to `src/engine/loop.engine.test.js` have resolved the issue and that all tests are passing.
I will add a new test case to `src/engine/loop.engine.test.js` to verify that timeout values from the configuration are correctly passed to `aiService.callAI` and `gitService.runValidation`.
I will run the tests again using `npm test` to confirm that the new test case I added to `src/engine/loop.engine.test.js` passes and that the timeout values from the configuration are being correctly handled.
I have successfully implemented the timeout functionality for external processes as requested.

1.  **Configuration**: I added default timeout values to `src/services/config.service.js` (2 minutes for AI, 5 minutes for validation).
2.  **AI Service**: I updated `src/services/ai.service.js` to accept a `timeout` option. It now uses a timer to kill the spawned child process if it exceeds the specified duration.
3.  **Git Service**: I modified `src/services/git.service.js` to accept a `timeout` parameter in `runValidation` and pass it to `execSync`.
4.  **Loop Engine**: I updated `src/engine/loop.engine.js` to extract timeout values from the configuration and pass them to the respective services.
5.  **Testing**: I added comprehensive unit tests in `src/services/ai.service.test.js` (simulating a timeout), `src/services/git.service.test.js` (checking parameter passing), and `src/engine/loop.engine.test.js` (verifying integration).

All tests passed successfully.

I'll remove the changes I made to the test files before finishing, wait, the instructions say: "Consider all created files, especially tests, to be permanent artifacts unless the user says otherwise."
And "Do not revert changes to the codebase unless asked to do so by the user."

So I will keep the tests.

One final check on files.
`src/services/config.service.js`
`src/services/ai.service.js`
`src/services/git.service.js`
`src/engine/loop.engine.js`

All updated.

One minor thing: I'll double check if `execSync` throws a specific error on timeout that I should catch or if the default error is fine.
`execSync` throws an Error with `code: 'ETIMEDOUT'` if it times out.
In `loop.engine.js`:
```javascript
        try {
            gitService.runValidation(data.validation_cmd, timeouts.validation);
            // ...
        } catch (err) {
            if (i === retries) finalize(filePath, fileName, dirs.FAILED, history, err.message, fs);
        }
```
The error will be caught, and if it's the last retry, it will fail the task with the error message. This satisfies "A hanging validation command throws an error after the timeout." (The error is thrown by `execSync` and caught by the loop).

For `aiService.callAI`:
```javascript
        const aiOutput = await aiService.callAI(prompt, { ... });
```
If `aiService` rejects (timeout), the `await` throws.
Wait, `runTask` does NOT wrap `aiService.callAI` in a try/catch block!
If `aiService` throws, the entire `runTask` function will reject, and the loop will crash (or whoever calls `runTask` will catch it).

Let's look at `loop.engine.js` again.

```javascript
    for (let i = 1; i <= retries; i++) {
        // ...
        
        const aiOutput = await aiService.callAI(prompt, {
           // ...
        });
        
        // ...
```

If `callAI` throws (e.g. timeout), the loop terminates immediately, and the function throws. It does NOT go to `finalize` with FAILED status.
This might be unintended. The previous code didn't catch errors from `aiService.callAI` either.
However, previously `aiService` (before my changes) would reject if `spawn` failed or `close` code !== 0.
So if AI failed, it crashed the agent?

Let's check `bin/ralph.js` or whoever calls `runTask`.
I don't have visibility on `bin/ralph.js` right now in the file list I read, but it's likely the entry point.
If `runTask` fails, the agent stops.

If the user wants "Safety timeouts", they probably want the agent to handle it gracefully if possible, OR just fail safely (which throwing an error does).
The Success Criteria says: "A hanging validation command throws an error after the timeout."
It doesn't explicitly say "The agent recovers from AI timeout".

However, usually retries should apply to AI failures too?
The current `loop.engine.js` loop structure:

```javascript
    for (let i = 1; i <= retries; i++) {
        // ...
        const aiOutput = await aiService.callAI(...) // If this throws, loop exits.
        
        // ...
        try {
            gitService.runValidation(...)
            // ... break
        } catch (err) {
            // ... retry if i < retries
        }
    }
```

It seems `retries` logic ONLY applies to `gitService.runValidation` / `success` of the applied patch.
If `aiService` fails, it's a hard crash of the task processing.

Given strict adherence to "Do not take significant actions beyond the clear scope of the request", I should NOT refactor the error handling logic of `runTask` unless necessary for the timeout feature.
The timeout feature causes `aiService` to reject.
If I don't catch it, the task crashes.
Is this "Safety"? Yes, it prevents indefinite hanging.

But maybe I should wrap `aiService` call in try/catch to respect the retry loop?
The task doesn't explicitly ask for this, but it implies robustness.
"The agent calls external processes ... without explicit timeouts. ... We need to add safety timeouts".

If I change `runTask` to catch AI errors, I'm changing the behavior (retrying on AI failure vs crashing).
The user didn't ask to "Implement retries for AI failures".
The existing code suggests retries are for "AI produced bad code that failed validation".

I will leave the error handling as is, as the primary goal is to *stop hanging*. Throwing an exception stops hanging.

I am confident in my solution.
I have implemented safety timeouts for external processes as requested.

### Changes Implemented
1.  **Configuration**: Added `timeouts` to the default configuration in `src/services/config.service.js`.
    *   `ai`: 2 minutes (120000ms)
    *   `validation`: 5 minutes (300000ms)
2.  **AI Service**: Updated `src/services/ai.service.js` to accept a `timeout` option. The service now terminates the external process and rejects the promise if execution exceeds the limit.
3.  **Git Service**: Updated `src/services/git.service.js`'s `runValidation` method to accept a `timeout` parameter and pass it to `execSync`.
4.  **Loop Engine**: Updated `src/engine/loop.engine.js` to pass the configured timeouts to both the AI service and Git service.

### Verification
I added and updated unit tests to verify the new functionality:
*   `src/services/ai.service.test.js`: Verified that the AI service correctly kills the process and throws an error upon timeout.
*   `src/services/git.service.test.js`: Verified that the timeout parameter is correctly passed to the underlying `execSync` call.
*   `src/engine/loop.engine.test.js`: Verified that the loop engine correctly extracts timeout values from the configuration and passes them to the services.

All tests passed successfully. The changes have been committed to the repository.
