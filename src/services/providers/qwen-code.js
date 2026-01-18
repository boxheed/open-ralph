module.exports = {
    name: "qwen-code",
    build: (prompt) => ({
        command: "qwen-code",
        args: [prompt]
    })
};