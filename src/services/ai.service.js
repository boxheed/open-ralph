const defaultSpawn = require("child_process").spawn;
const defaultFs = require("fs-extra");

/**
 * AIService orchestrates the interaction with AI providers.
 * It uses the Strategy Pattern to execute different AI CLI tools.
 */
class AIService {
    constructor({ spawn = defaultSpawn, fs = defaultFs, config = {} } = {}) {
        this.spawn = spawn;
        this.fs = fs;
        this.config = config;
    }

    /**
     * Calls the AI provider to generate a response.
     */
    async callAI(prompt, { provider = null, files = "", model = null, timeout = 0, contextService = null, task = null } = {}) {
        const activeProvider = provider || this.config.provider;

        if (!activeProvider) {
            throw new Error("No AI provider configured. Please check your configuration.");
        }

        // Handle Context Building
        let finalPrompt = prompt;
        if (contextService && task) {
            finalPrompt = contextService.buildContext(task);
        }

        const providers = this.config.providers || {};
        const providerConfig = providers[activeProvider];
        
        if (!providerConfig) {
            throw new Error(`Unknown provider: ${activeProvider}`);
        }

        // Resolve Model Priority: Task > Provider Default > Global Config
        const resolvedModel = model || providerConfig.defaultModel || this.config.model || null;

        if (typeof providerConfig.build !== "function") {
             throw new Error(`Provider ${activeProvider} must export a 'build' function.`);
        }

        const buildResult = providerConfig.build(finalPrompt, { model: resolvedModel, files, fs: this.fs });
        const executable = buildResult.command;
        const args = buildResult.args || [];
        const stdin = buildResult.stdin || null;
        
        return new Promise((resolve, reject) => {
            const child = this.spawn(executable, args, { shell: false });
            
            let output = "";

            if (stdin) {
                child.stdin.write(stdin);
                child.stdin.end();
            }
            let timer = null;

            if (timeout > 0) {
                timer = setTimeout(() => {
                    child.kill();
                    reject(new Error(`AI process timed out after ${timeout}ms`));
                }, timeout);
            }

            child.stdout.on("data", (data) => {
                const str = data.toString();
                process.stdout.write(str);
                output += str;
            });

            child.stderr.on("data", (data) => {
                const str = data.toString();
                process.stderr.write(str);
                output += str;
            });

            child.on("close", (code) => {
                if (timer) clearTimeout(timer);
                if (code !== 0) {
                    reject(new Error(`${activeProvider} failed with exit code ${code}`));
                } else {
                    resolve(output || "No output from AI.");
                }
            });

            child.on("error", (err) => {
                if (timer) clearTimeout(timer);
                reject(new Error(`${activeProvider} failed: ${err.message}`));
            });
        });
    }
}

module.exports = { AIService };