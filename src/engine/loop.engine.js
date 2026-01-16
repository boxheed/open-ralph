const fs = require('fs-extra');
const path = require('path');
const matter = require('gray-matter');
const { execSync } = require('child_process');

async function runTask(filePath, fileName, dirs, { aiService, gitService, ...options }) {
    const { data, content } = matter(fs.readFileSync(filePath, 'utf8'));
    let history = [];
    let success = false;

    for (let i = 1; i <= 3; i++) {
        console.log(`   Attempt ${i}/3...`);
        
        const prompt = `ROLE: Senior Engineer\nTASK: ${content}\nFILES: ${data.affected_files}`;
        const aiOutput = await aiService.callGemini(prompt);
        history.push(`### Attempt ${i}\n${aiOutput}`);

        if (options.interactive) {
            execSync('read -p "AI finished. Inspect code, then press [Enter]..."');
        }

        try {
            gitService.runValidation(data.validation_cmd);
            gitService.commit(`Ralph: ${data.task_id} fixed`);
            success = true;
            finalize(filePath, fileName, dirs.DONE, history);
            break;
        } catch (err) {
            if (i === 3) finalize(filePath, fileName, dirs.FAILED, history, err.message);
        }
    }
}

function finalize(oldPath, fileName, targetDir, history, error) {
    const log = `\n\n## Results\n- Status: ${targetDir}\n${history.join('\n')}`;
    fs.writeFileSync(oldPath, fs.readFileSync(oldPath, 'utf8') + log);
    fs.moveSync(oldPath, path.join(targetDir, fileName));
}

module.exports = { runTask };
