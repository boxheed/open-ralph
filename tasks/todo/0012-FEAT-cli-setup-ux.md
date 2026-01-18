---
task_id: 0012
affected_files:
  - bin/ralph.js
  - src/services/setup.service.js
  - src/services/setup.service.test.js
  - package.json
  - README.md
validation_cmd: npm test
---

# CLI Setup & UX Improvements

Implement a dedicated `setup` command to initialize the Ralph environment, seed default personas, and handle configuration. Enhance the default CLI entry point to guide users if the environment is uninitialized.

## Functional Requirements

### 1. New `setup` Command
- Implement `ralph setup` using `commander`.
- **Directory Creation:** Ensure the following exist:
    - `tasks/todo`, `tasks/done`, `tasks/failed`
    - `.ralph/personas`
    - `.ralph/context`
- **File Seeding:**
    - **Personas:** Create `ralph.md` (Default Agent) and `architect.md` (Reviewer) in `.ralph/personas/` if they don't exist.
    - **Gitignore:** Check `.gitignore`. If `.ralph/context` is not ignored, append it.
    - **Config:** Create a starter `ralph.config.js` if missing.

### 2. Smart Entry Point (`bin/ralph.js`)
- Update the default action (`ralph` / `ralph run`).
- Before running the loop, check if the `tasks/todo` directory exists.
- **Behavior:**
    - If exists: Proceed with `runTask` loop.
    - If missing: Log a friendly error: "Ralph environment not found. Run `ralph setup` to initialize this project." and exit(1).

### 3. Setup Service
- Encapsulate initialization logic in `src/services/setup.service.js`.
- This ensures the logic is testable and strictly separated from the CLI presentation layer.

## Default Content Definitions

**`ralph.md`**:
```markdown
ROLE: Senior Software Engineer
You are Ralph, an autonomous coding agent.
- You focus on clean, working code.
- You strictly follow the Test-Driven Development (TDD) cycle.
- You do not ask clarifying questions; you use your best judgment.
```

**`architect.md`**:
```markdown
ROLE: Software Architect
You are a Staff Engineer responsible for system design and code quality.
- Focus on patterns, scalability, and security.
- Critique implementations for "separation of concerns".
- Prefer interfaces and abstractions over direct coupling.
```

## Acceptance Criteria
- [ ] `ralph setup` creates all required folders and files.
- [ ] `ralph setup` is idempotent (running it twice doesn't break things or overwrite existing work).
- [ ] `ralph setup` updates `.gitignore` correctly.
- [ ] `ralph` (default) fails gracefully with a helpful message if run in a clean directory.
- [ ] `npm test` passes (including new tests for `setup.service.js`).
