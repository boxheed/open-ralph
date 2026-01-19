# 🤡 Open Ralph (v0.1.0)
> "I'm helping!" — An autonomous, reliability-first AI coding loop.

Ralph Agent is a platform-agnostic implementation of the **Ralph Wiggum Pattern**. Unlike traditional AI coding assistants that simply generate code, Ralph operates in a **Propose → Execute → Verify → Fix** loop. It treats the AI as a junior engineer that is not allowed to commit code until the validation tests pass.

---

## 🛠 Features
- **Deterministic Workflow:** Processes tasks alphabetically from Markdown files.
- **Reliability Loop:** Automatically retries fixes up to 3 times upon test failure.
- **Dynamic Staging:** Automatically detects and commits all changes (including new files) upon successful validation.
- **Event-Driven Observation:** Decoupled logging and reporting via an internal event system.
- **Platform Agnostic:** Modular architecture allows swapping AI providers (Gemini, Aider, etc.) with ease.

---

## 🚀 Installation

### Prerequisites
- **Node.js** (v18+)
- **Gemini CLI** (for the default AI engine)
  ```bash
  npm install -g @google/gemini-cli
  ```

### Global Install (via GitHub)
Install the agent directly from the repository to use the ralph command anywhere:

```bash
npm install -g https://github.com/boxheed/open-ralph
```

### Local Development Setup

```bash
git clone https://github.com/boxheed/open-ralph.git
cd open-ralph
npm install
npm link
```

## 📖 How to Use

### 1. Initialize a Project   
Run the setup command in your target repository to initialize the environment:   
```bash
ralph setup
```

### 2. Author a Task   
Create a `.md` file in `tasks/todo/`. The filename determines the order of execution.

**Example Task:**
```markdown
---
task_id: "AUTH-001"
validation_cmd: "npm test src/auth.test.js"
affected_files: ["src/auth.js", "src/config.js"]
---

# Objective: Correct JWT Expiration
The token is currently set to expire in `5m`. We need to change this to `1h`.
```

#### 💡 The role of `affected_files`
In Ralph, `affected_files` acts as a **Context Hint**. It tells the AI which files are most relevant to the task, helping it focus its "attention" and stay within token limits. 
*   **Note:** You do not need to list new files here for them to be committed. Ralph uses **Dynamic Staging** to automatically capture any files created or modified by the AI during a successful run.

### 3. Run the Agent   
```bash
# Standard mode
ralph

# Verbose/Debug mode
ralph --debug

# Interactive mode (Pause for review before validation)
ralph --interactive
```

---

## ⚙️ Configuration

### Supported Providers
Ralph uses a **Strategy Pattern** for AI providers. Currently supported:
- **gemini** (Default), **aider**, **github-copilot**, **cline**, **qwen-code**, and more.

### Custom Providers
You can add custom providers by placing a `.js` file in `.ralph/providers/`. Each provider must export a `name` and a `build(prompt, context)` function that returns a structured command.

---

## 🏗 Modular Architecture

Ralph is built with high-quality software engineering principles, including **Dependency Injection** and **Interface Segregation**:

- **`LoopEngine`**: The central event-driven coordinator of the Propose/Verify loop.
- **`TaskRepository`**: Manages task persistence and state transitions (Todo → Done/Failed).
- **`AIService`**: Orchestrates AI provider execution using the Strategy Pattern.
- **`GitService`**: Handles workspace safety, validation execution, and dynamic commits.
- **`EngineObserver`**: Decouples the core logic from reporting (logging).

---

## 🛡 Safety & Reliability
- **Git Check:** Ralph refuses to run if the repository has uncommitted changes.
- **Atomic Commits:** Changes are only committed if the `validation_cmd` exits with code 0.
- **Circuit Breaker:** If a task fails 3 times, it is moved to `tasks/failed` to prevent infinite loops and token burn.

## 🤝 Contributing
Submit a PR or create a task in `tasks/todo` and let Ralph build it for you!

## 📄 License
Apache 2.0
