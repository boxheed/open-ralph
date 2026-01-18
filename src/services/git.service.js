const { execSync: defaultExecSync } = require('child_process');

class GitService {
    constructor({ execSync = defaultExecSync } = {}) {
        this.execSync = execSync;
    }

    isRepoClean() {
        return this.execSync('git status --porcelain').toString().trim().length === 0;
    }

    commit(message, paths = []) {
        if (paths && paths.length > 0) {
            const pathArgs = paths.map(p => `"${p}"`).join(' ');
            this.execSync(`git add ${pathArgs}`);
        } else {
            this.execSync('git add .');
        }
        this.execSync(`git commit -m "${message}"`);
    }

    runValidation(cmd, timeout = 0) {
        const options = { stdio: 'inherit' };
        if (timeout > 0) {
            options.timeout = timeout;
        }
        this.execSync(cmd, options);
    }
}

const defaultInstance = new GitService();
module.exports = defaultInstance;
module.exports.GitService = GitService;