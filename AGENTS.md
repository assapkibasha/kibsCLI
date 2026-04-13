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

## Generator rules

- Generated project structure must stay predictable and simple.
- `kibs.config.json` is the initial contract for future generator features.
- Update the config schema intentionally and keep it aligned with v1 scope.
- Avoid plugin systems, registries, or framework-style abstractions until a second real command or second generation path justifies them.

## Change discipline

- Keep implementation simple and readable.
- Update `README.md` when CLI behavior or generated output changes.
- Add or update tests when command behavior or scaffolded files change.
- Do not quietly expand scope beyond the fixed v1 product definition.
