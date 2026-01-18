const defaultFs = require("fs");

module.exports = {
    name: "opencode",
    build: (prompt, { fs = defaultFs } = {}) => {
        let message = prompt;
        if (fs.existsSync(prompt)) {
            try {
                message = fs.readFileSync(prompt, "utf8");
            } catch (e) {
                // Ignore error, use prompt as is
            }
        }
        return {
            command: "opencode",
            args: [message]
        };
    }
};