const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const { spawnSync } = require("node:child_process");

const cliPath = path.resolve(__dirname, "../src/cli.js");

test("cli help exits successfully", () => {
  const result = spawnSync(process.execPath, [cliPath, "--help"], {
    encoding: "utf8",
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Kibs CLI/);
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
