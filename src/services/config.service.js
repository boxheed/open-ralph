const defaultFs = require("fs-extra");
const path = require("path");

const DEFAULTS = {
    dirs: {
        todo: "./tasks/todo",
        done: "./tasks/done",
        failed: "./tasks/failed",
        personas: "./.ralph/personas"
    },
    defaultPersona: "ralph",
    retries: 3,
    timeouts: {
        ai: 1200000, // 20 minutes
        validation: 900000 // 15 minutes
    }
};

function loadProviders(sourceDir, fsImpl = defaultFs) {
    const providers = {};
    
    // 1. Load built-in providers
    const builtInDir = path.join(__dirname, "providers");
    if (fsImpl.existsSync(builtInDir)) {
        fsImpl.readdirSync(builtInDir).forEach(file => {
            if (file.endsWith(".js") && !file.endsWith(".test.js") && !file.endsWith(".spec.js")) {
                try {
                    const provider = require(path.join(builtInDir, file));
                    if (provider && provider.name) {
                        providers[provider.name] = provider;
                    }
                } catch (error) {
                    console.warn(`Warning: Failed to load built-in provider ${file}: ${error.message}`);
                }
            }
        });
    }

    // 2. Load user-defined providers from project root/.ralph/providers
    const userProvidersDir = path.resolve(sourceDir, ".ralph", "providers");
    if (fsImpl.existsSync(userProvidersDir)) {
        fsImpl.readdirSync(userProvidersDir).forEach(file => {
            if (file.endsWith(".js") && !file.endsWith(".test.js") && !file.endsWith(".spec.js")) {
                try {
                    const providerPath = path.resolve(userProvidersDir, file);
                    const provider = require(providerPath);
                    if (provider && provider.name) {
                        providers[provider.name] = provider;
                    } else {
                        console.warn(`Warning: Custom provider in ${file} is missing a 'name' property. Skipping.`);
                    }
                } catch (error) {
                    console.warn(`Warning: Failed to load custom provider ${file}: ${error.message}`);
                }
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