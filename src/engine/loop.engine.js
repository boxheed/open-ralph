const path = require("path");

/**
 * LoopEngine coordinates the main Ralph loop.
 * It is agnostic of the persistence layer and AI implementation details.
 */
class LoopEngine {
    constructor({ 
        aiService, 
        gitService, 
        taskRepository, 
        contextService, 
        logger, 
        config = {} 
    }) {
        this.aiService = aiService;
        this.gitService = gitService;
        this.taskRepository = taskRepository;
        this.contextService = contextService;
        this.logger = logger;
        this.config = config;
        this.retries = config.retries || 3;
    }

    /**
     * Executes all pending tasks in the repository.
     */
    async runAll() {
        const files = this.taskRepository.listTodo();
        
        if (files.length === 0) {
            this.logger.info("No tasks found in TODO directory.");
            return;
        }

        this.logger.info(`Found ${files.length} tasks. Starting loop...`);

        for (const file of files) {
            this.logger.info(`▶️ Running task: ${file}`);
            await this.runTask(file);
        }
    }

    /**
     * Runs a single task through the Propose -> Execute -> Verify cycle.
     */
    async runTask(fileName, options = {}) {
        const task = this.taskRepository.loadTask(fileName);
        const { data, content } = task;
        
        let history = [];
        let success = false;
        
        const provider = data.provider || this.config.provider;
        const model = data.model || this.config.model;
        const timeouts = this.config.timeouts || {};

        for (let i = 1; i <= this.retries; i++) {
            this.logger.info(`   Attempt ${i}/${this.retries}...`);
            
            const prompt = `ROLE: Senior Engineer\nTASK: ${content}\nFILES: ${data.affected_files}`;
            
            try {
                const aiOutput = await this.aiService.callAI(prompt, {
                    provider,
                    files: data.affected_files,
                    model,
                    timeout: timeouts.ai,
                    contextService: this.contextService,
                    task: { data, content, history }
                });
                
                history.push(`### Attempt ${i}\n${aiOutput}`);

                if (options.interactive || this.config.interactive) {
                    this.logger.info("⏸  AI has proposed changes. Please inspect the code.");
                    // In a real environment, we'd need a way to pause and wait for user input
                    // For now, keeping the shell command as a placeholder if needed, 
                    // but ideally this should be handled by the shell/CLI layer.
                }

                this.logger.info(`🔍 Running validation: ${data.validation_cmd}`);
                this.gitService.runValidation(data.validation_cmd, timeouts.validation);
                
                success = true;
                this.taskRepository.markDone(task, history);
                
                this._commitTask(task);
                this.logger.success(`Task ${fileName} completed successfully.`);
                break;
            } catch (err) {
                this.logger.warn(`Attempt ${i} failed: ${err.message}`);
                history.push(`### Attempt ${i} Failed\nError: ${err.message}`);
                
                if (i === this.retries) {
                    this.logger.error(`Task ${fileName} failed after ${this.retries} attempts.`);
                    this.taskRepository.markFailed(task, history, err.message);
                }
            }
        }
    }

    /**
     * Commits the completed task and its affected files.
     * @private
     */
    _commitTask(task) {
        const { data, fileName } = task;
        const donePath = path.join(this.config.dirs.done, fileName);
        let filesToCommit = [donePath];

        if (data.affected_files) {
            if (Array.isArray(data.affected_files)) {
                filesToCommit = filesToCommit.concat(data.affected_files);
            } else if (typeof data.affected_files === 'string') {
                filesToCommit = filesToCommit.concat(
                    data.affected_files.split(/["\s,"]+/).map(s => s.trim()).filter(Boolean)
                );
            }
        }

        this.gitService.commit(`fix(${data.task_id}): automated task resolution`, filesToCommit);
    }
}

module.exports = { LoopEngine };