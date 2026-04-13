const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  createDefaultConfig,
  loadConfig,
  saveConfig,
  validateConfig,
} = require("../src/core/config");
const {
  validateEntityDefinition,
  validateEntityName,
  validateFieldName,
} = require("../src/core/entity-definition");

test("createDefaultConfig returns the stable v1 shape", () => {
  assert.deepEqual(createDefaultConfig("demo-app"), {
    version: 1,
    projectName: "demo-app",
    frontend: {
      framework: "react",
      styling: "tailwind",
    },
    backend: {
      framework: "express",
    },
    database: {
      client: "mysql",
    },
    auth: {
      enabled: true,
      mode: "session",
    },
    entities: [],
    relationships: [],
    reports: [],
  });
});

test("validateConfig accepts a valid v1 config", () => {
  const config = createDefaultConfig("demo-app");

  config.entities.push({
    name: "Department",
    fields: [
      {
        name: "title",
        type: "string",
        required: true,
        unique: false,
      },
    ],
  });

  config.entities.push({
    name: "Employee",
    fields: [
      {
        name: "firstName",
        type: "string",
        required: true,
        unique: false,
      },
      {
        name: "status",
        type: "enum",
        required: true,
        unique: false,
        values: ["active", "inactive"],
      },
      {
        name: "departmentId",
        type: "foreignKey",
        required: false,
        unique: false,
        references: "Department",
      },
    ],
  });

  assert.doesNotThrow(() => validateConfig(config));
});

test("validateEntityDefinition allows foreign keys without a project-level lookup set", () => {
  assert.doesNotThrow(() =>
    validateEntityDefinition({
      name: "Employee",
      fields: [
        {
          name: "managerId",
          type: "foreignKey",
          required: false,
          unique: false,
          references: "Manager",
        },
      ],
    }, { requireKnownReferences: false })
  );
});

test("validateFieldName accepts valid camelCase names", () => {
  assert.doesNotThrow(() => validateFieldName("firstName", "Field name"));
  assert.doesNotThrow(() => validateFieldName("departmentId", "Field name"));
});

test("validateConfig rejects invalid structures", () => {
  assert.throws(() => validateConfig(null), /must be a JSON object/);
  assert.throws(
    () => validateConfig({ ...createDefaultConfig("demo-app"), version: 2 }),
    /version = 1/
  );
  assert.throws(
    () => validateConfig({ ...createDefaultConfig("demo-app"), projectName: "" }),
    /projectName/
  );
  assert.throws(
    () =>
      validateConfig({
        ...createDefaultConfig("demo-app"),
        frontend: { framework: "vue", styling: "tailwind" },
      }),
    /frontend\.framework/
  );
  assert.throws(
    () =>
      validateConfig({
        ...createDefaultConfig("demo-app"),
        frontend: { framework: "react", styling: "css" },
      }),
    /frontend\.styling/
  );
  assert.throws(
    () =>
      validateConfig({
        ...createDefaultConfig("demo-app"),
        backend: { framework: "nestjs" },
      }),
    /backend\.framework/
  );
  assert.throws(
    () =>
      validateConfig({
        ...createDefaultConfig("demo-app"),
        database: { client: "postgres" },
      }),
    /database\.client/
  );
  assert.throws(
    () =>
      validateConfig({
        ...createDefaultConfig("demo-app"),
        auth: { enabled: "yes", mode: "session" },
      }),
    /auth\.enabled/
  );
  assert.throws(
    () =>
      validateConfig({
        ...createDefaultConfig("demo-app"),
        auth: { enabled: true, mode: "jwt" },
      }),
    /auth\.mode/
  );
  assert.throws(
    () => validateConfig({ ...createDefaultConfig("demo-app"), entities: {} }),
    /entities/
  );
  assert.throws(
    () => validateConfig({ ...createDefaultConfig("demo-app"), relationships: {} }),
    /relationships/
  );
  assert.throws(
    () => validateConfig({ ...createDefaultConfig("demo-app"), reports: {} }),
    /reports/
  );
  assert.throws(
    () =>
      validateConfig({
        ...createDefaultConfig("demo-app"),
        entities: [
          {
            name: "Employee",
            fields: [
              { name: "firstName", type: "string", required: true, unique: false },
            ],
          },
          {
            name: "Employee",
            fields: [
              { name: "lastName", type: "string", required: true, unique: false },
            ],
          },
        ],
      }),
    /duplicate entity name/i
  );
  assert.throws(
    () =>
      validateConfig({
        ...createDefaultConfig("demo-app"),
        entities: [
          {
            name: "Employee",
            fields: [
              { name: "firstName", type: "string", required: true, unique: false },
              { name: "firstName", type: "number", required: false, unique: false },
            ],
          },
        ],
      }),
    /duplicate field name/i
  );
  assert.throws(
    () =>
      validateConfig({
        ...createDefaultConfig("demo-app"),
        entities: [
          {
            name: "Employee Profile",
            fields: [
              { name: "status", type: "enum", required: true, unique: false, values: [] },
            ],
          },
        ],
      }),
    /PascalCase/
  );
  assert.throws(
    () => validateEntityName("", "Entity name"),
    /non-empty string/
  );
  assert.throws(
    () => validateFieldName("Employee", "Field name"),
    /camelCase/
  );
  assert.throws(
    () => validateFieldName("employee Name", "Field name"),
    /camelCase/
  );
  assert.throws(
    () => validateFieldName(" firstName", "Field name"),
    /must not start or end with spaces/
  );
  assert.throws(
    () =>
      validateConfig({
        ...createDefaultConfig("demo-app"),
        entities: [
          {
            name: "Employee",
            fields: [
              { name: "statusValue", type: "enum", required: true, unique: false, values: [] },
            ],
          },
        ],
      }),
    /must not be empty/
  );
  assert.throws(
    () =>
      validateConfig({
        ...createDefaultConfig("demo-app"),
        entities: [
          {
            name: "Employee",
            fields: [
              {
                name: "departmentId",
                type: "foreignKey",
                required: false,
                unique: false,
              },
            ],
          },
        ],
      }),
    /references/
  );
  assert.throws(
    () =>
      validateConfig({
        ...createDefaultConfig("demo-app"),
        entities: [
          {
            name: "Employee",
            fields: [
              {
                name: "departmentId",
                type: "foreignKey",
                required: false,
                unique: false,
                references: "Department",
              },
            ],
          },
        ],
      }),
    /must reference an existing entity/
  );
  assert.throws(
    () =>
      validateConfig({
        ...createDefaultConfig("demo-app"),
        entities: [
          {
            name: "Employee",
            fields: [
              {
                name: "managerId",
                type: "foreignKey",
                required: false,
                unique: false,
                references: "Employee",
              },
            ],
          },
        ],
      }),
    /Self-referencing foreign keys are not supported/
  );
  assert.throws(
    () =>
      validateConfig({
        ...createDefaultConfig("demo-app"),
        entities: [
          {
            name: "Department",
            fields: [
              { name: "title", type: "string", required: true, unique: false },
            ],
          },
          {
            name: "Employee",
            fields: [
              {
                name: "department",
                type: "foreignKey",
                required: false,
                unique: false,
                references: "Department",
              },
            ],
          },
        ],
      }),
    /end with "Id"/
  );
});

test("saveConfig writes pretty JSON with a trailing newline", () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "kibs-config-"));
  const config = createDefaultConfig("demo-app");

  saveConfig(tempDirectory, config);

  const content = fs.readFileSync(path.join(tempDirectory, "kibs.config.json"), "utf8");

  assert.match(content, /"projectName": "demo-app"/);
  assert.equal(content.endsWith("\n"), true);
});

test("loadConfig reads a valid saved config", () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "kibs-config-"));
  const config = createDefaultConfig("demo-app");

  saveConfig(tempDirectory, config);

  assert.deepEqual(loadConfig(tempDirectory), config);
});

test("loadConfig rejects missing files and invalid JSON", () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "kibs-config-"));

  assert.throws(() => loadConfig(tempDirectory), /Could not find kibs\.config\.json/);

  fs.writeFileSync(path.join(tempDirectory, "kibs.config.json"), "{invalid", "utf8");

  assert.throws(() => loadConfig(tempDirectory), /invalid JSON/);
});
