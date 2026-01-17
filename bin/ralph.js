#!/usr/bin/env node

const fs = require("fs-extra");
const { runTask } = require("../src/engine/loop.engine");
const GitService = require("../src/services/git.service");
const { callAI } = require("../src/services/ai.service");
const { loadConfig } = require("../src/services/config.service");
const { Command } = require("commander");
const path = require("path");
const pkg = require("../package.json");

const program = new Command();

program
  .name("ralph")
  .description(pkg.description)
  .version(pkg.version);

program
  .command("run", { isDefault: true })
  .description("Run the Ralph loop")
  .option("-i, --interactive", "Enable interactive mode")
  .option("-c, --config <path>", "Path to config file")
  .action(async (options) => {
    if (!GitService.isRepoClean()) {
        console.error("❌ Git is dirty. Commit your work first.");
        process.exit(1);
    }

    let config;
    if (options.config) {
        config = loadConfig({ configPath: options.config });
    } else {
        config = loadConfig();
    }

    const DIRS = { 
        TODO: config.dirs.todo, 
        DONE: config.dirs.done, 
        FAILED: config.dirs.failed 
    };

    await fs.ensureDir(DIRS.TODO);
    await fs.ensureDir(DIRS.DONE);
    await fs.ensureDir(DIRS.FAILED);

    const files = fs.readdirSync(DIRS.TODO).filter(f => f.endsWith(".md")).sort();
    
    const services = {
        aiService: { callAI },
        gitService: GitService
    };

    if (files.length === 0) {
        console.log("No tasks found in TODO directory.");
    }

    for (const file of files) {
        await runTask(`${DIRS.TODO}/${file}`, file, DIRS, {
            interactive: options.interactive || false,
            config,
            ...services
        });
    }
  });

program.parse();
