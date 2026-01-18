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
        // If prompt is a file path to the context file, use --text flag
        if (prompt.endsWith(".md") && (prompt.includes(".ralph") || prompt.includes("/context/"))) {
            args = ["--text", prompt, "--yolo"];
        } else {
            args = [prompt, "--yolo"];
        }

        if (model) {
            args.push("--model", model);
        }
        return {
            command: "gemini",
            args
        };
    }
};
