import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Import all providers using require to match config.service.js behavior
const aider = require('./aider');
const gemini = require('./gemini');
const githubCopilot = require('./github-copilot');
const cline = require('./cline');
const forge = require('./forge');
const nanocoder = require('./nanocoder');
const opencode = require('./opencode');
const qwenCode = require('./qwen-code');

describe('Providers Service', () => {
    let mockFs;

    beforeEach(() => {
        mockFs = {
            existsSync: vi.fn(),
            readFileSync: vi.fn()
        };
    });

    describe('Standard Providers (File Content Injection)', () => {
        const standardProviders = [
            {
                module: githubCopilot,
                cmd: 'copilot',
                argsPrefix: ['--allow-all-tools', '--prompt']
            },
            {
                module: forge,
                cmd: 'forge',
                argsPrefix: ['--prompt']
            },
            { module: cline, cmd: 'cline', argsPrefix: [] },
            { module: nanocoder, cmd: 'nanocoder', argsPrefix: [] },
            { module: opencode, cmd: 'opencode', argsPrefix: [] },
            {
                module: qwenCode,
                cmd: 'qwen',
                argsPrefix: ['--yolo']
            },
        ];

        standardProviders.forEach(({ module, cmd, argsPrefix }) => {
            describe(module.name, () => {
                it('should use raw text if prompt is not a file', () => {
                    mockFs.existsSync.mockReturnValue(false);
                    const prompt = "Just a regular prompt";
                    const result = module.build(prompt, { fs: mockFs });

                    expect(result.command).toBe(cmd);
                    expect(result.args).toEqual([...argsPrefix, prompt]);
                    expect(mockFs.existsSync).toHaveBeenCalledWith(prompt);
                });

                it('should read file content if prompt is a file path', () => {
                    const filePath = '/path/to/context.md';
                    const fileContent = 'Start of context\nEnd of context';
                    
                    mockFs.existsSync.mockImplementation((p) => p === filePath);
                    mockFs.readFileSync.mockReturnValue(fileContent);

                    const result = module.build(filePath, { fs: mockFs });

                    expect(result.args).toEqual([...argsPrefix, fileContent]);
                    expect(mockFs.readFileSync).toHaveBeenCalledWith(filePath, 'utf8');
                });

                it('should fallback to path if file reading fails', () => {
                    const filePath = '/path/to/broken.md';
                    mockFs.existsSync.mockReturnValue(true);
                    mockFs.readFileSync.mockImplementation(() => { throw new Error("Read error"); });

                    const result = module.build(filePath, { fs: mockFs });
                    expect(result.args).toEqual([...argsPrefix, filePath]);
                });
            });
        });
    });

    describe('Gemini Provider', () => {
        it('should include --yolo flag', () => {
            mockFs.existsSync.mockReturnValue(false);
            const result = gemini.build("hello", { fs: mockFs });
            expect(result.command).toBe("gemini");
            expect(result.args).toContain("--yolo");
            expect(result.stdin).toBe("hello");
        });

        it('should inject model flag if provided', () => {
            mockFs.existsSync.mockReturnValue(false);
            const result = gemini.build("hello", { model: "gemini-2.0", fs: mockFs });
            expect(result.args).toContain("--model");
            expect(result.args).toContain("gemini-2.0");
        });

        it('should read file content into stdin if prompt is a file', () => {
            const filePath = "context.md";
            const content = "file content";
            mockFs.existsSync.mockReturnValue(true);
            mockFs.readFileSync.mockReturnValue(content);

            const result = gemini.build(filePath, { fs: mockFs });
            expect(result.stdin).toBe(content);
            expect(result.args).not.toContain(filePath);
            expect(result.args).not.toContain("--file");
        });
    });

    describe('Aider Provider', () => {
        it('should use --message flag', () => {
            const result = aider.build("fix bug", {});
            expect(result.command).toBe("aider");
            expect(result.args[0]).toBe("--message");
            expect(result.args[1]).toBe("fix bug");
        });

        it('should rewrite prompt if it is a specific context file path', () => {
            const result = aider.build(".ralph/context/task.md", {});
            expect(result.args[1]).toBe("Read instructions in .ralph/context/task.md");
        });

        it('should NOT rewrite prompt if it is just a random md file', () => {
            const result = aider.build("random.md", {});
            expect(result.args[1]).toBe("random.md");
        });

        it('should split files string into individual arguments', () => {
            const result = aider.build("msg", { files: "file1.js file2.js" });
            expect(result.args).toContain("file1.js");
            expect(result.args).toContain("file2.js");
        });

        it('should handle comma separated files', () => {
            const result = aider.build("msg", { files: "file1.js,file2.js" });
            expect(result.args).toContain("file1.js");
            expect(result.args).toContain("file2.js");
        });

        it('should inject model flag', () => {
            const result = aider.build("msg", { model: "gpt-4" });
            expect(result.args).toContain("--model");
            expect(result.args).toContain("gpt-4");
        });
    });
});
