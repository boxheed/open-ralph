const defaultSpawn = require("child_process").spawn;

function callAI(prompt, { spawn = defaultSpawn, provider = "gemini", config = {}, files = "", model = null } = {}) {
    return new Promise((resolve, reject) => {
        const providers = config.providers || {};
        const providerConfig = providers[provider];
        
        if (!providerConfig) {
            return reject(new Error(`Unknown provider: ${provider}`));
        }

        let commandTemplate = providerConfig.command;
        if (!commandTemplate) {
             return reject(new Error(`No command template for provider: ${provider}`));
        }
        
        // Priority: Frontmatter model > Provider default model > Global config model
        const resolvedModel = model || providerConfig.defaultModel || config.model || "";

        // Allow provider to customize the prompt
        const finalPrompt = providerConfig.getPrompt ? providerConfig.getPrompt(prompt, { model: resolvedModel, files }) : prompt;
        
        const safePrompt = finalPrompt.replace(/"/g, "\\\"");
        const safeFiles = files;
        const safeModel = resolvedModel;

        const command = commandTemplate
            .replace(/{prompt}/g, `"${safePrompt}"`)
            .replace(/{files}/g, safeFiles)
            .replace(/{model}/g, safeModel);

        const child = spawn(command, [], { shell: true });
        
        let output = "";

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
            if (code !== 0) {
                reject(new Error(`${provider} failed with exit code ${code}`));
            } else {
                resolve(output || "No output from AI.");
            }
        });

        child.on("error", (err) => {
            reject(new Error(`${provider} failed: ${err.message}`));
        });
    });
}

module.exports = { callAI };
