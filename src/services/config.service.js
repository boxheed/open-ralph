const defaultFs = require("fs-extra");
const path = require("path");

const DEFAULTS = {
    dirs: {
        todo: "./tasks/todo",
        done: "./tasks/done",
        failed: "./tasks/failed"
    },
    retries: 3,
    model: "gemini-1.5-flash"
};

function loadConfig(source = process.cwd(), fsImpl = defaultFs) {
    let configPath;

    if (typeof source === "string") {
        configPath = path.join(source, "ralph.config.js");
    } else if (typeof source === "object" && source !== null && source.configPath) {
        configPath = source.configPath;
    } else {
        configPath = path.join(process.cwd(), "ralph.config.js");
    }

    let userConfig = {};

    if (fsImpl.existsSync(configPath)) {
        try {
            const absoluteConfigPath = path.resolve(configPath);
            userConfig = require(absoluteConfigPath);
        } catch (error) {
            console.warn(`Warning: Failed to load config from ${configPath}`, error.message);
        }
    }

    return {
        ...DEFAULTS,
        ...userConfig,
        dirs: {
            ...DEFAULTS.dirs,
            ...(userConfig.dirs || {})
        }
    };
}

module.exports = {
    loadConfig,
    DEFAULTS
};
