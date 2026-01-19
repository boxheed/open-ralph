const defaultFs = require("fs");

module.exports = {
    name: "gemini",
    /**
     * Builds the command arguments for the Gemini CLI.
     * @param {string} prompt - The prompt text or path to context file.
     * @param {object} context - Context containing { model, files, fs }.
     * @returns {object} - { command: string, args: string[], stdin: string }
     */
    build: (prompt, { model, fs = defaultFs } = {}) => {
        let args = [];
        
        if (model) {
            args.push("--model", model);
        }
        
        args.push("--yolo");

        let stdin = prompt;
        if (fs.existsSync(prompt)) {
            try {
                stdin = fs.readFileSync(prompt, "utf8");
            } catch (e) {
                // Fallback to prompt path as string if read fails
            }
        }

        return {
            command: "gemini",
            args,
            stdin
        };
    }
};
