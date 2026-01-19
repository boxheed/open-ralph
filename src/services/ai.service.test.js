import { describe, it, expect, vi, beforeEach } from "vitest";
import { AIService } from "./ai.service";
import { EventEmitter } from "events";

describe("AIService", () => {
    let mockSpawn;
    let mockFs;
    let config;
    let service;

    beforeEach(() => {
        mockSpawn = vi.fn();
        mockFs = { existsSync: vi.fn(), readFileSync: vi.fn() };
        config = {
            provider: "test-provider",
            providers: {
                "test-provider": {
                    name: "test-provider",
                    build: (prompt, { model }) => ({
                        command: "test-cli",
                        args: ["--prompt", prompt, "--model", model || "default"]
                    })
                }
            }
        };
        service = new AIService({ spawn: mockSpawn, fs: mockFs, config });
    });

    it("should call the provider build function and spawn the process", async () => {
        const mockProcess = new EventEmitter();
        mockProcess.stdout = new EventEmitter();
        mockProcess.stderr = new EventEmitter();
        mockSpawn.mockReturnValue(mockProcess);

        const callPromise = service.callAI("hello", { model: "gpt-4" });

        // Simulate process output and close
        setTimeout(() => {
            mockProcess.stdout.emit("data", Buffer.from("AI Response"));
            mockProcess.emit("close", 0);
        }, 10);

        const response = await callPromise;

        expect(response).toBe("AI Response");
        expect(mockSpawn).toHaveBeenCalledWith("test-cli", ["--prompt", "hello", "--model", "gpt-4"], { shell: false });
    });

    it("should pipe stdin if provided by the provider", async () => {
        const mockProcess = new EventEmitter();
        mockProcess.stdout = new EventEmitter();
        mockProcess.stderr = new EventEmitter();
        mockProcess.stdin = { write: vi.fn(), end: vi.fn() };
        mockSpawn.mockReturnValue(mockProcess);

        // Update config for a provider that uses stdin
        config.providers["stdin-provider"] = {
            name: "stdin-provider",
            build: (prompt) => ({
                command: "stdin-cli",
                args: [],
                stdin: "piped-content"
            })
        };

        const callPromise = service.callAI("hello", { provider: "stdin-provider" });

        setTimeout(() => {
            mockProcess.emit("close", 0);
        }, 10);

        await callPromise;

        expect(mockProcess.stdin.write).toHaveBeenCalledWith("piped-content");
        expect(mockProcess.stdin.end).toHaveBeenCalled();
    });

    it("should throw error if provider is not configured", async () => {
        service = new AIService({ config: {} });
        await expect(service.callAI("hello", {})).rejects.toThrow("No AI provider configured");
    });

    it("should handle process error", async () => {
        const mockProcess = new EventEmitter();
        mockProcess.stdout = new EventEmitter();
        mockProcess.stderr = new EventEmitter();
        mockSpawn.mockReturnValue(mockProcess);

        const callPromise = service.callAI("hello", {});

        setTimeout(() => {
            mockProcess.emit("error", new Error("Spawn failed"));
        }, 10);

        await expect(callPromise).rejects.toThrow("test-provider failed: Spawn failed");
    });
});