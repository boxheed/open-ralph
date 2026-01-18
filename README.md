# 🤡 Ralph Agent (v1.0.0)
> "I'm helping!" — An autonomous, reliability-first AI coding loop.

Ralph Agent is a platform-agnostic implementation of the **Ralph Wiggum Pattern**. Unlike traditional AI coding assistants that simply generate code, Ralph operates in a **Propose → Execute → Verify → Fix** loop. It treats the AI as a junior engineer that is not allowed to commit code until the validation tests pass.

---

## 🛠 Features
- **Deterministic Workflow:** Processes tasks alphabetically from Markdown files.
- **Reliability Loop:** Automatically retries fixes up to 3 times upon test failure.
- **Safety First:** Hard-stop "Circuit Breaker" to prevent token-burn and hallucination loops.
- **Audit Trails:** Every AI "thought" and shell output is appended to the task file.
- **Platform Agnostic:** Works with Gemini CLI, but modular enough to swap with Aider, Claude-Code, or GPT.

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
npm install -g https://github.com/your-username/ralph-agent
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
Run the setup command in your target repository to create the task folders:   
```bash
ralph setup
```

### 2. Author a Task   
Create a `.md` file in `tasks/todo/`. The filename determines the order of execution (e.g., `01_fix_header.md`).

**Example Task:**
```markdown
---
task_id: "AUTH-001"
validation_cmd: "npm test src/auth.test.js"
affected_files: ["src/auth.js", "src/config.js"]
---

# Objective: Correct JWT Expiration
The token is currently set to expire in `5m`. We need to change this to `1h` (one hour) to match our security policy.

## Success Criteria
1. Locate where `EXPIRES_IN` or similar is defined.
2. Update the value to 1 hour.
3. Run the validation test to confirm the token generated actually has a 1-hour lifespan.
```

### 3. Run the Agent   
```bash
# Headless mode (Automatic)
ralph

# Interactive mode (Pause for review before validation/commit)
ralph --interactive
```

---

## ⚙️ Configuration

Ralph supports multiple AI providers (Gemini, Aider, GitHub Copilot, etc.). The default is `gemini`.

### Setting the Provider

You can set the provider globally in `ralph.config.js` or per-task in the front matter.

**`ralph.config.js`**:
```javascript
module.exports = {
  provider: "aider", // Set default to Aider
  // model: "gpt-4", // Optional: Global model override
  providers: {
    aider: {
      // Override default behavior
      command: "aider --model gpt-4 --message \"{prompt}\" {files}"
    }
  }
};
```

**Task Front Matter**:
```markdown
---
task_id: "FEAT-123"
provider: "gemini"
model: "gemini-1.5-pro" # Override model for this task
...
---
```

### Model Configuration & Precedence

Ralph uses a flexible model configuration strategy. You are not required to set a model globally. If no model is specified, Ralph will defer to the AI provider's native default (e.g., whatever `gemini` or `aider` CLI uses by default).

**Precedence Order:**
1.  **Task Frontmatter:** (Highest priority) Defined in the `.md` file.
2.  **Provider Default:** Defined in the provider's `.js` file (e.g., `defaultModel`).
3.  **Global Config:** Defined in `ralph.config.js`.
4.  **CLI Native Default:** (Lowest priority) If no model is resolved, Ralph runs the command without a model flag, letting the CLI tool choose its default.

### Supported Providers

- **gemini** (Default)
- **aider**
- **github-copilot**
- **forge**
- **nanocoder**
- **cline**
- **opencode**
- **qwen-code**

### Custom Providers

You can add your own AI providers by creating a `.js` file in your project's `.ralph/providers/` directory.

**Strategy Pattern (Recommended):**
Export a `build` function that returns the structured command and arguments. This is safer and more flexible.

**Example `.ralph/providers/my-custom-ai.js`**:
```javascript
module.exports = {
  name: "my-custom-ai",
  /**
   * Builds the command execution details.
   * @param {string} prompt - The task prompt.
   * @param {object} context - { model, files }
   * @returns {object} - { command: string, args: string[] }
   */
  build: (prompt, { model, files }) => {
    const args = ["--task", prompt];
    if (model) args.push("--engine", model);
    if (files) args.push(...files.split(","));
    
    return {
      command: "my-cli",
      args
    };
  }
};
```

**Legacy Pattern (String Template):**
Export a `command` string with placeholders `{prompt}`, `{files}`, and `{model}`.
```javascript
module.exports = {
  name: "simple-ai",
  command: "simple-cli --task \"{prompt}\" --model {model}"
};
```

## 🏗 Modular Architecture

  * `bin/ralph.js`: CLI Entry point and argument parsing.
  * `src/engine/`: The Core Loop logic and state management.
  * `src/services/`: Pluggable connectors for Git and AI.

## 🛡 Safety & Circuit Breakers
  * **Git Check:** Ralph will refuse to run if the repository has uncommitted changes.
  * **Max Retries:** If a validation command fails 3 times, Ralph moves the task to `/failed` and stops to prevent infinite loops.
  * **Interactive Gate:** Use `--interactive` to inspect code changes in your IDE before the agent executes the validation shell commands.

## 🤝 Contributing
  * Create a task in `/tasks/todo` for your feature.
  * Run `ralph` to let the agent build its own improvements.
  * Submit a PR!

## 📄 License
Apache 2.0
