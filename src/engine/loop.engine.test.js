import { describe, it, expect, vi, beforeEach } from "vitest";
import { LoopEngine, EVENTS } from "./loop.engine";

describe("LoopEngine (Event-Driven)", () => {
    let aiService, gitService, taskRepository, contextService, config;
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
        config = { dirs: { done: "done" }, retries: 1 };

        engine = new LoopEngine({
            aiService,
            gitService,
            taskRepository,
            contextService,
            config
        });
    });

    it("should emit events during successful execution", async () => {
        const task = { 
            fileName: "task.md", 
            data: { task_id: "T1" }, 
            content: "do" 
        };
        taskRepository.listTodo.mockReturnValue(["task.md"]);
        taskRepository.loadTask.mockReturnValue(task);
        aiService.callAI.mockResolvedValue("fixed");

        const startedSpy = vi.fn();
        const completedSpy = vi.fn();
        
        engine.on(EVENTS.TASK_STARTED, startedSpy);
        engine.on(EVENTS.TASK_COMPLETED, completedSpy);

        await engine.runAll();

        expect(startedSpy).toHaveBeenCalled();
        expect(completedSpy).toHaveBeenCalled();
        expect(taskRepository.markDone).toHaveBeenCalled();
    });

    it("should emit failure events", async () => {
        const task = { 
            fileName: "task.md", 
            data: { task_id: "T1" }, 
            content: "do" 
        };
        taskRepository.listTodo.mockReturnValue(["task.md"]);
        taskRepository.loadTask.mockReturnValue(task);
        aiService.callAI.mockRejectedValue(new Error("AI error"));

        const failedSpy = vi.fn();
        engine.on(EVENTS.TASK_FAILED, failedSpy);

        await engine.runAll();

        expect(failedSpy).toHaveBeenCalledWith(expect.objectContaining({ 
            error: expect.stringContaining("AI error") 
        }));
    });

    it("should only run the targeted task when targetTask is provided", async () => {
        const task1 = { fileName: "task1.md", data: { task_id: "T1" }, content: "do 1" };
        const task2 = { fileName: "task2.md", data: { task_id: "T2" }, content: "do 2" };
        
        taskRepository.listTodo.mockReturnValue(["task1.md", "task2.md"]);
        taskRepository.loadTask.mockImplementation((name) => {
            if (name === "task1.md") return task1;
            if (name === "task2.md") return task2;
        });
        aiService.callAI.mockResolvedValue("fixed");

        await engine.runAll("task2.md");

        expect(taskRepository.loadTask).toHaveBeenCalledWith("task2.md");
        expect(taskRepository.loadTask).not.toHaveBeenCalledWith("task1.md");
        expect(taskRepository.markDone).toHaveBeenCalledTimes(1);
    });

    it("should handle targetTask without .md extension", async () => {
        const task = { fileName: "task1.md", data: { task_id: "T1" }, content: "do 1" };
        taskRepository.listTodo.mockReturnValue(["task1.md"]);
        taskRepository.loadTask.mockReturnValue(task);
        aiService.callAI.mockResolvedValue("fixed");

        await engine.runAll("task1");

        expect(taskRepository.loadTask).toHaveBeenCalledWith("task1.md");
    });

    it("should throw error if targetTask is not found", async () => {
        taskRepository.listTodo.mockReturnValue(["task1.md"]);
        
        await expect(engine.runAll("nonexistent")).rejects.toThrow("Task file not found in todo directory: nonexistent.md");
    });
});
