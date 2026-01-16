const defaultSpawn = require('child_process').spawn;

function callGemini(prompt, { spawn = defaultSpawn } = {}) {
    return new Promise((resolve, reject) => {
        const child = spawn('gemini', [prompt, '--allowed-tools', 'run_shell_command', 'write_file', 'replace']);
        
        let output = '';

        child.stdout.on('data', (data) => {
            const str = data.toString();
            process.stdout.write(str);
            output += str;
        });

        child.stderr.on('data', (data) => {
            const str = data.toString();
            process.stderr.write(str);
            output += str;
        });

        child.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Gemini CLI failed with exit code ${code}`));
            } else {
                resolve(output || "No output from AI.");
            }
        });

        child.on('error', (err) => {
            reject(new Error(`Gemini CLI failed: ${err.message}`));
        });
    });
}

module.exports = { callGemini };