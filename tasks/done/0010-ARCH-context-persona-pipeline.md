---
task_id: 0010
affected_files:
  - src/services/context.service.js
  - src/services/context.service.test.js
  - src/services/ai.service.js
  - src/services/config.service.js
  - src/services/providers/aider.js
  - src/services/providers/gemini.js
  - src/engine/loop.engine.js
  - tasks/done/0009-FEAT-flexible-model-config.md
validation_cmd: npm test
---

# Context & Persona Pipeline

Implement a robust "Prompt Engineering" pipeline that separates **Context Construction** from **Message Delivery**. This moves away from fragile CLI argument strings to a file-based context strategy, enabling richer, configurable personas and safer execution.

## Architectural Goals
1.  **File-Based Context:** Avoid shell `ARG_MAX` and escaping issues by writing instructions to a `.ralph/context/current_task.md` file.
2.  **Persona Management:** Support hierarchical persona configuration (Task > Repo File > Global Config > Default).
3.  **Smart Tool Integration:** Leverage the native capabilities of "Smart" CLIs (Aider, Gemini, etc.) by pointing them to the context file rather than force-feeding context via arguments.

## Functional Requirements

### 1. Persona Management System
- **Storage:** Personas are Markdown files stored in `.ralph/personas/` (e.g., `junior.md`, `architect.md`).
- **Resolution Hierarchy:**
    1.  **Task Frontmatter:** `persona: "architect"` -> Loads `.ralph/personas/architect.md`.
    2.  **Global Config:** `ralph.config.js` -> `defaultPersona: "junior"`.
    3.  **System Default:** Hardcoded "Ralph" persona if nothing else is found.
- **Implementation:**
    - Create `src/services/context.service.js` to handle loading and resolving personas.

### 2. Context Artifact Builder (`ContextService`)
- **Responsibility:** Assemble the "Prompt Package" into a single Markdown file.
- **Output:** Writes to `.ralph/context/current_task.md`.
- **Content Structure:**
    - **ROLE:** The resolved Persona content.
    - **TASK:** The content of the user's task file.
    - **CONSTRAINTS:** The validation command and other metadata.
    - **HISTORY:** (Optional) Summary of previous attempts if retrying.

### 3. Provider Integration Updates
- **Update `ai.service.js`:**
    - Before calling `provider.build()`, invoke `ContextService.buildContext()`.
    - Pass the **path** to the generated context file (`.ralph/context/current_task.md`) to the provider.
- **Update Providers (e.g., `aider.js`, `gemini.js`):**
    - Modify the `build()` strategy to utilizing the context file.
    - **Aider Example:** `aider --message "Read instructions in .ralph/context/current_task.md" {affected_files}`
    - **Gemini Example:** `gemini --text .ralph/context/current_task.md` (or equivalent flag for file input).

### 4. Configuration
- Update `ralph.config.js` loader to support:
    - `dirs.personas`: Custom path for persona files (default: `.ralph/personas`).
    - `defaultPersona`: String name of default persona.

## Non-Functional Requirements
- **Persistence:** Ensure `.ralph/context/` is created if missing. The file should remain after execution for debugging (add to `.gitignore` via setup task or manually if needed, but the *files* should persist locally).
- **Test Coverage:** 
    - Unit tests for `ContextService` (persona resolution, file generation).
    - Integration tests ensuring `ai.service` calls the context builder.

## Acceptance Criteria
- [x] `ContextService` correctly loads personas from `.ralph/personas/`.
- [x] `ContextService` generates a valid `.ralph/context/current_task.md` file containing Persona + Task + Constraints.
- [x] `ai.service.js` orchestrates the creation of the context file before invoking the provider.
- [x] `aider.js` and `gemini.js` are updated to consume the context file path.
- [x] Tests verify the hierarchy of persona resolution.
