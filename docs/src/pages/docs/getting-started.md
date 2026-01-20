---
layout: ../../layouts/DocLayout.astro
title: Getting Started
---

# Getting Started with Open Ralph

Ralph is an autonomous coding agent that helps you fix bugs and build features by running in a continuous **Propose → Verify → Fix** loop.

## 1. Installation

Ralph is a Node.js tool. You can install it globally to use it in any project.

```bash
npm install -g open-ralph
```

> **Prerequisite:** You need an AI provider installed. By default, Ralph uses the Google Gemini CLI.
> ```bash
> npm install -g @google/gemini-cli
> ```

## 2. Initialize a Project

Go to your project root and run the setup command. This creates the necessary folders and config files.

```bash
cd my-project
ralph setup
```

This will create:
*   `tasks/todo`: Where you put your task files.
*   `tasks/done`: Where completed tasks are moved.
*   `ralph.config.js`: The project configuration.

## 3. Author a Task

Ralph works by processing Markdown files. Create a new file in `tasks/todo/`, for example `01-fix-login.md`.

**Task Template:**

```markdown
---
task_id: "AUTH-001"
validation_cmd: "npm test src/auth.test.js"
affected_files: ["src/auth.js"]
---

# Objective
The user login is failing with a 500 error when the password contains a special character.

# Requirements
1. Find the regex validation in `auth.js`.
2. Update it to allow special characters like `!@#$%`.
```

### Key Fields
*   **`validation_cmd`**: The command Ralph runs to check if the task is done. **Crucial:** If this fails, Ralph retries. If it passes, Ralph commits.
*   **`affected_files`**: A hint to help the AI focus on relevant files (context).

## 4. Run Ralph

Just type `ralph` in your terminal. It will pick up the first task in `tasks/todo` and start working.

```bash
ralph
```

## CLI Reference

| Command / Flag | Description |
| :--- | :--- |
| `ralph` | Runs all tasks in `tasks/todo` alphabetically. |
| `ralph run --task <file>` | Runs a specific task file (e.g., `ralph run --task 01-fix.md`). |
| `ralph setup` | Initializes the project structure. |
| `ralph list` | Shows the status of all tasks (Todo, Done, Failed). |
| `--interactive` (`-i`) | Pauses before running validation so you can review the code. |
| `--debug` (`-d`) | Shows detailed logs of what the AI is thinking. |
| `--quiet` (`-q`) | Runs with minimal output. |
