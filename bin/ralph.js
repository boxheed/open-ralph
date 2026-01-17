#!/usr/bin/env node

const fs = require("fs-extra");
const { runTask } = require("../src/engine/loop.engine");
const GitService = require("../src/services/git.service");
const { callGemini } = require("../src/services/ai.service");
const { loadConfig } = require("../src/services/config.service");

async function main() {
    if (!GitService.isRepoClean()) {
        console.error("❌ Git is dirty. Commit your work first.");
        process.exit(1);
    }

    const config = loadConfig();
    const DIRS = { 
        TODO: config.dirs.todo, 
        DONE: config.dirs.done, 
        FAILED: config.dirs.failed 
    };

    const files = fs.readdirSync(DIRS.TODO).filter(f => f.endsWith(".md")).sort();
    
    // Manual Dependency Injection
    const services = {
        aiService: { callGemini },
        gitService: GitService
    };

    for (const file of files) {
        await runTask(`${DIRS.TODO}/${file}`, file, DIRS, {
            interactive: process.argv.includes("--interactive"),
            config,
            ...services
        });
    }
}

main().catch(console.error);