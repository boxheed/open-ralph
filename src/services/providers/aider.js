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
        const args = ["--message", prompt];
        
        if (files) {
            // Split files string into array if it's space-separated, or just push if single
            // Ideally, files should be passed as an array from the engine, but currently it's a string
            // We'll split by comma or space to be safe, assuming file paths don't contain them for now.
            // The previous logic passed the raw string "file1.js file2.js". 
            // Aider expects `aider file1.js file2.js`.
            // So we need to push them as separate args.
            const fileList = files.split(/[\s,]+/).filter(f => f.trim().length > 0);
            args.push(...fileList);
        }

        if (model) {
            args.push("--model", model);
        }
        
        return {
            command: "aider",
            args
        };
    }
};