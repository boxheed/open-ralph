const { execSync } = require('child_process');

const GitService = {
    isRepoClean() {
        return execSync('git status --porcelain').toString().trim().length === 0;
    },
    commit(message) {
        execSync('git add .');
        execSync(`git commit -m "${message}"`);
    },
    runValidation(cmd) {
        execSync(cmd, { stdio: 'inherit' });
    }
};

module.exports = GitService;