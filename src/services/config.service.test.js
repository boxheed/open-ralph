import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { loadConfig, DEFAULTS } from "./config.service";
import path from "path";
import fs from "fs-extra";
import os from "os";

describe("ConfigService", () => {
    
    describe("Unit", () => {
         it("should return defaults if no config file exists (mocked fs)", () => {
            const mockFs = { existsSync: vi.fn().mockReturnValue(false) };
            const config = loadConfig("/test", mockFs);
            expect(config).toEqual(DEFAULTS);
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

        it("should load config from ralph.json", () => {
            const configContent = JSON.stringify({
                retries: 2,
                model: "gpt-4-turbo"
            });
            fs.writeFileSync(path.join(tmpDir, "ralph.json"), configContent);

            const config = loadConfig(tmpDir);

            expect(config.retries).toBe(2);
            expect(config.model).toBe("gpt-4-turbo");
        });
        
        it("should prioritize ralph.config.js over ralph.json", () => {
             fs.writeFileSync(path.join(tmpDir, "ralph.config.js"), "module.exports = { retries: 1 };");
             fs.writeFileSync(path.join(tmpDir, "ralph.json"), JSON.stringify({ retries: 2 }));
             
             const config = loadConfig(tmpDir);
             expect(config.retries).toBe(1);
        });
    });
});
