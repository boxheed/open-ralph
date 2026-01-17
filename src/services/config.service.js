const defaultFs = require("fs-extra");
const path = require("path");

const DEFAULTS = {
    dirs: {
        todo: "./tasks/todo",
        done: "./tasks/done",
        failed: "./tasks/failed"
    },
    retries: 3,
    model: "gemini-1.5-flash",
    provider: "gemini",
    providers: {
        gemini: {
            command: "gemini \"{prompt}\" --allowed-tools run_shell_command write_file replace"
        },
        aider: {
            command: "aider --message \"{prompt}\" {files}"
        },
        "github-copilot": {
            command: "gh copilot suggest \"{prompt}\""
        },
        forge: {
            command: "forge \"{prompt}\""
        },
        nanocoder: {
            command: "nanocoder \"{prompt}\""
        },
        cline: {
            command: "cline \"{prompt}\""
        },
        opencode: {
            command: "opencode \"{prompt}\""
        },
        "qwen-code": {
            command: "qwen-code \"{prompt}\""
        }
    }
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
        },
        providers: {
            ...DEFAULTS.providers,
            ...(userConfig.providers || {})
        }
    };
}

module.exports = {
    loadConfig,
    DEFAULTS
};