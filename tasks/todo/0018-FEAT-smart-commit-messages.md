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
