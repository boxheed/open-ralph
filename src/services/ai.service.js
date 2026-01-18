const defaultSpawn = require("child_process").spawn;

/**
 * Executes an AI provider command.
 * 
 * Architecture Note:
 * This service executes AI providers using the Strategy Pattern.
 * Providers must export a `build(prompt, context)` function which returns
 * structured command arguments, allowing for safe `spawn` execution.
 */
function callAI(prompt, { spawn = defaultSpawn, provider = "gemini", config = {}, files = "", model = null, timeout = 0 } = {}) {
    return new Promise((resolve, reject) => {
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
        const buildResult = providerConfig.build(prompt, { model: resolvedModel, files });
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
