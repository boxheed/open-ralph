const defaultFs = require("fs");

module.exports = {
    name: "forge",
    /**
     * Builds the command arguments for Forge.
     */
    build: (prompt, { fs = defaultFs } = {}) => {
        let message = prompt;
        if (fs.existsSync(prompt)) {
            try {
                message = fs.readFileSync(prompt, "utf8");
            } catch (e) {
                // Fallback
            }
        }
        return {
            command: "forge",
            args: ["--prompt", message]
        };
    }
};
