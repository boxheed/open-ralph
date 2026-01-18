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

    it("should remove --model flag if model is not resolved", async () => {
        const mockChild = createMockChildProcess();
        const mockSpawn = vi.fn().mockReturnValue(mockChild);
        vi.spyOn(process.stdout, "write").mockImplementation(() => {});

        const config = {
            providers: {
                test: { command: "cmd --model {model} {prompt}" }
            }
        };

        // No model in config, no defaultModel, no model arg
        const promise = callAI("hello", { 
            spawn: mockSpawn, 
            provider: "test", 
            config 
        });
        mockChild.emit("close", 0);
        await promise;

        // Expect flag to be removed and whitespace cleaned
        expect(mockSpawn).toHaveBeenCalledWith("cmd \"hello\"", [], { shell: true });
    });

    it("should remove -m flag if model is not resolved", async () => {
        const mockChild = createMockChildProcess();
        const mockSpawn = vi.fn().mockReturnValue(mockChild);
        vi.spyOn(process.stdout, "write").mockImplementation(() => {});

        const config = {
            providers: {
                test: { command: "cmd -m {model} {prompt}" }
            }
        };

        const promise = callAI("hello", { spawn: mockSpawn, provider: "test", config });
        mockChild.emit("close", 0);
        await promise;

        expect(mockSpawn).toHaveBeenCalledWith("cmd \"hello\"", [], { shell: true });
    });

    it("should use provider default model if no other model specified", async () => {
        const mockChild = createMockChildProcess();
        const mockSpawn = vi.fn().mockReturnValue(mockChild);
        vi.spyOn(process.stdout, "write").mockImplementation(() => {});

        const config = {
            providers: {
                test: { 
                    command: "cmd --model {model} {prompt}",
                    defaultModel: "default-v1"
                }
            }
        };

        const promise = callAI("hello", { spawn: mockSpawn, provider: "test", config });
        mockChild.emit("close", 0);
        await promise;

        expect(mockSpawn).toHaveBeenCalledWith("cmd --model default-v1 \"hello\"", [], { shell: true });
    });

    it("should prioritize frontmatter model over provider default", async () => {
        const mockChild = createMockChildProcess();
        const mockSpawn = vi.fn().mockReturnValue(mockChild);
        vi.spyOn(process.stdout, "write").mockImplementation(() => {});

        const config = {
            providers: {
                test: { 
                    command: "cmd --model {model} {prompt}",
                    defaultModel: "default-v1"
                }
            }
        };

        const promise = callAI("hello", { 
            spawn: mockSpawn, 
            provider: "test", 
            config,
            model: "override-v2"
        });
        mockChild.emit("close", 0);
        await promise;

        expect(mockSpawn).toHaveBeenCalledWith("cmd --model override-v2 \"hello\"", [], { shell: true });
    });

    it("should prioritize global config over provider default? No, requirement says Provider Default > Global Config", async () => {
        // Wait, requirement: Task Frontmatter > Provider Default > Global Config > CLI Native Default
        // Let's verify this order.
        // If provider default is set, it overrides global config.
        const mockChild = createMockChildProcess();
        const mockSpawn = vi.fn().mockReturnValue(mockChild);
        vi.spyOn(process.stdout, "write").mockImplementation(() => {});

        const config = {
            model: "global-v1",
            providers: {
                test: { 
                    command: "cmd --model {model} {prompt}",
                    defaultModel: "provider-v1"
                }
            }
        };

        const promise = callAI("hello", { spawn: mockSpawn, provider: "test", config });
        mockChild.emit("close", 0);
        await promise;

        expect(mockSpawn).toHaveBeenCalledWith("cmd --model provider-v1 \"hello\"", [], { shell: true });
    });
    
    it("should prioritize global config if provider default is missing", async () => {
        const mockChild = createMockChildProcess();
        const mockSpawn = vi.fn().mockReturnValue(mockChild);
        vi.spyOn(process.stdout, "write").mockImplementation(() => {});

        const config = {
            model: "global-v1",
            providers: {
                test: { 
                    command: "cmd --model {model} {prompt}"
                    // no defaultModel
                }
            }
        };

        const promise = callAI("hello", { spawn: mockSpawn, provider: "test", config });
        mockChild.emit("close", 0);
        await promise;

        expect(mockSpawn).toHaveBeenCalledWith("cmd --model global-v1 \"hello\"", [], { shell: true });
    });

    it("should timeout if process takes too long", async () => {
        vi.useFakeTimers();
        const mockChild = createMockChildProcess();
        mockChild.kill = vi.fn();
        const mockSpawn = vi.fn().mockReturnValue(mockChild);
        vi.spyOn(process.stdout, "write").mockImplementation(() => {});

        const config = { providers: { gemini: { command: "gemini {prompt}" } } };

        const promise = callAI("slow", { 
            spawn: mockSpawn, 
            config, 
            timeout: 1000 
        });
        
        // Fast-forward time
        vi.advanceTimersByTime(1001);
        
        await expect(promise).rejects.toThrow("AI process timed out after 1000ms");
        expect(mockChild.kill).toHaveBeenCalled();
        
        vi.useRealTimers();
    });
});