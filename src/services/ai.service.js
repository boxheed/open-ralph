const { spawnSync } = require('child_process');

function callGemini(prompt) {
    const result = spawnSync('gemini', [prompt, '--allowed-tools', 'run_shell_command', 'write_file', 'replace'], { encoding: 'utf8' });
    if (result.error) throw new Error(`Gemini CLI failed: ${result.error.message}`);
    if (result.status !== 0) throw new Error(`Gemini CLI failed with exit code ${result.status}: ${result.stderr}`);
    return result.stdout || result.stderr || "No output from AI.";
}

module.exports = { callGemini };