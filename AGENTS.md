# Kibs CLI Agent Rules

## Purpose

Kibs CLI is a generator for one fixed v1 stack only:

- React + Tailwind frontend
- Express backend
- MySQL database
- Session auth with username/password
- CRUD entities
- Simple relationships
- Simple reports

Do not add support for:

- Next.js
- NestJS
- MongoDB
- Existing-project patching
- Advanced RBAC
- AI generation features
- Charts or advanced analytics

## Technical defaults

- Use JavaScript only.
- Use CommonJS only unless an explicit migration is requested.
- Prefer Node built-ins and very small dependencies.
- Keep code readable and direct over abstract.

## Repository structure

- `src/commands/`: CLI command definitions and argument wiring
- `src/core/`: generation logic and config creation
- `src/utils/`: small reusable helpers only
- `tests/`: CLI and scaffold behavior tests

Do not add new structural layers unless there is a clear second use case.
Register commands through `src/commands/index.js`.
Keep command files modular, with one file per command or subcommand where practical.

## Generator rules

- Generated project structure must stay predictable and simple.
- `kibs.config.json` is the source of truth for Kibs v1 generation.
- Update the config schema intentionally and keep it aligned with v1 scope.
- Keep config readable for beginners and easy to inspect manually.
- Keep config utilities in `src/core/config.js`.
- Use synchronous config operations unless an explicit migration is requested.
- Avoid plugin systems, registries, or framework-style abstractions until a second real command or second generation path justifies them.

## Change discipline

- Keep implementation simple and readable.
- Update `README.md` when CLI behavior or generated output changes.
- Add or update tests when command behavior or scaffolded files change.
- Add or update tests when the config contract changes.
- Do not quietly expand scope beyond the fixed v1 product definition.
- Placeholder commands are acceptable for announced features, but they must fail clearly and intentionally.
- Keep command wiring separate from generation logic.
- Do not introduce schema libraries or advanced validation layers unless explicitly requested.
