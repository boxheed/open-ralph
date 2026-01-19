#!/usr/bin/env node

const fs = require("fs-extra");
const { LoopEngine } = require("../src/engine/loop.engine");
const { GitService } = require("../src/services/git.service");
const { AIService } = require("../src/services/ai.service");
const { loadConfig } = require("../src/services/config.service");
const { LoggerService } = require("../src/services/logger.service");
const { SetupService } = require("../src/services/setup.service");
const { TaskRepository } = require("../src/services/task.repository");
const { ContextService } = require("../src/services/context.service");
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
  .command("list")
  .description("List all tasks and their status")
  .action(async () => {
    const config = loadConfig();
    const DIRS = {
        TODO: config.dirs.todo,
        DONE: config.dirs.done,
        FAILED: config.dirs.failed
    };

    console.log("\n📋 Ralph Task Status:");

    const printTasks = (dir, label, color) => {
        if (fs.existsSync(dir)) {
            const files = fs.readdirSync(dir).filter(f => f.endsWith(".md")).sort();
            if (files.length > 0) {
                console.log(`\n${label}:`);
                files.forEach(f => console.log(`  ${color}- ${f}\x1b[0m`));
            }
        }
    };

    printTasks(DIRS.TODO, "Pending (TODO)", "\x1b[33m");
    printTasks(DIRS.DONE, "Completed (DONE)", "\x1b[32m");
    printTasks(DIRS.FAILED, "Failed (FAILED)", "\x1b[31m");
    console.log("");
  });

program
  .command("run", { isDefault: true })
  .description("Run the Ralph loop")
  .option("-i, --interactive", "Enable interactive mode")
  .option("-c, --config <path>", "Path to config file")
  .option("-t, --task <filename>", "Run a specific task")
  .option("-q, --quiet", "Minimize output")
  .option("-d, --debug", "Show debug logs")
  .action(async (options) => {
    let config;
    try {
        config = options.config ? loadConfig({ configPath: options.config }) : loadConfig();
    } catch (e) {
        config = { dirs: { todo: './tasks/todo', done: './tasks/done', failed: './tasks/failed' } };
    }

    const logLevel = options.debug ? "DEBUG" : (options.quiet ? "WARN" : "INFO");
    const logger = new LoggerService(logLevel);

    const isCI = process.env.CI || process.env.HEADLESS || !process.stdout.isTTY;

    // Smart Entry Logic
    if (!config.provider) {
        if (!isCI) {
            logger.info("Welcome to Ralph! It looks like you haven't configured an AI provider yet.");
            await SetupService.runSetup({ interactive: true });
            // Reload config after setup
            config = options.config ? loadConfig({ configPath: options.config }) : loadConfig();
            if (!config.provider) {
                logger.error("Setup was not completed. Please configure a provider to continue.");
                process.exit(1);
            }
        } else {
            logger.error("No AI provider configured. In CI/Headless environments, please provide a config file or use environment variables.");
            process.exit(1);
        }
    }

    if (!(await SetupService.isInitialized())) {
        if (!isCI) {
            await SetupService.runSetup();
        } else {
            logger.error("Ralph environment not found. Run `ralph setup` to initialize this project.");
            process.exit(1);
        }
    }

    const gitService = new GitService();
    if (!gitService.isRepoClean()) {
        logger.error("Git is dirty. Commit your work first.");
        process.exit(1);
    }

    const taskRepository = new TaskRepository({ config });
    const aiService = new AIService({ config });
    const contextService = new ContextService(config);

    const engine = new LoopEngine({
        aiService,
        gitService,
        taskRepository,
        contextService,
        config
    });

    const { EngineObserver } = require("../src/services/engine.observer");
    new EngineObserver(engine, logger);

    try {
        await engine.runAll(options.task);
    } catch (err) {
        logger.error(err.message);
        process.exit(1);
    }
  });

program.parse();