import { describe, it, expect } from 'vitest';
const { deriveCommitMessage } = require('./task.msg.service');

describe('TaskMsgService', () => {
    describe('deriveCommitMessage', () => {
        it('should derive fix type from filename with FIX', () => {
            const task = {
                fileName: '0015-FIX-logic-error.md',
                data: { task_id: 'L-01' },
                content: '# Objective\nFix the logic error in the parser.'
            };
            expect(deriveCommitMessage(task)).toBe('fix(L-01): Fix the logic error in the parser.');
        });

        it('should derive test type from filename with TEST', () => {
            const task = {
                fileName: '0016-TEST-new-feature.md',
                data: { task_id: 'T-02' },
                content: '# Objective\nAdd tests for the new feature.'
            };
            expect(deriveCommitMessage(task)).toBe('test(T-02): Add tests for the new feature.');
        });

        it('should derive docs type from filename with DOCS', () => {
            const task = {
                fileName: '0017-DOCS-readme.md',
                data: { task_id: 'D-03' },
                content: '# Objective\nUpdate the README file.'
            };
            expect(deriveCommitMessage(task)).toBe('docs(D-03): Update the README file.');
        });

        it('should default to feat type', () => {
            const task = {
                fileName: '0018-OTHER-something.md',
                data: { task_id: 'S-04' },
                content: '# Objective\nDo something.'
            };
            expect(deriveCommitMessage(task)).toBe('feat(S-04): Do something.');
        });

        it('should use first H1 if Objective is missing', () => {
            const task = {
                fileName: '0019-FEAT-h1-test.md',
                data: { task_id: 'H1-01' },
                content: '# First H1 Header\nSome details.'
            };
            expect(deriveCommitMessage(task)).toBe('feat(H1-01): First H1 Header');
        });

        it('should use humanized filename if no headers found', () => {
            const task = {
                fileName: '0020-FEAT-humanized-fallback.md',
                data: { task_id: 'HF-01' },
                content: 'Just some text without headers.'
            };
            expect(deriveCommitMessage(task)).toBe('feat(HF-01): humanized fallback');
        });

        it('should truncate subject to 72 characters and append ...', () => {
            const longSubject = 'This is a very long subject that should definitely be truncated because it exceeds seventy two characters by a significant margin';
            const expectedSubject = longSubject.substring(0, 72) + '...';
            const task = {
                fileName: '0021-FEAT-long.md',
                data: { task_id: 'L-02' },
                content: `# Objective\n${longSubject}`
            };
            expect(deriveCommitMessage(task)).toBe(`feat(L-02): ${expectedSubject}`);
        });

        it('should handle malformed content gracefully', () => {
             const task = {
                fileName: '0022-BUG-malformed.md',
                data: { task_id: 'M-01' },
                content: ''
            };
            expect(deriveCommitMessage(task)).toBe('fix(M-01): malformed');
        });

        it('should handle missing task_id gracefully', () => {
            const task = {
                fileName: '0023-FEAT-no-id.md',
                data: {},
                content: '# Objective\nTest no ID'
            };
            expect(deriveCommitMessage(task)).toBe('feat: Test no ID');
        });
    });
});
