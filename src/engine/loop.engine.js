const EventEmitter = require("events");
const path = require("path");

/**
 * Standard Event Names for the LoopEngine
 */
const EVENTS = {
    TASK_STARTED: "task:started",
    TASK_COMPLETED: "task:completed",
    TASK_FAILED: "task:failed",
    ATTEMPT_STARTED: "attempt:started",
    ATTEMPT_SUCCEEDED: "attempt:succeeded",
    ATTEMPT_FAILED: "attempt:failed",
    AI_PROPOSAL_RECEIVED: "ai:proposal_received"
};

/**
 * LoopEngine coordinates the main Ralph loop.
 */
class LoopEngine extends EventEmitter {
    constructor({
        aiService,
        gitService,
        taskRepository,
        contextService,
        config = {} 
    }) {
        super();
        this.aiService = aiService;
        this.gitService = gitService;
        this.taskRepository = taskRepository;
        this.contextService = contextService;
        this.config = config;
        this.retries = config.retries || 3;
    }

    async runAll() {
        const files = this.taskRepository.listTodo();
        
        if (files.length === 0) {
            this.emit(EVENTS.TASK_STARTED, { count: 0 });
            return;
        }

        for (const file of files) {
            await this.runTask(file);
        }
    }

    async runTask(fileName) {
        const task = this.taskRepository.loadTask(fileName);
        this.emit(EVENTS.TASK_STARTED, { task });

        let state = {
            history: [],
            success: false,
            task
        };

        for (let i = 1; i <= this.retries; i++) {
            state = await this._executeAttempt(state, i);
            if (state.success) break;
        }

        if (state.success) {
            this.taskRepository.markDone(task, state.history);
            this._commitTask(task);
            this.emit(EVENTS.TASK_COMPLETED, { task });
        } else {
            const lastError = state.history[state.history.length - 1];
            this.taskRepository.markFailed(task, state.history, lastError);
            this.emit(EVENTS.TASK_FAILED, { task, error: lastError });
        }
    }

    /**
     * Internal pipeline for a single attempt.
     * @private
     */
    async _executeAttempt(state, attemptNumber) {
        const { task, history } = state;
        this.emit(EVENTS.ATTEMPT_STARTED, { task, attemptNumber });

        try {
            // 1. Propose (AI)
            const aiOutput = await this._generateProposal(task, history);
            this.emit(EVENTS.AI_PROPOSAL_RECEIVED, { task, attemptNumber, output: aiOutput });

            // 2. Verify (Validation)
            this._verifyChanges(task.data.validation_cmd);
            
            this.emit(EVENTS.ATTEMPT_SUCCEEDED, { task, attemptNumber });
            return { 
                ...state, 
                success: true, 
                history: [...history, `### Attempt ${attemptNumber}\n${aiOutput}`] 
            };
        } catch (err) {
            this.emit(EVENTS.ATTEMPT_FAILED, { task, attemptNumber, error: err.message });
            return { 
                ...state, 
                success: false, 
                history: [...history, `### Attempt ${attemptNumber} Failed\nError: ${err.message}`] 
            };
        }
    }

    async _generateProposal(task, history) {
        const prompt = `ROLE: Senior Engineer\nTASK: ${task.content}\nFILES: ${task.data.affected_files}`;
        return await this.aiService.callAI(prompt, {
            provider: task.data.provider || this.config.provider,
            files: task.data.affected_files,
            model: task.data.model || this.config.model,
            timeout: (this.config.timeouts || {}).ai,
            contextService: this.contextService,
            task: { ...task, history }
        });
    }

    _verifyChanges(validationCmd) {
        this.gitService.runValidation(validationCmd, (this.config.timeouts || {}).validation);
    }

    _commitTask(task) {
        const donePath = path.join(this.config.dirs.done, task.fileName);
        let filesToCommit = [donePath];
        if (task.data.affected_files) {
            const affected = Array.isArray(task.data.affected_files) 
                ? task.data.affected_files 
                : task.data.affected_files.split(/["\s,\"]+/).filter(Boolean);
            filesToCommit = filesToCommit.concat(affected);
        }
        this.gitService.commit(`fix(${task.data.task_id}): automated task resolution`, filesToCommit);
    }
}

module.exports = { LoopEngine, EVENTS };
