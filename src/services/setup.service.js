const defaultFs = require('fs-extra');
const path = require('path');

const REQUIRED_DIRS = [
    'tasks/todo',
    'tasks/done',
    'tasks/failed',
    '.ralph/personas',
    '.ralph/context'
];

const PERSONAS = {
    'ralph.md': `ROLE: Senior Software Engineer
You are Ralph, an autonomous coding agent.
- You focus on clean, working code.
- You strictly follow the Test-Driven Development (TDD) cycle.
- You do not ask clarifying questions; you use your best judgment.`,
    'architect.md': `ROLE: Software Architect
You are a Staff Engineer responsible for system design and code quality.
- Focus on patterns, scalability, and security.
- Critique implementations for "separation of concerns".
- Prefer interfaces and abstractions over direct coupling.`
};

const DEFAULT_CONFIG = `module.exports = {
    dirs: {
        todo: 'tasks/todo',
        done: 'tasks/done',
        failed: 'tasks/failed'
    }
};

`;

class SetupService {
    static async initializeDirs({ fs = defaultFs } = {}) {
        for (const dir of REQUIRED_DIRS) {
            await fs.ensureDir(path.resolve(process.cwd(), dir));
        }
    }

    static async seedPersonas({ fs = defaultFs } = {}) {
        const personasDir = path.resolve(process.cwd(), '.ralph/personas');
        for (const [filename, content] of Object.entries(PERSONAS)) {
            const filePath = path.join(personasDir, filename);
            if (!(await fs.pathExists(filePath))) {
                await fs.outputFile(filePath, content);
            }
        }
    }

    static async updateGitignore({ fs = defaultFs } = {}) {
        const gitignorePath = path.resolve(process.cwd(), '.gitignore');
        const ignorePattern = '.ralph/context';
        
        if (await fs.pathExists(gitignorePath)) {
            const content = await fs.readFile(gitignorePath, 'utf8');
            if (!content.includes(ignorePattern)) {
                await fs.appendFile(gitignorePath, `\n${ignorePattern}\n`);
            }
        } else {
            await fs.writeFile(gitignorePath, `${ignorePattern}\n`);
        }
    }

    static async createConfigFile({ fs = defaultFs, provider, model } = {}) {
        const configPath = path.resolve(process.cwd(), 'ralph.config.js');
        if (!(await fs.pathExists(configPath))) {
            let configContent = DEFAULT_CONFIG;
            if (provider) {
                configContent = `module.exports = {
    provider: '${provider}',
    ${model ? `model: '${model}',` : ''}
    dirs: {
        todo: 'tasks/todo',
        done: 'tasks/done',
        failed: 'tasks/failed'
    }
};
`;
            }
            await fs.outputFile(configPath, configContent);
        } else if (provider) {
            let content = await fs.readFile(configPath, 'utf8');
            
            // Basic idempotency: update or add provider/model
            if (content.includes('provider:')) {
                content = content.replace(/provider:\s*['"].*['"]/, `provider: '${provider}'`);
            } else {
                content = content.replace(/module\.exports\s*=\s*\{/, `module.exports = {\n    provider: '${provider}',`);
            }

            if (model) {
                if (content.includes('model:')) {
                    content = content.replace(/model:\s*['"].*['"]/, `model: '${model}'`);
                } else {
                    content = content.replace(/module\.exports\s*=\s*\{/, `module.exports = {\n    model: '${model}',`);
                }
            }
            await fs.writeFile(configPath, content);
        }
    }

    static async isInitialized({ fs = defaultFs } = {}) {
        return fs.pathExists(path.resolve(process.cwd(), 'tasks/todo'));
    }

    static async getAvailableProviders() {
        // We load config to get available providers
        const { loadConfig } = require('./config.service');
        const config = loadConfig();
        return Object.keys(config.providers);
    }

    static async runSetup({ fs = defaultFs, provider, model, interactive = false } = {}) {
        if (interactive) {
            try {
                const { select, input } = await import('@inquirer/prompts');
                
                console.log('Welcome to Ralph! Let\'s get you set up.');
                
                const providers = await this.getAvailableProviders();
                
                const selectedProvider = await select({
                    message: 'Select an AI provider:',
                    choices: providers.map(p => ({ name: p, value: p }))
                });

                const selectedModel = await input({
                    message: 'Enter the model name (optional):',
                    default: ''
                });

                provider = selectedProvider;
                model = selectedModel || undefined;
            } catch (error) {
                if (error.name === 'ExitPromptError') {
                    console.log('\nSetup cancelled. You can run "ralph setup" anytime to configure your provider.');
                    return;
                }
                throw error;
            }
        }

        console.log('Initializing Ralph environment...');
        await this.initializeDirs({ fs });
        await this.seedPersonas({ fs });
        await this.updateGitignore({ fs });
        await this.createConfigFile({ fs, provider, model });
        console.log('Ralph environment setup complete.');
    }
}

module.exports = { SetupService };