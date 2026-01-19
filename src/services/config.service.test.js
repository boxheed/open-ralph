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
                    build: () => ({ command: "custom-ai" })
                };
            `;
            fs.writeFileSync(path.join(providersDir, "custom-ai.js"), providerContent);

            const config = loadConfig(tmpDir);

            expect(config.providers["custom-ai"]).toBeDefined();
            expect(config.providers["custom-ai"].name).toBe("custom-ai");
        });

        it("should skip custom providers with syntax errors", () => {
            const providersDir = path.join(tmpDir, ".ralph", "providers");
            fs.ensureDirSync(providersDir);
            
            const providerContent = `
                module.exports = {
                    name: "bad-syntax",
                    build: () => { // Missing closing brace
            `;
            fs.writeFileSync(path.join(providersDir, "bad-syntax.js"), providerContent);

            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const config = loadConfig(tmpDir);

            expect(config.providers["bad-syntax"]).toBeUndefined();
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Failed to load custom provider bad-syntax.js"));
            
            consoleSpy.mockRestore();
        });

        it("should skip custom providers missing a 'name' property", () => {
            const providersDir = path.join(tmpDir, ".ralph", "providers");
            fs.ensureDirSync(providersDir);
            
            const providerContent = `
                module.exports = {
                    build: () => ({ command: "no-name" })
                };
            `;
            fs.writeFileSync(path.join(providersDir, "no-name.js"), providerContent);

            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const config = loadConfig(tmpDir);

            expect(config.providers["no-name"]).toBeUndefined();
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("is missing a 'name' property"));
            
            consoleSpy.mockRestore();
        });

        it("should use the 'name' property even if it differs from the filename", () => {
            const providersDir = path.join(tmpDir, ".ralph", "providers");
            fs.ensureDirSync(providersDir);
            
            const providerContent = `
                module.exports = {
                    name: "actual-name",
                    build: () => ({ command: "mismatch" })
                };
            `;
            fs.writeFileSync(path.join(providersDir, "mismatch.js"), providerContent);

            const config = loadConfig(tmpDir);

            expect(config.providers["actual-name"]).toBeDefined();
            expect(config.providers["mismatch"]).toBeUndefined();
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

        it("should handle malformed config file gracefully", () => {
            const configContent = `
                module.exports = {
                    retries: 
                }; // Syntax Error
            `;
            fs.writeFileSync(path.join(tmpDir, "ralph.config.js"), configContent);

            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            
            const config = loadConfig(tmpDir);

            expect(config.retries).toBe(DEFAULTS.retries); // Should fall back to default
            expect(consoleSpy).toHaveBeenCalled();
            
            consoleSpy.mockRestore();
        });

        it("should handle empty user providers directory", () => {
            const providersDir = path.join(tmpDir, ".ralph", "providers");
            fs.ensureDirSync(providersDir);
            
            // No files in directory

            const config = loadConfig(tmpDir);

            // Should still have built-in providers
            expect(config.providers["gemini"]).toBeDefined();
        });

        it("should allow passing an object with configPath", () => {
            const configPath = path.join(tmpDir, "custom-config.js");
            const configContent = `
                module.exports = {
                    retries: 42
                };
            `;
            fs.writeFileSync(configPath, configContent);

            const config = loadConfig({ configPath });
            expect(config.retries).toBe(42);
        });

        it("should use process.cwd() if source is not a string or valid object", () => {
            // This hits the 'else' block
            const config = loadConfig(null);
            expect(config.dirs).toEqual(DEFAULTS.dirs);
        });

        it("should merge provider overrides from ralph.config.js", () => {
            const configContent = `
                module.exports = {
                    providers: {
                        gemini: {
                            command: "custom-gemini"
                        },
                        newbie: {
                            command: "new-cmd"
                        }
                    }
                };
            `;
            fs.writeFileSync(path.join(tmpDir, "ralph.config.js"), configContent);

            const config = loadConfig(tmpDir);

            expect(config.providers.gemini.command).toBe("custom-gemini");
            expect(config.providers.newbie.command).toBe("new-cmd");
            expect(config.providers.newbie.name).toBe("newbie");
        });
    });
});
