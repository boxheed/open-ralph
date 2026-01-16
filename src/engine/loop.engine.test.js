import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runTask } from './loop.engine';
import matter from 'gray-matter';

// Mock gray-matter since it's not injected but used on the result of fs.readFileSync
vi.mock('gray-matter');

describe('loop.engine', () => {
    let mockAiService;
    let mockGitService;
    let mockFs;
    let mockExecSync;
    const dirs = { TODO: './todo', DONE: './done', FAILED: './failed' };
    const filePath = './todo/task.md';
    const fileName = 'task.md';
    const fileContent = `---
task_id: T1
validation_cmd: test
affected_files: f1
---
Task Content`;
    
    beforeEach(() => {
        // Reset mocks
        mockAiService = { callGemini: vi.fn() };
        mockGitService = { runValidation: vi.fn(), commit: vi.fn() };
        mockFs = {
            readFileSync: vi.fn().mockReturnValue(fileContent),
            writeFileSync: vi.fn(),
            moveSync: vi.fn()
        };
        mockExecSync = vi.fn();

        // Setup matter mock behavior
        matter.mockReturnValue({
            data: { task_id: 'T1', validation_cmd: 'test', affected_files: 'f1' },
            content: 'Task Content'
        });
    });

    it('should run successfully on first attempt', async () => {
        mockAiService.callGemini.mockResolvedValue('AI Code Fix');
        
        await runTask(filePath, fileName, dirs, {
            aiService: mockAiService,
            gitService: mockGitService,
            fs: mockFs,
            execSync: mockExecSync
        });

        // Verify AI called
        expect(mockAiService.callGemini).toHaveBeenCalledWith(expect.stringContaining('Task Content'));
        
        // Verify Validation and Commit
        expect(mockGitService.runValidation).toHaveBeenCalledWith('test');
        expect(mockGitService.commit).toHaveBeenCalledWith('Ralph: T1 fixed');
        
        // Verify File Move (Success)
        expect(mockFs.moveSync).toHaveBeenCalledWith(filePath, 'done/task.md');
        expect(mockFs.writeFileSync).toHaveBeenCalled(); // Log update
    });

    it('should retry up to 3 times on validation failure then fail', async () => {
        mockAiService.callGemini.mockResolvedValue('AI Fix Attempt');
        mockGitService.runValidation.mockImplementation(() => { throw new Error('Test Failed'); });

        await runTask(filePath, fileName, dirs, {
            aiService: mockAiService,
            gitService: mockGitService,
            fs: mockFs,
            execSync: mockExecSync
        });

        // Should call AI 3 times
        expect(mockAiService.callGemini).toHaveBeenCalledTimes(3);
        
        // Should try validation 3 times
        expect(mockGitService.runValidation).toHaveBeenCalledTimes(3);
        
        // Should NOT commit
        expect(mockGitService.commit).not.toHaveBeenCalled();
        
        // Should move to FAILED
        expect(mockFs.moveSync).toHaveBeenCalledWith(filePath, 'failed/task.md');
    });

    it('should succeed on the 2nd attempt', async () => {
        mockAiService.callGemini.mockResolvedValue('Fix');
        // Fail once, then succeed
        mockGitService.runValidation
            .mockImplementationOnce(() => { throw new Error('Fail 1'); })
            .mockImplementationOnce(() => {}); 

        await runTask(filePath, fileName, dirs, {
            aiService: mockAiService,
            gitService: mockGitService,
            fs: mockFs,
            execSync: mockExecSync
        });

        expect(mockAiService.callGemini).toHaveBeenCalledTimes(2);
        expect(mockGitService.runValidation).toHaveBeenCalledTimes(2);
        expect(mockGitService.commit).toHaveBeenCalled(); // Success
        expect(mockFs.moveSync).toHaveBeenCalledWith(filePath, 'done/task.md');
    });

    it('should pause in interactive mode', async () => {
        mockAiService.callGemini.mockResolvedValue('Fix');
        
        await runTask(filePath, fileName, dirs, {
            aiService: mockAiService,
            gitService: mockGitService,
            fs: mockFs,
            execSync: mockExecSync,
            interactive: true
        });

        expect(mockExecSync).toHaveBeenCalledWith(expect.stringContaining('read -p'));
    });
});
