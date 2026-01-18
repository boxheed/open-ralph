const defaultSpawn = require("child_process").spawn;

/**
 * Executes an AI provider command.
 * 
 * Architecture Note:
 * This service supports two types of providers:
 * 1. Strategy Providers (Preferred): Export a `build(prompt, context)` function. 
 *    These return structured { command, args } allowing for safer `spawn` execution (shell: false).
 * 2. Template Providers (Legacy): Export a `command` string with placeholders.
 *    These require `shell: true` and rely on regex replacement, which is more fragile.
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

        let executable;
        let args = [];
        let useShell = false;
        let commandStringForDebug = "";

        if (typeof providerConfig.build === "function") {
            // --- Strategy Pattern (New) ---
            const buildResult = providerConfig.build(prompt, { model: resolvedModel, files });
            executable = buildResult.command;
            args = buildResult.args || [];
            
            // On Windows, calling npm binaries requires shell: true or appending .cmd. 
            // We'll stick to shell: false for security on Linux/Mac, but might need shell: true if cross-platform is a hard requirement.
            // For this environment (Linux), shell: false is preferred for security. 
            useShell = false; 
            commandStringForDebug = `${executable} ${args.map(a => `"${a}"`).join(" ")}`;

        } else if (providerConfig.command) {
            // --- Legacy Template Pattern ---
            // Fallback for user-defined providers that haven't migrated
            useShell = true;
            
            // Allow provider to customize the prompt (Legacy hook)
            const finalPrompt = providerConfig.getPrompt ? providerConfig.getPrompt(prompt, { model: resolvedModel, files }) : prompt;
            
            const safePrompt = finalPrompt
                .replace(/\\/g, "\\\\")
                .replace(/"/g, '\\"')
                .replace(/\$/g, "\\$")
                .replace(/`/g, "\\`")
                .replace(/\n/g, "\\n");
            
            const safeFiles = files;
            const safeModel = resolvedModel;

            let cmdStr = providerConfig.command;

            if (safeModel) {
                cmdStr = cmdStr
                    .replace(/{prompt}/g, `"${safePrompt}"`) 
                    .replace(/{files}/g, safeFiles)
                    .replace(/{model}/g, safeModel);
            } else {
                // "No Model" Handling: Clean up flags
                cmdStr = cmdStr
                    .replace(/\s+(-m|--model)\s+{model}/g, "")
                    .replace(/{model}/g, "")
                    .replace(/{prompt}/g, `"${safePrompt}"`) 
                    .replace(/{files}/g, safeFiles);
                
                cmdStr = cmdStr.replace(/\s+/g, " ").trim();
            }
            
            executable = cmdStr;
            args = [];
            commandStringForDebug = cmdStr;
        } else {
             return reject(new Error(`Provider ${provider} must export a 'build' function or 'command' template.`));
        }

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