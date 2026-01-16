# Contributing to Ralph Agent

## Architectural Principles

### 1. Zero Dependency Philosophy
We prioritize simplicity and maintainability. When choosing tools, frameworks, or libraries:
*   **Avoid external dependencies** whenever possible.
*   **Prefer "Vanilla" implementations**: Use standard library features (Node.js built-ins) over third-party packages.
*   **Manual Dependency Injection**: Do not use DI containers (like Inversify, NestJS). Pass dependencies explicitly via functions or constructors. This keeps the codebase easy to read, test, and debug without "magic."

### 2. Reliability First
*   Tests must pass before code is committed.
*   The agent must be able to recover from failures or fail gracefully.
