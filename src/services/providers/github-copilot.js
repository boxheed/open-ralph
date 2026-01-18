module.exports = {
    name: "github-copilot",
    build: (prompt) => ({
        command: "gh",
        args: ["copilot", "suggest", prompt]
    })
};