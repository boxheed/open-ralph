module.exports = {
    name: "gemini",
    /**
     * Builds the command arguments for the Gemini CLI.
     * @param {string} prompt - The prompt text.
     * @param {object} context - Context containing { model, files }.
     * @returns {object} - { command: string, args: string[] }
     */
    build: (prompt, { model }) => {
        const args = [prompt, "--yolo"];
        if (model) {
            args.push("--model", model);
        }
        return {
            command: "gemini",
            args
        };
    }
};
