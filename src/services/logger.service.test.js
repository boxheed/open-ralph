import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { LoggerService } from "./logger.service";

describe("LoggerService", () => {
    let logger;
    
    beforeEach(() => {
        vi.spyOn(console, "log").mockImplementation(() => {});
        vi.spyOn(console, "error").mockImplementation(() => {});
        vi.spyOn(console, "warn").mockImplementation(() => {});
        vi.spyOn(console, "debug").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should log info messages", () => {
        logger = new LoggerService("INFO");
        logger.info("test");
        expect(console.log).toHaveBeenCalledWith("[INFO] test");
    });

    it("should not log debug messages if level is INFO", () => {
        logger = new LoggerService("INFO");
        logger.debug("test");
        expect(console.debug).not.toHaveBeenCalled();
    });

    it("should log debug messages if level is DEBUG", () => {
        logger = new LoggerService("DEBUG");
        logger.debug("test");
        expect(console.debug).toHaveBeenCalledWith("[DEBUG] test");
    });

    it("should log error messages", () => {
        logger = new LoggerService("INFO");
        logger.error("test");
        expect(console.error).toHaveBeenCalledWith("[ERROR] test");
    });
    
    it("should default to INFO level", () => {
        logger = new LoggerService("INVALID_LEVEL");
        logger.info("test");
        logger.debug("test");
        expect(console.log).toHaveBeenCalled();
        expect(console.debug).not.toHaveBeenCalled();
    });
});
