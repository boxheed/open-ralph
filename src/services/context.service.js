const defaultFs = require("fs-extra");
const path = require("path");

const DEFAULT_PERSONA = `ROLE: Senior Engineer
You are a senior software engineer. You write clean, efficient, and well-tested code.
You adhere strictly to project conventions and requirements.`;

class ContextService {
    constructor(config = {}, fs = defaultFs) {
        this.config = config;
        this.fs = fs;
    }

    /**
     * Resolves the persona content based on task configuration and global defaults.
     * Hierarchy: Task Frontmatter > Global Config > System Default
     * @param {object} taskData - The frontmatter data from the task file.
     * @returns {string} - The content of the resolved persona.
     */
    resolvePersona(taskData) {
        let personaName = taskData.persona || this.config.defaultPersona;
        
        if (!personaName) {
            return DEFAULT_PERSONA;
        }

        let personasDir;
        if (this.config.dirs && this.config.dirs.personas) {
            personasDir = this.config.dirs.personas;
        } else {
            personasDir = path.join(process.cwd(), ".ralph", "personas");
        }

        const personaPath = path.join(personasDir, `${personaName}.md`);

        if (this.fs.existsSync(personaPath)) {
            return this.fs.readFileSync(personaPath, "utf8");
        }

        // Fallback if specific persona file not found, but name was provided
        console.warn(`Warning: Persona file not found at ${personaPath}. Using default.`);
        return DEFAULT_PERSONA;
    }

    /**
     * Builds the context file for the current task.
     * @param {object} task - Object containing { data, content, history }
     * @param {string} task.content - The main task description.
     * @param {object} task.data - Task frontmatter data.
     * @param {string[]} task.history - Array of previous attempt summaries.
     * @returns {string} - The absolute path to the generated context file.
     */
    buildContext(task) {
        const personaContent = this.resolvePersona(task.data);
        
        const sections = [
            personaContent,
            "\n# TASK",
            task.content
        ];

        if (task.data.validation_cmd) {
            sections.push("\n# CONSTRAINTS");
            sections.push(`Validation Command: ${task.data.validation_cmd}`);
        }
        
        if (task.data.affected_files) {
             sections.push(`Affected Files: ${task.data.affected_files}`);
        }

        if (task.history && task.history.length > 0) {
            sections.push("\n# HISTORY");
            sections.push("Previous attempts and outcomes:");
            sections.push(task.history.join("\n\n"));
        }

        const contextContent = sections.join("\n");
        
        const contextDir = path.join(process.cwd(), ".ralph", "context");
        this.fs.ensureDirSync(contextDir);
        
        const contextFilePath = path.join(contextDir, "current_task.md");
        this.fs.writeFileSync(contextFilePath, contextContent);

        return contextFilePath;
    }
}

module.exports = { ContextService };
