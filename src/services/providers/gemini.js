module.exports = {
    name: "gemini",
    /**
     * Builds the command arguments for the Gemini CLI.
     * @param {string} prompt - The prompt text.
     * @param {object} context - Context containing { model, files }.
     * @returns {object} - { command: string, args: string[] }
     */
    build: (prompt, { model }) => {
        let args = [];
        //specify model if provided
        if (model) {
            args.push("--model", model);
        }
        args.push("--yolo");
        let message = prompt;
        if (fs.existsSync(prompt)) {
            try {
                message = fs.readFileSync(prompt, "utf8");
            } catch (e) {
                // Ignore error, use prompt as is
            }
        }
        args.push(message);

        return {
            command: "gemini",
            args
        };
    }
};
