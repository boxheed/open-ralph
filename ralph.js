#!/usr/bin/env node 

const fs = require('fs-extra');
const path = require('path');
const matter = require('gray-matter');
const { execSync, spawnSync } = require('child_process');

const DIRS = { TODO: './tasks/todo', DONE: './tasks/done', FAILED: './tasks/failed' };
const MAX_ATTEMPTS = 3;

async function main() {
    // 1. Initial Setup
    Object.values(DIRS).forEach(dir => fs.ensureDirSync(dir));
    
    // 2. Pre-flight Check
    console.log("🔍 Running Pre-flight...");
    try {
        if (execSync('git status --porcelain').toString().trim()) throw new Error("Git is dirty.");
        execSync('gemini --version');
    } catch (e) {
        console.error(`❌ Setup Error: ${e.message}`);
        process.exit(1);
    }

    const files = fs.readdirSync(DIRS.TODO).filter(f => f.endsWith('.md')).sort();
    if (files.length === 0) return console.log("📭 No tasks found.");

    for (const file of files) {
        const filePath = path.join(DIRS.TODO, file);
        await processTask(filePath, file);
    }
}

async function processTask(filePath, fileName) {
    const { data, content } = matter(fs.readFileSync(filePath, 'utf8'));
    console.log(`\n▶️ Starting [${data.task_id}]`);

    let history = [];
    let success = false;

    for (let i = 1; i <= MAX_ATTEMPTS; i++) {
        console.log(`   Loop ${i}/${MAX_ATTEMPTS}: Consulting Gemini...`);

        // Build the CoT Prompt
        const prompt = `
        ROLE: Senior Software Engineer (Autonomous Mode).
        TASK: ${content}
        FILES: ${data.affected_files.join(', ')}
        
        INSTRUCTIONS:
        1. Examine the files and apply the fix.
        2. Verify your work with: ${data.validation_cmd}
        3. Explain your reasoning briefly.
        `;

        // Execution
        const aiOutput = spawnSync('gemini', ['-p', prompt], { encoding: 'utf8' }).stdout || "No output.";
        history.push(`### Attempt ${i}\n${aiOutput}`);

        // Interactive approval
        if (process.argv.includes('--interactive')) {
            console.log("\n⚠️ AI applied changes. Check your editor.");
            execSync('read -p "Press [Enter] to validate and commit..."');
        }

        // Validation
        try {
            execSync(data.validation_cmd, { stdio: 'inherit' });
            execSync(`git add . && git commit -m "Ralph: ${data.task_id} completed"`);
            finalize(filePath, fileName, DIRS.DONE, history);
            success = true;
            break;
        } catch (err) {
            console.warn(`   ❌ Validation failed. Retrying...`);
            if (i === MAX_ATTEMPTS) finalize(filePath, fileName, DIRS.FAILED, history, "Failed validation.");
        }
    }
}

function finalize(oldPath, fileName, targetDir, history, error = null) {
    const report = `\n\n## Ralph Audit Log\n- Status: ${targetDir.toUpperCase()}\n${error ? `- Error: ${error}\n` : ''}\n${history.join('\n\n')}`;
    fs.writeFileSync(oldPath, fs.readFileSync(oldPath, 'utf8') + report);
    fs.moveSync(oldPath, path.join(targetDir, fileName), { overwrite: true });
    console.log(`🏁 Task archived in ${targetDir}`);
}

main().catch(console.error);