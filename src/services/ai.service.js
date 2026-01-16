const { spawnSync } = require('child_process');

function callGemini(prompt) {
    const result = spawnSync('gemini', ['-p', prompt], { encoding: 'utf8' });
    if (result.error) throw new Error(`Gemini CLI failed: ${result.error.message}`);
    return result.stdout || result.stderr || "No output from AI.";
}

module.exports = { callGemini };