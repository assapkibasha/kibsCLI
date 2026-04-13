const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("node:child_process");
const { createDefaultConfig, saveConfig } = require("../src/core/config");

const cliPath = path.resolve(__dirname, "../src/cli.js");

test("cli help exits successfully", () => {
  const result = spawnSync(process.execPath, [cliPath, "--help"], {
    encoding: "utf8",
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Kibs CLI generates/);
  assert.match(result.stdout, /init <project-name>/);
  assert.match(result.stdout, /\badd\b/);
  assert.match(result.stdout, /\bgenerate\b/);
});

test("cli version exits successfully", () => {
  const result = spawnSync(process.execPath, [cliPath, "--version"], {
    encoding: "utf8",
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout.trim(), /^0\.1\.0$/);
});

test("init without a project name fails", () => {
  const result = spawnSync(process.execPath, [cliPath, "init"], {
    encoding: "utf8",
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /missing required argument/i);
});

test("add help lists subcommands", () => {
  const result = spawnSync(process.execPath, [cliPath, "add", "--help"], {
    encoding: "utf8",
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /\bentity\b/);
  assert.match(result.stdout, /\bauth\b/);
});

test("add entity saves a new entity into kibs.config.json", () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "kibs-add-entity-"));
  saveConfig(tempDirectory, createDefaultConfig("demo-app"));

  const result = spawnSync(process.execPath, [cliPath, "add", "entity"], {
    encoding: "utf8",
    cwd: tempDirectory,
    input: "Employee\nfirstName\n1\ny\nn\n\n",
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Saved entity "Employee" with 1 field/i);

  const updatedConfig = JSON.parse(
    fs.readFileSync(path.join(tempDirectory, "kibs.config.json"), "utf8")
  );

  assert.deepEqual(updatedConfig.entities, [
    {
      name: "Employee",
      fields: [
        {
          name: "firstName",
          type: "string",
          required: true,
          unique: false,
        },
      ],
    },
  ]);
});

test("add entity rejects duplicate entity names", () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "kibs-add-entity-"));
  const config = createDefaultConfig("demo-app");

  config.entities.push({
    name: "Employee",
    fields: [
      {
        name: "firstName",
        type: "string",
        required: true,
        unique: false,
      },
    ],
  });

  saveConfig(tempDirectory, config);

  const result = spawnSync(process.execPath, [cliPath, "add", "entity"], {
    encoding: "utf8",
    cwd: tempDirectory,
    input: "Employee\n",
  });

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /already exists/i);
});

test("add entity rejects unusable entity names during prompting", () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "kibs-add-entity-"));
  saveConfig(tempDirectory, createDefaultConfig("demo-app"));

  const result = spawnSync(process.execPath, [cliPath, "add", "entity"], {
    encoding: "utf8",
    cwd: tempDirectory,
    input: "Employee Profile\nEmployee\nfirstName\n1\ny\nn\n\n",
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /must use PascalCase with no spaces/i);
});

test("add entity rejects uppercase field names during prompting", () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "kibs-add-entity-"));
  saveConfig(tempDirectory, createDefaultConfig("demo-app"));

  const result = spawnSync(process.execPath, [cliPath, "add", "entity"], {
    encoding: "utf8",
    cwd: tempDirectory,
    input: "Employee\nEmployee\nfirstName\n1\ny\nn\n\n",
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /must use camelCase with no spaces/i);
});

test("add entity rejects field names with spaces during prompting", () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "kibs-add-entity-"));
  saveConfig(tempDirectory, createDefaultConfig("demo-app"));

  const result = spawnSync(process.execPath, [cliPath, "add", "entity"], {
    encoding: "utf8",
    cwd: tempDirectory,
    input: "Employee\nemployee name\nfirstName\n1\ny\nn\n\n",
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /must use camelCase with no spaces/i);
});

test("add entity rejects duplicate field names within the same entity", () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "kibs-add-entity-"));
  saveConfig(tempDirectory, createDefaultConfig("demo-app"));

  const result = spawnSync(process.execPath, [cliPath, "add", "entity"], {
    encoding: "utf8",
    cwd: tempDirectory,
    input: "Employee\nfirstName\n1\ny\nn\nfirstName\nlastName\n1\ny\nn\n\n",
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /already in this entity/i);

  const updatedConfig = JSON.parse(
    fs.readFileSync(path.join(tempDirectory, "kibs.config.json"), "utf8")
  );

  assert.deepEqual(updatedConfig.entities[0].fields, [
    {
      name: "firstName",
      type: "string",
      required: true,
      unique: false,
    },
    {
      name: "lastName",
      type: "string",
      required: true,
      unique: false,
    },
  ]);
});

test("add entity fails clearly when a foreign key points to an unknown entity", () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "kibs-add-entity-"));
  saveConfig(tempDirectory, createDefaultConfig("demo-app"));

  const result = spawnSync(process.execPath, [cliPath, "add", "entity"], {
    encoding: "utf8",
    cwd: tempDirectory,
    input: "Employee\ndepartmentId\n7\nn\nn\nDepartment\n\n",
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /must reference an existing entity/i);
});

test("add entity fails clearly for self-referencing foreign keys in v1", () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "kibs-add-entity-"));
  saveConfig(tempDirectory, createDefaultConfig("demo-app"));

  const result = spawnSync(process.execPath, [cliPath, "add", "entity"], {
    encoding: "utf8",
    cwd: tempDirectory,
    input: "Employee\nmanagerId\n7\nn\nn\nEmployee\n\n",
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Self-referencing foreign keys are not supported/i);
});

test("add auth is a clear placeholder", () => {
  const result = spawnSync(process.execPath, [cliPath, "add", "auth"], {
    encoding: "utf8",
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /not implemented yet/i);
});

test("generate is a clear placeholder", () => {
  const result = spawnSync(process.execPath, [cliPath, "generate"], {
    encoding: "utf8",
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /not implemented yet/i);
});
