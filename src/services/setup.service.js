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

    static async createConfigFile({ fs = defaultFs } = {}) {
        const configPath = path.resolve(process.cwd(), 'ralph.config.js');
        if (!(await fs.pathExists(configPath))) {
            await fs.outputFile(configPath, DEFAULT_CONFIG);
        }
    }

    static async isInitialized({ fs = defaultFs } = {}) {
        // We consider it initialized if the tasks/todo directory exists
        // This is a minimal check as per requirements
        return fs.pathExists(path.resolve(process.cwd(), 'tasks/todo'));
    }

    static async runSetup({ fs = defaultFs } = {}) {
        console.log('Initializing Ralph environment...');
        await this.initializeDirs({ fs });
        await this.seedPersonas({ fs });
        await this.updateGitignore({ fs });
        await this.createConfigFile({ fs });
        console.log('Ralph environment setup complete.');
    }
}

module.exports = { SetupService };