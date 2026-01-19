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
  .option("-p, --provider <name>", "AI provider to use")
  .option("-m, --model <name>", "AI model to use")
  .action(async (options) => {
    const isInteractive = !options.provider && process.stdout.isTTY && !process.env.CI;
    await SetupService.runSetup({ 
        provider: options.provider, 
        model: options.model, 
        interactive: isInteractive 
    });
  });

program
  .command("run", { isDefault: true })
  .description("Run the Ralph loop")
  .option("-i, --interactive", "Enable interactive mode")
  .option("-c, --config <path>", "Path to config file")
  .action(async (options) => {
    let config;
    try {
        config = options.config ? loadConfig({ configPath: options.config }) : loadConfig();
    } catch (e) {
        config = { dirs: { todo: './tasks/todo', done: './tasks/done', failed: './tasks/failed' } };
    }

    const isCI = process.env.CI || process.env.HEADLESS || !process.stdout.isTTY;

    // Smart Entry Logic
    if (!config.provider) {
        if (!isCI) {
            console.log("Welcome to Ralph! It looks like you haven't configured an AI provider yet.");
            await SetupService.runSetup({ interactive: true });
            // Reload config after setup
            config = options.config ? loadConfig({ configPath: options.config }) : loadConfig();
            if (!config.provider) {
                console.error("❌ Setup was not completed. Please configure a provider to continue.");
                process.exit(1);
            }
        } else {
            console.error("❌ Error: No AI provider configured. In CI/Headless environments, please provide a config file or use environment variables.");
            process.exit(1);
        }
    }

    if (!(await SetupService.isInitialized())) {
        if (!isCI) {
            await SetupService.runSetup();
        } else {
            console.error("❌ Ralph environment not found. Run `ralph setup` to initialize this project.");
            process.exit(1);
        }
    }

    if (!GitService.isRepoClean()) {
        console.error("❌ Git is dirty. Commit your work first.");
        process.exit(1);
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
