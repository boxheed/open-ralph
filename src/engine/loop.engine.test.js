import { describe, it, expect, vi, beforeEach } from "vitest";
import { runTask } from "./loop.engine";

describe("loop.engine", () => {
    let mockAiService;
    let mockGitService;
    let mockFs;
    let mockExecSync;
    let mockMatter;
    
    const dirs = { TODO: "./todo", DONE: "./done", FAILED: "./failed" };
    const filePath = "./todo/task.md";
    const fileName = "task.md";
    const fileContent = "Raw Content";
    
    beforeEach(() => {
        mockAiService = { callAI: vi.fn() };
        mockGitService = { runValidation: vi.fn(), commit: vi.fn() };
        mockFs = {
            readFileSync: vi.fn().mockReturnValue(fileContent),
            writeFileSync: vi.fn(),
            moveSync: vi.fn()
        };
        mockExecSync = vi.fn();
        mockMatter = vi.fn().mockReturnValue({
            data: { task_id: "T1", validation_cmd: "test", affected_files: "f1" },
            content: "Task Content"
        });
    });

    it("should run successfully on first attempt", async () => {
        mockAiService.callAI.mockResolvedValue("AI Code Fix");
        
        await runTask(filePath, fileName, dirs, {
            aiService: mockAiService,
            gitService: mockGitService,
            fs: mockFs,
            execSync: mockExecSync,
            matter: mockMatter
        });

        expect(mockMatter).toHaveBeenCalledWith("Raw Content");

        expect(mockAiService.callAI).toHaveBeenCalledWith(
            expect.stringContaining("Task Content"),
            expect.objectContaining({ provider: "gemini", files: "f1" })
        );
        
        expect(mockGitService.runValidation).toHaveBeenCalledWith("test");
        expect(mockFs.moveSync).toHaveBeenCalledWith(filePath, "done/task.md");
    });

    it("should use provider from task frontmatter", async () => {
        mockMatter.mockReturnValue({
            data: { task_id: "T2", validation_cmd: "test", affected_files: "f2", provider: "aider" },
            content: "Task Content"
        });
        
        mockAiService.callAI.mockResolvedValue("AI Code Fix");
        
        await runTask(filePath, fileName, dirs, {
            aiService: mockAiService,
            gitService: mockGitService,
            fs: mockFs,
            execSync: mockExecSync,
            matter: mockMatter
        });

        expect(mockAiService.callAI).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({ provider: "aider", files: "f2" })
        );
    });

    it("should use model from task frontmatter", async () => {
        mockMatter.mockReturnValue({
            data: { task_id: "T3", validation_cmd: "test", affected_files: "f3", model: "gpt-4" },
            content: "Task Content"
        });
        
        mockAiService.callAI.mockResolvedValue("AI Code Fix");
        
        await runTask(filePath, fileName, dirs, {
            aiService: mockAiService,
            gitService: mockGitService,
            fs: mockFs,
            execSync: mockExecSync,
            matter: mockMatter
        });

        expect(mockAiService.callAI).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({ model: "gpt-4" })
        );
    });

    it("should use global default model if not in task", async () => {
        mockMatter.mockReturnValue({
            data: { task_id: "T4", validation_cmd: "test", affected_files: "f4" }, 
            content: "Task Content"
        });
        
        mockAiService.callAI.mockResolvedValue("AI Code Fix");
        
        await runTask(filePath, fileName, dirs, {
            aiService: mockAiService,
            gitService: mockGitService,
            fs: mockFs,
            execSync: mockExecSync,
            matter: mockMatter,
            config: { model: "global-model-v2" }
        });

        expect(mockAiService.callAI).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({ model: "global-model-v2" })
        );
    });

    it("should retry", async () => {
        mockAiService.callAI.mockResolvedValue("AI");
        mockGitService.runValidation.mockImplementation(() => { throw new Error("Fail"); });

        await runTask(filePath, fileName, dirs, {
            aiService: mockAiService,
            gitService: mockGitService,
            fs: mockFs,
            execSync: mockExecSync,
            matter: mockMatter,
            config: { retries: 2 }
        });

        expect(mockAiService.callAI).toHaveBeenCalledTimes(2);
        expect(mockFs.moveSync).toHaveBeenCalledWith(filePath, "failed/task.md");
    });
});
