import { describe, it, expect, vi, beforeEach } from 'vitest';

// Import providers (real implementation)
import githubCopilot from './github-copilot';
import cline from './cline';
import forge from './forge';
import nanocoder from './nanocoder';
import opencode from './opencode';
import qwenCode from './qwen-code';

describe('Legacy Providers (File Context Support)', () => {
    const providers = [
        { module: githubCopilot, cmd: 'gh', argsPrefix: ['copilot', 'suggest'] },
        { module: cline, cmd: 'cline', argsPrefix: [] },
        { module: forge, cmd: 'forge', argsPrefix: [] },
        { module: nanocoder, cmd: 'nanocoder', argsPrefix: [] },
        { module: opencode, cmd: 'opencode', argsPrefix: [] },
        { module: qwenCode, cmd: 'qwen-code', argsPrefix: [] },
    ];

    let mockFs;

    beforeEach(() => {
        mockFs = {
            existsSync: vi.fn(),
            readFileSync: vi.fn()
        };
    });

    providers.forEach(({ module, cmd, argsPrefix }) => {
        describe(module.name, () => {
            it('should use raw text if prompt is not a file', () => {
                mockFs.existsSync.mockReturnValue(false);
                
                const prompt = "Just a regular prompt";
                // Pass mockFs in context
                const result = module.build(prompt, { fs: mockFs });

                expect(result.command).toBe(cmd);
                
                const expectedArgs = [...argsPrefix, prompt];
                expect(result.args).toEqual(expectedArgs);
                expect(mockFs.existsSync).toHaveBeenCalledWith(prompt);
            });

            it('should read file content if prompt is a file path', () => {
                const filePath = '/path/to/context.md';
                const fileContent = 'Start of context\nEnd of context';
                
                mockFs.existsSync.mockImplementation((p) => p === filePath);
                mockFs.readFileSync.mockReturnValue(fileContent);

                const result = module.build(filePath, { fs: mockFs });

                expect(result.command).toBe(cmd);
                
                const expectedArgs = [...argsPrefix, fileContent];
                expect(result.args).toEqual(expectedArgs);
                
                expect(mockFs.existsSync).toHaveBeenCalledWith(filePath);
                expect(mockFs.readFileSync).toHaveBeenCalledWith(filePath, 'utf8');
            });

             it('should fallback to path if file reading fails', () => {
                const filePath = '/path/to/broken.md';
                
                mockFs.existsSync.mockReturnValue(true);
                mockFs.readFileSync.mockImplementation(() => {
                    throw new Error("Read error");
                });

                const result = module.build(filePath, { fs: mockFs });

                expect(result.command).toBe(cmd);
                const expectedArgs = [...argsPrefix, filePath];
                expect(result.args).toEqual(expectedArgs);
            });
        });
    });
});
