import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { TaskRepository } from "./task.repository";
import fs from "fs-extra";
import path from "path";
import os from "os";

describe("TaskRepository", () => {
    let tmpDir;
    let config;
    let repo;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ralph-repo-test-"));
        config = {
            dirs: {
                todo: path.join(tmpDir, "todo"),
                done: path.join(tmpDir, "done"),
                failed: path.join(tmpDir, "failed")
            }
        };
        fs.ensureDirSync(config.dirs.todo);
        fs.ensureDirSync(config.dirs.done);
        fs.ensureDirSync(config.dirs.failed);
        
        repo = new TaskRepository({ config });
    });

    afterEach(() => {
        fs.removeSync(tmpDir);
    });

    it("should list tasks in todo directory", () => {
        fs.writeFileSync(path.join(config.dirs.todo, "01-task.md"), "content");
        fs.writeFileSync(path.join(config.dirs.todo, "02-task.md"), "content");

        const tasks = repo.listTodo();
        expect(tasks).toEqual(["01-task.md", "02-task.md"]);
    });

    it("should load a task and parse frontmatter", () => {
        const content = "---\ntask_id: TEST-1\n---\n# My Task";
        fs.writeFileSync(path.join(config.dirs.todo, "task.md"), content);

        const task = repo.loadTask("task.md");
        expect(task.data.task_id).toBe("TEST-1");
        expect(task.content.trim()).toBe("# My Task");
    });

    it("should mark a task as done and move the file", () => {
        const fileName = "done-task.md";
        const content = "---\ntask_id: DONE-1\n---\nContent";
        fs.writeFileSync(path.join(config.dirs.todo, fileName), content);

        const task = repo.loadTask(fileName);
        repo.markDone(task, ["### Attempt 1\nFixed it."]);

        expect(fs.existsSync(path.join(config.dirs.todo, fileName))).toBe(false);
        expect(fs.existsSync(path.join(config.dirs.done, fileName))).toBe(true);
    });

    it("should mark a task as failed and include the error", () => {
        const fileName = "fail-task.md";
        fs.writeFileSync(path.join(config.dirs.todo, fileName), "content");

        const task = repo.loadTask(fileName);
        repo.markFailed(task, ["failed once"], "Total failure");

        expect(fs.existsSync(path.join(config.dirs.failed, fileName))).toBe(true);
        const movedContent = fs.readFileSync(path.join(config.dirs.failed, fileName), "utf8");
        expect(movedContent).toContain("Error: Total failure");
    });
});
