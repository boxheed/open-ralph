---
task_id: "0001-TEST"
validation_cmd: "npm run test"
affected_files: "package.json"
---

# Objective: Add a unit test framework
The project needs a unit test framework installing and configuring. The project should use the `vitest` framework. A script should be added in the scripts section in the `package.json` so that it can be run with `npm run test`. To prove that it works you should add a single unit test that 'does nothing'. the test files should be identified with the same name of the file under test but have `.test` inserted before the `js` extension. The dummy test case should be in a test file for the `loop.engine.js` file.

## Success Criteria
1. The `package.json` should have a `test` script
2. The dummy unit test that does nothing should run