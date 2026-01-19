import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventEmitter } from "events";
import { EngineObserver } from "./engine.observer";
import { EVENTS } from "../engine/loop.engine";

describe("EngineObserver", () => {
    let engine;
    let logger;
    let observer;

    beforeEach(() => {
        engine = new EventEmitter();
        logger = {
            info: vi.fn(),
            debug: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
            success: vi.fn()
        };
        observer = new EngineObserver(engine, logger);
    });

    it("should log info when a task starts", () => {
        const task = { fileName: "0001-test.md" };
        engine.emit(EVENTS.TASK_STARTED, { task });
        expect(logger.info).toHaveBeenCalledWith("▶️ Running task: 0001-test.md");
    });

    it("should log info when no tasks are found", () => {
        engine.emit(EVENTS.TASK_STARTED, { count: 0 });
        expect(logger.info).toHaveBeenCalledWith("No tasks found in TODO directory.");
    });

    it("should not log anything when task is missing and count is not zero", () => {
        engine.emit(EVENTS.TASK_STARTED, { count: 1 });
        expect(logger.info).not.toHaveBeenCalled();
    });

    it("should log info when an attempt starts", () => {
        engine.emit(EVENTS.ATTEMPT_STARTED, { attemptNumber: 1 });
        expect(logger.info).toHaveBeenCalledWith("   Attempt 1...");
    });

    it("should log debug when AI proposal is received", () => {
        engine.emit(EVENTS.AI_PROPOSAL_RECEIVED);
        expect(logger.debug).toHaveBeenCalledWith("AI proposal received. Starting validation...");
    });

    it("should log debug when an attempt succeeds", () => {
        engine.emit(EVENTS.ATTEMPT_SUCCEEDED, { attemptNumber: 2 });
        expect(logger.debug).toHaveBeenCalledWith("Attempt 2 passed validation.");
    });

    it("should log warning when an attempt fails", () => {
        engine.emit(EVENTS.ATTEMPT_FAILED, { attemptNumber: 1, error: "Validation failed" });
        expect(logger.warn).toHaveBeenCalledWith("Attempt 1 failed: Validation failed");
    });

    it("should log success when a task completes", () => {
        const task = { fileName: "0001-test.md" };
        engine.emit(EVENTS.TASK_COMPLETED, { task });
        expect(logger.success).toHaveBeenCalledWith("Task 0001-test.md completed successfully.");
    });

    it("should log error when a task fails", () => {
        const task = { fileName: "0001-test.md" };
        engine.emit(EVENTS.TASK_FAILED, { task, error: "Fatal error" });
        expect(logger.error).toHaveBeenCalledWith("Task 0001-test.md failed: Fatal error");
    });

    it("should attach listeners on initialization", () => {
        const newEngine = new EventEmitter();
        const spy = vi.spyOn(newEngine, "on");
        new EngineObserver(newEngine, logger);
        
        expect(spy).toHaveBeenCalledWith(EVENTS.TASK_STARTED, expect.any(Function));
        expect(spy).toHaveBeenCalledWith(EVENTS.ATTEMPT_STARTED, expect.any(Function));
        expect(spy).toHaveBeenCalledWith(EVENTS.AI_PROPOSAL_RECEIVED, expect.any(Function));
        expect(spy).toHaveBeenCalledWith(EVENTS.ATTEMPT_SUCCEEDED, expect.any(Function));
        expect(spy).toHaveBeenCalledWith(EVENTS.ATTEMPT_FAILED, expect.any(Function));
        expect(spy).toHaveBeenCalledWith(EVENTS.TASK_COMPLETED, expect.any(Function));
        expect(spy).toHaveBeenCalledWith(EVENTS.TASK_FAILED, expect.any(Function));
    });
});
