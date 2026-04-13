# Kibs CLI

Kibs CLI is a terminal-based full-stack CRUD system generator. This repository is the foundation for the CLI itself.

## Version 1 scope

- React + Tailwind frontend
- Express backend
- MySQL database
- Session-based auth with username/password
- CRUD entity generation
- Simple relationships
- Simple reports
- New projects from scratch only

## Out of scope

- Next.js
- NestJS
- MongoDB
- Existing-project patching
- Advanced RBAC
- AI code generation
- Charts or advanced analytics

## Requirements

- Node.js 20 or newer
- npm

## Install

```powershell
npm install
```

## Run the CLI

```powershell
node src/cli.js --help
node src/cli.js init demo-app
node src/cli.js add --help
node src/cli.js add entity
node src/cli.js generate
```

You can also expose the local binary after install:

```powershell
npm link
kibs init demo-app
```

## What `kibs init` generates

```text
demo-app/
  kibs.config.json
  backend/
    src/
      app.js
      server.js
      routes/
        index.js
    package.json
    .gitignore
  frontend/
    src/
      app.js
      main.js
      styles.css
    public/
      index.html
    package.json
    .gitignore
  README.md
```

The generated backend starts as a minimal Express shell after `kibs init`. In Phase 6, `kibs generate` upgrades that backend into entity CRUD routes and controllers based on `kibs.config.json`. The generated frontend is still a structured starter prepared for React + Tailwind setup in future Kibs generation work, without introducing a frontend scaffolding framework here.

## `kibs.config.json`

`kibs.config.json` is the Kibs v1 source of truth for generated projects.

Example:

```json
{
  "version": 1,
  "projectName": "demo-app",
  "frontend": {
    "framework": "react",
    "styling": "tailwind"
  },
  "backend": {
    "framework": "express"
  },
  "database": {
    "client": "mysql"
  },
  "auth": {
    "enabled": true,
    "mode": "session"
  },
  "entities": [],
  "relationships": [],
  "reports": []
}
```

`entities`, `relationships`, and `reports` start empty in Phase 3. In Phase 4, `kibs add entity` writes entity definitions into `entities`. In Phase 6, `kibs generate` reads `entities` and produces backend CRUD files from them.

Entity names must be non-empty, trimmed, and use singular PascalCase such as `Employee` or `ParkingRecord`.

Field names must be non-empty, trimmed, and use camelCase such as `firstName` or `departmentId`. Uppercase-first names, spaces, and underscore-based names are rejected.

Entity example:

```json
{
  "name": "Employee",
  "fields": [
    {
      "name": "firstName",
      "type": "string",
      "required": true,
      "unique": false
    },
    {
      "name": "status",
      "type": "enum",
      "required": true,
      "unique": false,
      "values": ["active", "inactive"]
    },
    {
      "name": "departmentId",
      "type": "foreignKey",
      "required": false,
      "unique": false,
      "references": "Department"
    }
  ]
}
```

Foreign keys must include `references`, the referenced entity must exist in `config.entities`, and self-referencing foreign keys are rejected in Kibs v1. Foreign key field names must stay in camelCase and end with `Id`, for example `departmentId`.

## Phase 5 naming convention

Kibs now exposes deterministic naming helpers for future generation phases. The convention is:

- entity name: singular PascalCase, for example `ParkingRecord`
- table name: plural snake_case, for example `parking_records`
- route name: plural kebab-case, for example `parking-records`
- controller name: plural PascalCase plus `Controller`, for example `ParkingRecordsController`
- frontend page/component names: plural PascalCase plus `Page` and singular PascalCase plus `Form`

## `kibs generate`

Run generation inside a Kibs project:

```powershell
cd demo-app
node ..\src\cli.js generate
```

This generates or updates:

- `backend/package.json`
- `backend/.env.example`
- `backend/src/app.js`
- `backend/src/server.js`
- `backend/src/config/database.js`
- `backend/src/routes/index.js`
- one route file per entity in `backend/src/routes/`
- one controller file per entity in `backend/src/controllers/`

Entity route names, controller files, and table names use the Phase 5 naming helpers. Foreign-key relationships are derived from `foreignKey` fields already stored in entity definitions. Kibs does not use `relationships` as a second backend relationship source of truth in v1.

Generated backend example for `Department` and `Employee`:

```text
backend/
  .env.example
  package.json
  src/
    app.js
    server.js
    config/
      database.js
    controllers/
      departments.js
      employees.js
    routes/
      index.js
      departments.js
      employees.js
```

The generated backend uses direct `mysql2` queries with simple CRUD handlers so a junior developer can read and edit the files without learning an ORM first.

## Run the generated backend

```powershell
cd demo-app\\backend
npm install
copy .env.example .env
npm start
```

The backend starts on port `3001` by default, returns a basic JSON payload from `/`, exposes `/api` routes, and reads database settings from `.env`.

## Current status

This repository provides the CLI foundation and the first real scaffold path.

Currently available command status:

- `kibs init`: implemented
- `kibs add entity`: implemented
- `kibs add auth`: registered placeholder
- `kibs generate`: implemented for backend generation

## Test the CLI

```powershell
npm test
node src/cli.js --help
node src/cli.js add --help
node src/cli.js add entity
node src/cli.js add auth
node src/cli.js generate
node src/cli.js init demo-app
```

Try adding an entity inside a generated project:

```powershell
cd demo-app
node ..\src\cli.js add entity
node ..\src\cli.js generate
```
