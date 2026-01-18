const defaultFs = require("fs-extra");
const path = require("path");

const DEFAULTS = {
    dirs: {
        todo: "./tasks/todo",
        done: "./tasks/done",
        failed: "./tasks/failed"
    },
    retries: 3,
    provider: "gemini"
};

function loadProviders(sourceDir, fsImpl = defaultFs) {
    const providers = {};
    
    // 1. Load built-in providers
    const builtInDir = path.join(__dirname, "providers");
    if (fsImpl.existsSync(builtInDir)) {
        fsImpl.readdirSync(builtInDir).forEach(file => {
            if (file.endsWith(".js")) {
                const provider = require(path.join(builtInDir, file));
                providers[provider.name] = provider;
            }
        });
    }

    // 2. Load user-defined providers from project root/.ralph/providers
    const userProvidersDir = path.join(sourceDir, ".ralph", "providers");
    if (fsImpl.existsSync(userProvidersDir)) {
        fsImpl.readdirSync(userProvidersDir).forEach(file => {
            if (file.endsWith(".js")) {
                const provider = require(path.resolve(path.join(userProvidersDir, file)));
                providers[provider.name] = provider;
            }
        });
    }

    return providers;
}

function loadConfig(source = process.cwd(), fsImpl = defaultFs) {
    let configPath;
    let sourceDir = source;

    if (typeof source === "string") {
        configPath = path.join(source, "ralph.config.js");
    } else if (typeof source === "object" && source !== null && source.configPath) {
        configPath = source.configPath;
        sourceDir = path.dirname(configPath);
    } else {
        configPath = path.join(process.cwd(), "ralph.config.js");
        sourceDir = process.cwd();
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

    const providers = loadProviders(sourceDir, fsImpl);

    // Merge user-defined provider overrides from ralph.config.js
    if (userConfig.providers) {
        for (const [name, override] of Object.entries(userConfig.providers)) {
            providers[name] = {
                ...(providers[name] || { name }),
                ...override
            };
        }
    }

    return {
        ...DEFAULTS,
        ...userConfig,
        dirs: {
            ...DEFAULTS.dirs,
            ...(userConfig.dirs || {})
        },
        providers
    };
}

module.exports = {
    loadConfig,
    DEFAULTS
};