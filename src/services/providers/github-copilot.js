const defaultFs = require("fs");

module.exports = {
    name: "github-copilot",
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
            command: "copilot",
            args: ["--allow-all-tools", "--prompt", message]
        };
    }
};