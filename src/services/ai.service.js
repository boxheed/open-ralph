const defaultSpawn = require("child_process").spawn;
const defaultFs = require("fs-extra");

/**
 * Executes an AI provider command.
 * 
 * Architecture Note:
 * This service executes AI providers using the Strategy Pattern.
 * Providers must export a `build(prompt, context)` function which returns
 * structured command arguments, allowing for safe `spawn` execution.
 */
function callAI(prompt, { spawn = defaultSpawn, fs = defaultFs, provider = "gemini", config = {}, files = "", model = null, timeout = 0, contextService = null, task = null } = {}) {
    return new Promise((resolve, reject) => {
        // If ContextService is provided, build the context file and use its path as the prompt
        if (contextService && task) {
            try {
                prompt = contextService.buildContext(task);
                console.log(`DEBUG: Context built at ${prompt}`);
            } catch (err) {
                return reject(new Error(`Failed to build context: ${err.message}`));
            }
        }

        const providers = config.providers || {};
        const providerConfig = providers[provider];
        
        if (!providerConfig) {
            return reject(new Error(`Unknown provider: ${provider}`));
        }

        // Resolve Model Priority: Task > Provider Default > Global Config
        const resolvedModel = model || providerConfig.defaultModel || config.model || null;

        if (typeof providerConfig.build !== "function") {
             return reject(new Error(`Provider ${provider} must export a 'build' function.`));
        }

        // --- Strategy Pattern (Strict) ---
        // Inject fs into the provider context
        const buildResult = providerConfig.build(prompt, { model: resolvedModel, files, fs });
        const executable = buildResult.command;
        const args = buildResult.args || [];
        
        // Use shell: false for security
        const useShell = false; 
        const commandStringForDebug = `${executable} ${args.map(a => `"${a}"`).join(" ")}`;

        console.log(`DEBUG: Executing command: ${commandStringForDebug}`);
        
        const child = spawn(executable, args, { shell: useShell });
        
        let output = "";
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
                reject(new Error(`${provider} failed with exit code ${code}`));
            } else {
                resolve(output || "No output from AI.");
            }
        });

        child.on("error", (err) => {
            if (timer) clearTimeout(timer);
            reject(new Error(`${provider} failed: ${err.message}`));
        });
    });
}

module.exports = { callAI };
