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
});
