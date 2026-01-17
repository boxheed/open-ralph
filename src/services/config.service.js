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
            command: "gemini {prompt} --model {model} --allowed-tools run_shell_command write_file replace"
        },
        aider: {
            command: "aider --message {prompt} {files}"
        },
        "github-copilot": {
            command: "gh copilot suggest {prompt}"
        },
        forge: {
            command: "forge {prompt}"
        },
        nanocoder: {
            command: "nanocoder {prompt}"
        },
        cline: {
            command: "cline {prompt}"
        },
        opencode: {
            command: "opencode {prompt}"
        },
        "qwen-code": {
            command: "qwen-code {prompt}"
        }
    }
};

function loadConfig(source = process.cwd(), fsImpl = defaultFs) {
    let configPath;

    if (typeof source === "object" && source !== null && source.configPath) {
        configPath = source.configPath;
    } else {
        const dir = typeof source === "string" ? source : process.cwd();
        const jsPath = path.join(dir, "ralph.config.js");
        const jsonPath = path.join(dir, "ralph.json");
        
        if (fsImpl.existsSync(jsPath)) {
            configPath = jsPath;
        } else if (fsImpl.existsSync(jsonPath)) {
            configPath = jsonPath;
        } else {
            configPath = jsPath; // Default to jsPath
        }
    }

    let userConfig = {};

    if (fsImpl.existsSync(configPath)) {
        try {
            const absoluteConfigPath = path.resolve(configPath);
            if (path.extname(absoluteConfigPath) === ".json") {
                userConfig = JSON.parse(fsImpl.readFileSync(absoluteConfigPath, "utf8"));
            } else {
                userConfig = require(absoluteConfigPath);
            }
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
