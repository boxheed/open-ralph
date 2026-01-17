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
            expect(mockFs.existsSync).toHaveBeenCalledWith(path.join("/test", "ralph.config.js"));
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

        it("should load config from file", () => {
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
    });
});