import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GitService } from './git.service';

describe('GitService', () => {
    let mockExecSync;
    let gitService;

    beforeEach(() => {
        mockExecSync = vi.fn();
        gitService = new GitService({ execSync: mockExecSync });
    });

    describe('isRepoClean', () => {
        it('should return true when git status is empty', () => {
            mockExecSync.mockReturnValue(Buffer.from('')); // Empty string buffer
            expect(gitService.isRepoClean()).toBe(true);
            expect(mockExecSync).toHaveBeenCalledWith('git status --porcelain');
        });

        it('should return false when git status has content', () => {
            mockExecSync.mockReturnValue(Buffer.from(' M modified_file.js\n'));
            expect(gitService.isRepoClean()).toBe(false);
        });

        it('should trim whitespace from output', () => {
             mockExecSync.mockReturnValue(Buffer.from('   '));
             expect(gitService.isRepoClean()).toBe(true);
        });
    });

    describe('commit', () => {
        it('should execute git add and git commit', () => {
            const message = 'feat: test commit';
            gitService.commit(message);

            expect(mockExecSync).toHaveBeenCalledWith('git add .');
            expect(mockExecSync).toHaveBeenCalledWith(`git commit -m "${message}"`);
        });
    });

    describe('runValidation', () => {
        it('should execute the command with stdio inherit', () => {
            const cmd = 'npm test';
            gitService.runValidation(cmd);

            expect(mockExecSync).toHaveBeenCalledWith(cmd, { stdio: 'inherit' });
        });
    });
});
