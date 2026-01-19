#!/usr/bin/env node

const fs = require("fs-extra");
const { runTask } = require("../src/engine/loop.engine");
const GitService = require("../src/services/git.service");
const { callAI } = require("../src/services/ai.service");
const { loadConfig } = require("../src/services/config.service");
const { LoggerService } = require("../src/services/logger.service");
const { SetupService } = require("../src/services/setup.service");
const { Command } = require("commander");
const path = require("path");
const pkg = require("../package.json");

const program = new Command();

program
  .name("ralph")
  .description(pkg.description)
  .version(pkg.version);

program
  .command("setup")
  .description("Initialize the Ralph environment")
  .action(async () => {
    await SetupService.runSetup();
  });

program
  .command("run", { isDefault: true })
  .description("Run the Ralph loop")
  .option("-i, --interactive", "Enable interactive mode")
  .option("-c, --config <path>", "Path to config file")
  .action(async (options) => {
    if (!(await SetupService.isInitialized())) {
        console.error("❌ Ralph environment not found. Run `ralph setup` to initialize this project.");
        process.exit(1);
    }

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

    const files = fs.readdirSync(DIRS.TODO).filter(f => f.endsWith(".md")).sort();
    
    const logger = new LoggerService("INFO");

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
            logger,
            ...services
        });
    }
  });

program.parse();
