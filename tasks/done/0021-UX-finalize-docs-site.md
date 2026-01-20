---
task_id: "UX-021"
validation_cmd: "cd docs && npm install && npm run build"
affected_files: ["docs/", ".github/workflows/release.yml"]
---

# Objective: Finalize Documentation Site

We have scaffolded the Astro site in `/docs`. This task ensures the site is ready for public launch.

## Success Criteria
1. The Astro project builds successfully without errors.
2. The `TerminalSimulator` component is functional.
3. The GitHub Action correctly includes the `gh-pages` deployment step.
