const defaultFs = require("fs");

module.exports = {
    name: "forge",
    /**
     * Builds the command arguments for Forge.
     */
    build: (prompt, { fs = defaultFs } = {}) => {
        let stdin = prompt;
        if (fs.existsSync(prompt)) {
            try {
                stdin = fs.readFileSync(prompt, "utf8");
            } catch (e) {
                // Fallback
            }
        }
        return {
            command: "forge",
            args: [], // Use stdin instead of --prompt
            stdin
        };
    }
};