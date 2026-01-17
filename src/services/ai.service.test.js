import { describe, it, expect, vi, afterEach } from "vitest";
import { callAI } from "./ai.service";
import { EventEmitter } from "events";

describe("ai.service", () => {
    function createMockChildProcess() {
        const child = new EventEmitter();
        child.stdout = new EventEmitter();
        child.stderr = new EventEmitter();
        return child;
    }

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should call default provider (gemini) with correct template", async () => {
        const mockChild = createMockChildProcess();
        const mockSpawn = vi.fn().mockReturnValue(mockChild);
        vi.spyOn(process.stdout, "write").mockImplementation(() => {});

        const config = {
            providers: {
                gemini: { command: "gemini {prompt}" }
            }
        };

        const promise = callAI("hello", { spawn: mockSpawn, config });
        
        mockChild.stdout.emit("data", "out");
        mockChild.emit("close", 0);
        
        await promise;

        expect(mockSpawn).toHaveBeenCalledWith("gemini \"hello\"", [], { shell: true });
    });

    it("should call custom provider (aider) with correct template", async () => {
        const mockChild = createMockChildProcess();
        const mockSpawn = vi.fn().mockReturnValue(mockChild);
        vi.spyOn(process.stdout, "write").mockImplementation(() => {});

        const config = {
            providers: {
                aider: { command: "aider --message {prompt} {files}" }
            }
        };

        const promise = callAI("fix bug", { 
            spawn: mockSpawn, 
            provider: "aider", 
            config,
            files: "src/main.js" 
        });
        
        mockChild.emit("close", 0);
        
        await promise;

        expect(mockSpawn).toHaveBeenCalledWith("aider --message \"fix bug\" src/main.js", [], { shell: true });
    });

    it("should escape quotes in prompt", async () => {
        const mockChild = createMockChildProcess();
        const mockSpawn = vi.fn().mockReturnValue(mockChild);
        vi.spyOn(process.stdout, "write").mockImplementation(() => {});

        const config = {
            providers: {
                test: { command: "cmd {prompt}" }
            }
        };

        const promise = callAI("hello \"world\"", { spawn: mockSpawn, provider: "test", config });
        mockChild.emit("close", 0);
        await promise;

        expect(mockSpawn).toHaveBeenCalledWith("cmd \"hello \\\"world\\\"\"", [], { shell: true });
    });

    it("should substitute {model} placeholder", async () => {
        const mockChild = createMockChildProcess();
        const mockSpawn = vi.fn().mockReturnValue(mockChild);
        vi.spyOn(process.stdout, "write").mockImplementation(() => {});

        const config = {
            providers: {
                test: { command: "cmd --model {model} {prompt}" }
            }
        };

        const promise = callAI("hello", { 
            spawn: mockSpawn, 
            provider: "test", 
            config,
            model: "gpt-4" 
        });
        mockChild.emit("close", 0);
        await promise;

        expect(mockSpawn).toHaveBeenCalledWith("cmd --model gpt-4 \"hello\"", [], { shell: true });
    });

    it("should ignore model if placeholder is missing", async () => {
        const mockChild = createMockChildProcess();
        const mockSpawn = vi.fn().mockReturnValue(mockChild);
        vi.spyOn(process.stdout, "write").mockImplementation(() => {});
        const config = { providers: { test: { command: "cmd {prompt}" } } };
        const promise = callAI("hello", { spawn: mockSpawn, provider: "test", config, model: "gpt-4" });
        mockChild.emit("close", 0);
        await promise;
        expect(mockSpawn).toHaveBeenCalledWith("cmd \"hello\"", [], { shell: true });
    });
});