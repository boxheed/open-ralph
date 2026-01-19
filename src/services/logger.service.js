const LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    NONE: 4
};

const COLORS = {
    RESET: "\x1b[0m",
    RED: "\x1b[31m",
    YELLOW: "\x1b[33m",
    BLUE: "\x1b[34m",
    GRAY: "\x1b[90m"
};

class LoggerService {
    constructor(level = "INFO") {
        this.level = LEVELS[level.toUpperCase()] !== undefined ? LEVELS[level.toUpperCase()] : LEVELS.INFO;
    }

    debug(message, ...args) {
        if (this.level <= LEVELS.DEBUG) {
            console.debug(`${COLORS.GRAY}[DEBUG]${COLORS.RESET} ${message}`, ...args);
        }
    }

    info(message, ...args) {
        if (this.level <= LEVELS.INFO) {
            console.log(`${COLORS.BLUE}[INFO]${COLORS.RESET} ${message}`, ...args);
        }
    }

    warn(message, ...args) {
        if (this.level <= LEVELS.WARN) {
            console.warn(`${COLORS.YELLOW}[WARN]${COLORS.RESET} ${message}`, ...args);
        }
    }

    error(message, ...args) {
        if (this.level <= LEVELS.ERROR) {
            console.error(`${COLORS.RED}[ERROR]${COLORS.RESET} ${message}`, ...args);
        }
    }

    success(message, ...args) {
        if (this.level <= LEVELS.INFO) {
            console.log(`\x1b[32m[SUCCESS]\x1b[0m ${message}`, ...args);
        }
    }
}

module.exports = { LoggerService, LEVELS };
