import { describe, it, expect, vi, beforeEach } from "vitest";
import { LoopEngine } from "./loop.engine";

describe("LoopEngine", () => {
    let aiService, gitService, taskRepository, contextService, logger, config;
    let engine;

    beforeEach(() => {
        aiService = { callAI: vi.fn() };
        gitService = { runValidation: vi.fn(), commit: vi.fn() };
        taskRepository = { 
            listTodo: vi.fn(), 
            loadTask: vi.fn(), 
            markDone: vi.fn(), 
            markFailed: vi.fn() 
        };
        contextService = { buildContext: vi.fn() };
        logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), success: vi.fn() };
        config = { dirs: { done: "done" }, retries: 2 };

        engine = new LoopEngine({
            aiService,
            gitService,
            taskRepository,
            contextService,
            logger,
            config
        });
    });

    it("should run all tasks in the repository", async () => {
        taskRepository.listTodo.mockReturnValue(["task1.md", "task2.md"]);
        
        // Mock runTask to avoid deep nesting in this test
        const runTaskSpy = vi.spyOn(engine, "runTask").mockResolvedValue();

        await engine.runAll();

        expect(runTaskSpy).toHaveBeenCalledTimes(2);
        expect(runTaskSpy).toHaveBeenCalledWith("task1.md");
        expect(runTaskSpy).toHaveBeenCalledWith("task2.md");
    });

    it("should complete a task on the first attempt", async () => {
        const task = { 
            fileName: "task1.md", 
            data: { task_id: "T1", validation_cmd: "test" }, 
            content: "do it" 
        };
        taskRepository.loadTask.mockReturnValue(task);
        aiService.callAI.mockResolvedValue("AI output");

        await engine.runTask("task1.md");

        expect(aiService.callAI).toHaveBeenCalled();
        expect(gitService.runValidation).toHaveBeenCalledWith("test", undefined);
        expect(taskRepository.markDone).toHaveBeenCalled();
        expect(gitService.commit).toHaveBeenCalled();
        expect(logger.success).toHaveBeenCalled();
    });

    it("should retry on failure and mark as failed if all attempts fail", async () => {
        const task = { 
            fileName: "task1.md", 
            data: { task_id: "T1", validation_cmd: "test" }, 
            content: "do it" 
        };
        taskRepository.loadTask.mockReturnValue(task);
        aiService.callAI.mockResolvedValue("AI output");
        gitService.runValidation.mockImplementation(() => { throw new Error("Validation failed"); });

        await engine.runTask("task1.md");

        expect(gitService.runValidation).toHaveBeenCalledTimes(2); // Based on config.retries = 2
        expect(taskRepository.markFailed).toHaveBeenCalled();
        expect(logger.error).toHaveBeenCalled();
    });
});