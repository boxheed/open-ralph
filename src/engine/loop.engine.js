const defaultFs = require("fs-extra");
const path = require("path");
const defaultMatter = require("gray-matter");
const { execSync: defaultExecSync } = require("child_process");

async function runTask(filePath, fileName, dirs, { 
    aiService, 
    gitService, 
    fs = defaultFs, 
    execSync = defaultExecSync,
    config = {},
    matter = defaultMatter,
    ...options 
}) {
    const { data, content } = matter(fs.readFileSync(filePath, "utf8"));
    let history = [];
    let success = false;
    
    const retries = config.retries || 3;
    
    const provider = data.provider || config.provider || "gemini";

    for (let i = 1; i <= retries; i++) {
        console.log(`   Attempt ${i}/${retries}...`);
        
        const prompt = `ROLE: Senior Engineer\nTASK: ${content}\nFILES: ${data.affected_files}`;
        
        const aiOutput = await aiService.callAI(prompt, {
            provider,
            config,
            files: data.affected_files
        });
        
        history.push(`### Attempt ${i}\n${aiOutput}`);

        if (options.interactive) {
            execSync("read -p \"AI finished. Inspect code, then press [Enter]...\"");
        }

        try {
            gitService.runValidation(data.validation_cmd);
            success = true;
            finalize(filePath, fileName, dirs.DONE, history, null, fs);
            gitService.commit(`fix(${data.task_id}): automated task resolution`);
            break;
        } catch (err) {
            if (i === retries) finalize(filePath, fileName, dirs.FAILED, history, err.message, fs);
        }
    }
}

function finalize(oldPath, fileName, targetDir, history, error, fs) {
    let log = `\n\n## Results\n- Status: ${targetDir}\n${history.join("\n")}`;
    if (error) {
        log += `\n- Error: ${error}`;
    }
    fs.writeFileSync(oldPath, fs.readFileSync(oldPath, "utf8") + log);
    fs.moveSync(oldPath, path.join(targetDir, fileName));
}

module.exports = { runTask };