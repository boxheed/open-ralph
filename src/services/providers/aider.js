module.exports = {
    name: "aider",
    defaultModel: null, // Aider handles its own defaults
    /**
     * Builds the command arguments for Aider.
     * @param {string} prompt - The prompt text.
     * @param {object} context - Context containing { model, files }.
     * @returns {object} - { command: string, args: string[] }
     */
    build: (prompt, { model, files }) => {
        let message = prompt;
        
        const args = [];
        
        if (model) {
            args.push("--model", model);
        }
        args.push("--message-file", prompt);
        
        return {
            command: "aider",
            args
        };
    }
};