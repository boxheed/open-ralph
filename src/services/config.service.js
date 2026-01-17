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

function loadConfig(cwd = process.cwd(), fsImpl = defaultFs) {
    const configPath = path.join(cwd, "ralph.config.js");
    let userConfig = {};

    if (fsImpl.existsSync(configPath)) {
        try {
            userConfig = require(configPath);
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