## Results
- Status: Success
- Implementation:
  - Updated `src/services/ai.service.js` to inject `fs` into provider context (Dependency Injection).
  - Updated `src/services/config.service.js` to ignore `.test.js` files when loading providers.
  - Updated `github-copilot.js`, `cline.js`, `forge.js`, `nanocoder.js`, `opencode.js`, `qwen-code.js` to read file content if `prompt` is a file path.
- Verification:
  - Created `src/services/providers/providers.test.js` covering all updated providers.
  - Verified `npm test` passes (55 tests).