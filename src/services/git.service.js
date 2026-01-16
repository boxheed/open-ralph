const { execSync: defaultExecSync } = require('child_process');

class GitService {
    constructor({ execSync = defaultExecSync } = {}) {
        this.execSync = execSync;
    }

    isRepoClean() {
        return this.execSync('git status --porcelain').toString().trim().length === 0;
    }

    commit(message) {
        this.execSync('git add .');
        this.execSync(`git commit -m "${message}"`);
    }

    runValidation(cmd) {
        this.execSync(cmd, { stdio: 'inherit' });
    }
}

const defaultInstance = new GitService();
module.exports = defaultInstance;
module.exports.GitService = GitService;