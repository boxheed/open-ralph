---
task_id: "RELIABILITY-006"
validation_cmd: "npm test"
affected_files: "src/services/git.service.js"
---

# Objective: Improve Git Safety

Currently, `GitService.commit()` runs `git add .`, which stages *everything* in the directory. This is dangerous as it might include accidental changes or untracked files that shouldn't be part of the commit.

We should be more selective or provide a way to scope what gets committed.

## Implementation Steps
1.  Update `GitService.commit()` to accept an optional `paths` argument (array of strings).
2.  If `paths` is provided, only `git add` those specific files.
3.  Update the engine to pass the `affected_files` list (from the task markdown) to the commit method, ensuring only relevant files are committed.
4.  (Optional) Ensure the task file itself is also added to the commit list.

## Success Criteria
1.  `GitService.commit(['src/foo.js'])` only stages `src/foo.js`.
2.  The loop engine passes the correct file list.
