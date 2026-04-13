const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const { scaffoldProject } = require("../src/core/project-scaffold");
const { loadConfig, saveConfig } = require("../src/core/config");
const { generateBackend } = require("../src/core/backend-generator");

test("generateBackend writes a readable Express and MySQL backend from config entities", async () => {
  const tempDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "kibs-generate-"));
  await scaffoldProject("demo-app", tempDirectory);

  const projectDirectory = path.join(tempDirectory, "demo-app");
  const config = loadConfig(projectDirectory);

  config.entities = [
    {
      name: "Department",
      fields: [
        {
          name: "title",
          type: "string",
          required: true,
          unique: false,
        },
      ],
    },
    {
      name: "Employee",
      fields: [
        {
          name: "firstName",
          type: "string",
          required: true,
          unique: false,
        },
        {
          name: "departmentId",
          type: "foreignKey",
          required: false,
          unique: false,
          references: "Department",
        },
      ],
    },
  ];

  saveConfig(projectDirectory, config);

  const result = await generateBackend(projectDirectory);

  assert.equal(result.entityCount, 2);
  assert.match(result.writtenFiles.join("\n"), /backend\/src\/controllers\/employees\.js/);
  assert.match(result.writtenFiles.join("\n"), /backend\/src\/config\/database\.js/);

  const backendPackage = JSON.parse(
    await fs.readFile(path.join(projectDirectory, "backend/package.json"), "utf8")
  );
  assert.equal(backendPackage.dependencies.express, "^5.1.0");
  assert.equal(backendPackage.dependencies.mysql2, "^3.15.2");
  assert.equal(backendPackage.dependencies.dotenv, "^16.6.1");

  const envExample = await fs.readFile(
    path.join(projectDirectory, "backend/.env.example"),
    "utf8"
  );
  assert.match(envExample, /DB_HOST=localhost/);
  assert.match(envExample, /DB_NAME=kibs_app/);

  const appFile = await fs.readFile(path.join(projectDirectory, "backend/src/app.js"), "utf8");
  assert.match(appFile, /app\.use\("\/api", apiRouter\)/);
  assert.match(appFile, /Route not found/);

  const routeIndexFile = await fs.readFile(
    path.join(projectDirectory, "backend/src/routes/index.js"),
    "utf8"
  );
  assert.match(routeIndexFile, /router\.use\("\/departments", departmentsRouter\)/);
  assert.match(routeIndexFile, /router\.use\("\/employees", employeesRouter\)/);

  const employeeRouteFile = await fs.readFile(
    path.join(projectDirectory, "backend/src/routes/employees.js"),
    "utf8"
  );
  assert.match(employeeRouteFile, /router\.post\("\/", employeesController\.create\)/);
  assert.match(employeeRouteFile, /router\.delete\("\/:id", employeesController\.remove\)/);

  const employeeControllerFile = await fs.readFile(
    path.join(projectDirectory, "backend/src/controllers/employees.js"),
    "utf8"
  );
  assert.match(employeeControllerFile, /const TABLE_NAME = "employees"/);
  assert.match(employeeControllerFile, /const CREATE_FIELDS = \[/);
  assert.match(employeeControllerFile, /"firstName"/);
  assert.match(employeeControllerFile, /"departmentId"/);
  assert.match(employeeControllerFile, /Department -> departments\.id/);
  assert.match(employeeControllerFile, /async function create/);
  assert.match(employeeControllerFile, /async function update/);

  const databaseConfigFile = await fs.readFile(
    path.join(projectDirectory, "backend/src/config/database.js"),
    "utf8"
  );
  assert.match(databaseConfigFile, /mysql2\/promise/);
  assert.match(databaseConfigFile, /createPool/);
});
