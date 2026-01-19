const { EVENTS } = require("../engine/loop.engine");

/**
 * EngineObserver connects the LoopEngine events to the LoggerService.
 * This decouples the coordination logic from the reporting logic.
 */
class EngineObserver {
    constructor(engine, logger) {
        this.engine = engine;
        this.logger = logger;
        this.init();
    }

    init() {
        this.engine.on(EVENTS.TASK_STARTED, ({ task, count }) => {
            if (task) {
                this.logger.info(`▶️ Running task: ${task.fileName}`);
            } else if (count === 0) {
                this.logger.info("No tasks found in TODO directory.");
            }
        });

        this.engine.on(EVENTS.ATTEMPT_STARTED, ({ attemptNumber }) => {
            this.logger.info(`   Attempt ${attemptNumber}...`);
        });

        this.engine.on(EVENTS.AI_PROPOSAL_RECEIVED, () => {
            this.logger.debug("AI proposal received. Starting validation...");
        });

        this.engine.on(EVENTS.ATTEMPT_SUCCEEDED, ({ attemptNumber }) => {
            this.logger.debug(`Attempt ${attemptNumber} passed validation.`);
        });

        this.engine.on(EVENTS.ATTEMPT_FAILED, ({ attemptNumber, error }) => {
            this.logger.warn(`Attempt ${attemptNumber} failed: ${error}`);
        });

        this.engine.on(EVENTS.TASK_COMPLETED, ({ task }) => {
            this.logger.success(`Task ${task.fileName} completed successfully.`);
        });

        this.engine.on(EVENTS.TASK_FAILED, ({ task, error }) => {
            this.logger.error(`Task ${task.fileName} failed: ${error}`);
        });
    }
}

module.exports = { EngineObserver };
