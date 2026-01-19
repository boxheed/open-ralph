const defaultFs = require("fs-extra");
const path = require("path");
const defaultMatter = require("gray-matter");
const { execSync: defaultExecSync } = require("child_process");
const { ContextService } = require("../services/context.service");

async function runTask(filePath, fileName, dirs, { 
    aiService, 
    gitService, 
    fs = defaultFs, 
    execSync = defaultExecSync,
    config = {}, 
    matter = defaultMatter,
    logger = { info: () => {}, error: () => {}, warn: () => {}, debug: () => {} },
    ...options 
}) {
    const { data, content } = matter(fs.readFileSync(filePath, "utf8"));
    const contextService = new ContextService(config, fs);
    let history = [];
    let success = false;
    
    const retries = config.retries || 3;
    
    const provider = data.provider || config.provider || "gemini";
    const model = data.model || config.model;
    const timeouts = config.timeouts || {};

    for (let i = 1; i <= retries; i++) {
        logger.info(`   Attempt ${i}/${retries}...`);
        
        const prompt = `ROLE: Senior Engineer\nTASK: ${content}\nFILES: ${data.affected_files}`;
        
        const aiOutput = await aiService.callAI(prompt, {
            provider,
            config,
            files: data.affected_files,
            model,
            timeout: timeouts.ai,
            contextService,
            task: { data, content, history }
        });
        
        history.push(`### Attempt ${i}\n${aiOutput}`);

        if (options.interactive) {
            execSync("read -p \"AI finished. Inspect code, then press [Enter]...\"");
        }

        try {
            gitService.runValidation(data.validation_cmd, timeouts.validation);
            success = true;
            finalize(filePath, fileName, dirs.DONE, history, null, fs, logger);

            const movedTaskPath = path.join(dirs.DONE, fileName);
            let filesToCommit = [movedTaskPath];
            if (data.affected_files) {
                if (Array.isArray(data.affected_files)) {
                    filesToCommit = filesToCommit.concat(data.affected_files);
                } else if (typeof data.affected_files === 'string') {
                    filesToCommit = filesToCommit.concat(data.affected_files.split(',').map(s => s.trim()));
                }
            }
            gitService.commit(`fix(${data.task_id}): automated task resolution`, filesToCommit);
            break;
        } catch (err) {
            if (i === retries) finalize(filePath, fileName, dirs.FAILED, history, err.message, fs, logger);
        }
    }
}

function finalize(oldPath, fileName, targetDir, history, error, fs, logger) {
    let log = `\n\n## Results\n- Status: ${targetDir}\n${history.join("\n")}`;
    if (error) {
        log += `\n- Error: ${error}`;
    }

    if (fs.existsSync(oldPath)) {
        fs.writeFileSync(oldPath, fs.readFileSync(oldPath, "utf8") + log);
        fs.moveSync(oldPath, path.join(targetDir, fileName));
    } else {
        const targetPath = path.join(targetDir, fileName);
        if (fs.existsSync(targetPath)) {
            if (logger) logger.info(`Info: Task file not found at ${oldPath}, but found at ${targetPath}. Appending log there.`);
            fs.writeFileSync(targetPath, fs.readFileSync(targetPath, "utf8") + log);
        } else {
            if (logger) logger.warn(`Warning: Task file missing from ${oldPath} AND ${targetPath}. Cannot save execution log.`);
        }
    }
}

module.exports = { runTask };
