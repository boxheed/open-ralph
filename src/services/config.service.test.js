import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { loadConfig, DEFAULTS } from "./config.service";
import path from "path";
import fs from "fs-extra";
import os from "os";

describe("ConfigService", () => {
    
    describe("Unit", () => {
         it("should return defaults if no config file exists (mocked fs)", () => {
            const mockFs = { 
                existsSync: vi.fn().mockReturnValue(false),
                readdirSync: vi.fn().mockReturnValue([]) 
            };
            const config = loadConfig("/test", mockFs);
            expect(config.dirs).toEqual(DEFAULTS.dirs);
            expect(config.retries).toBe(DEFAULTS.retries);
            expect(config.provider).toBe(DEFAULTS.provider);
            expect(config.providers).toBeDefined();
         });
    });

    describe("Integration", () => {
        let tmpDir;

        beforeEach(() => {
            tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ralph-test-"));
        });

        afterEach(() => {
            fs.removeSync(tmpDir);
        });

        it("should load config from ralph.config.js", () => {
            const configContent = `
                module.exports = {
                    retries: 5,
                    dirs: { todo: "./custom/todo" }
                };
            `;
            fs.writeFileSync(path.join(tmpDir, "ralph.config.js"), configContent);

            const config = loadConfig(tmpDir); // Uses real fs by default

            expect(config.retries).toBe(5);
            expect(config.dirs.todo).toBe("./custom/todo");
            expect(config.dirs.done).toBe(DEFAULTS.dirs.done); // Merged
        });

        it("should load user-defined providers from .ralph/providers", () => {
            const providersDir = path.join(tmpDir, ".ralph", "providers");
            fs.ensureDirSync(providersDir);
            
            const providerContent = `
                module.exports = {
                    name: "custom-ai",
                    command: "custom-ai {prompt}"
                };
            `;
            fs.writeFileSync(path.join(providersDir, "custom-ai.js"), providerContent);

            const config = loadConfig(tmpDir);

            expect(config.providers["custom-ai"]).toBeDefined();
            expect(config.providers["custom-ai"].command).toBe("custom-ai {prompt}");
        });

        it("should not enforce 'model' property in config", () => {
            const configContent = `
                module.exports = {
                    retries: 5
                };
            `;
            fs.writeFileSync(path.join(tmpDir, "ralph.config.js"), configContent);

            const config = loadConfig(tmpDir);

            expect(config.model).toBeUndefined();
            expect(config.retries).toBe(5);
        });
    });
});
