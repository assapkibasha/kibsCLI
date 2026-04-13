const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const { scaffoldProject } = require("../src/core/project-scaffold");

test("scaffold creates the expected project structure", async () => {
  const tempDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "kibs-cli-"));

  await scaffoldProject("demo-app", tempDirectory);

  const expectedPaths = [
    "demo-app",
    "demo-app/kibs.config.json",
    "demo-app/backend",
    "demo-app/backend/package.json",
    "demo-app/backend/src/app.js",
    "demo-app/backend/src/server.js",
    "demo-app/backend/src/routes/index.js",
    "demo-app/frontend",
    "demo-app/frontend/package.json",
    "demo-app/frontend/public/index.html",
    "demo-app/frontend/src/app.js",
    "demo-app/frontend/src/main.js",
    "demo-app/frontend/src/styles.css",
    "demo-app/README.md",
  ];

  for (const relativePath of expectedPaths) {
    const targetPath = path.join(tempDirectory, relativePath);
    await fs.access(targetPath);
  }

  const configContent = await fs.readFile(
    path.join(tempDirectory, "demo-app/kibs.config.json"),
    "utf8"
  );
  const config = JSON.parse(configContent);

  assert.deepEqual(config, {
    name: "demo-app",
    version: 1,
    stack: {
      frontend: "react-tailwind",
      backend: "express",
      database: "mysql",
      auth: "session",
    },
    features: {
      crud: true,
      relationships: "simple",
      reports: "simple",
    },
  });
});

test("scaffold rejects a non-empty target directory", async () => {
  const tempDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "kibs-cli-"));
  const targetDirectory = path.join(tempDirectory, "demo-app");

  await fs.mkdir(targetDirectory);
  await fs.writeFile(path.join(targetDirectory, "existing.txt"), "existing", "utf8");

  await assert.rejects(
    () => scaffoldProject("demo-app", tempDirectory),
    /already exists and is not empty/
  );
});
