const defaultFs = require("fs-extra");
const path = require("path");
const defaultMatter = require("gray-matter");

/**
 * TaskRepository abstracts the persistence layer for Ralph tasks.
 * It handles file system operations and state transitions.
 */
class TaskRepository {
    constructor({ config, fs = defaultFs, matter = defaultMatter } = {}) {
        this.config = config;
        this.fs = fs;
        this.matter = matter;
        this.dirs = config.dirs;
    }

    /**
     * Lists all pending tasks in the TODO directory.
     * @returns {string[]} List of task filenames.
     */
    listTodo() {
        if (!this.fs.existsSync(this.dirs.todo)) return [];
        return this.fs.readdirSync(this.dirs.todo)
            .filter(f => f.endsWith(".md"))
            .sort();
    }

    /**
     * Loads and parses a task file.
     * @param {string} fileName 
     * @returns {object} { data, content, filePath }
     */
    loadTask(fileName) {
        const filePath = path.join(this.dirs.todo, fileName);
        const rawContent = this.fs.readFileSync(filePath, "utf8");
        const { data, content } = this.matter(rawContent);
        return { data, content, filePath, fileName, rawContent };
    }

    /**
     * Moves a task to the DONE directory with results.
     */
    markDone(task, history) {
        this._finalize(task, this.dirs.done, history);
    }

    /**
     * Moves a task to the FAILED directory with results and error.
     */
    markFailed(task, history, error) {
        this._finalize(task, this.dirs.failed, history, error);
    }

    /**
     * Appends results to the task file and moves it to the target directory.
     * @private
     */
    _finalize(task, targetDir, history, error = null) {
        let log = `\n\n## Results\n- Status: ${path.basename(targetDir).toUpperCase()}\n${history.join("\n")}`;
        if (error) {
            log += `\n- Error: ${error}`;
        }

        const newContent = task.rawContent + log;
        const targetPath = path.join(targetDir, task.fileName);

        this.fs.ensureDirSync(targetDir);
        this.fs.writeFileSync(targetPath, newContent);
        
        if (this.fs.existsSync(task.filePath)) {
            this.fs.removeSync(task.filePath);
        }
    }
}

module.exports = { TaskRepository };
