const LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
};

class LoggerService {
    constructor(level = "INFO") {
        this.level = LEVELS[level.toUpperCase()] !== undefined ? LEVELS[level.toUpperCase()] : LEVELS.INFO;
    }

    debug(message, ...args) {
        if (this.level <= LEVELS.DEBUG) {
            console.debug(`[DEBUG] ${message}`, ...args);
        }
    }

    info(message, ...args) {
        if (this.level <= LEVELS.INFO) {
            console.log(`[INFO] ${message}`, ...args);
        }
    }

    warn(message, ...args) {
        if (this.level <= LEVELS.WARN) {
            console.warn(`[WARN] ${message}`, ...args);
        }
    }

    error(message, ...args) {
        if (this.level <= LEVELS.ERROR) {
            console.error(`[ERROR] ${message}`, ...args);
        }
    }
}

module.exports = { LoggerService, LEVELS };
