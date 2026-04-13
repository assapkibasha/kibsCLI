const path = require("path");
const { loadConfig } = require("./config");
const { createEntityNaming } = require("./naming");
const { ensureDir, writeFile } = require("../utils/files");

async function generateBackend(projectDirectory) {
  const config = loadConfig(projectDirectory);
  const backendDirectory = path.join(projectDirectory, "backend");

  await ensureDir(backendDirectory);

  const generatedFiles = buildBackendFiles(config);
  const writtenFiles = [];

  for (const [relativeFilePath, content] of Object.entries(generatedFiles)) {
    const absoluteFilePath = path.join(projectDirectory, relativeFilePath);
    await writeFile(absoluteFilePath, content);
    writtenFiles.push(relativeFilePath);
  }

  return {
    projectName: config.projectName,
    entityCount: config.entities.length,
    writtenFiles,
  };
}

function buildBackendFiles(config) {
  const files = {
    "backend/package.json": `${JSON.stringify(buildBackendPackageJson(config.projectName), null, 2)}\n`,
    "backend/.gitignore": "node_modules/\n.env\n",
    "backend/.env.example": buildEnvExample(),
    "backend/src/app.js": buildAppFile(),
    "backend/src/server.js": buildServerFile(),
    "backend/src/config/database.js": buildDatabaseConfigFile(),
    "backend/src/routes/index.js": buildRouteIndexFile(config),
  };

  for (const entity of config.entities) {
    const naming = createEntityNaming(entity.name);

    files[`backend/src/controllers/${naming.routeName}.js`] = buildControllerFile(entity, naming);
    files[`backend/src/routes/${naming.routeName}.js`] = buildEntityRouteFile(naming);
  }

  return files;
}

function buildBackendPackageJson(projectName) {
  return {
    name: `${projectName}-backend`,
    private: true,
    version: "0.1.0",
    main: "src/server.js",
    scripts: {
      start: "node src/server.js",
      dev: "node src/server.js",
    },
    dependencies: {
      dotenv: "^16.6.1",
      express: "^5.1.0",
      mysql2: "^3.15.2",
    },
  };
}

function buildEnvExample() {
  return `PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_NAME=kibs_app
DB_USER=root
DB_PASSWORD=password
`;
}

function buildAppFile() {
  return `const express = require("express");
const apiRouter = require("./routes");

const app = express();

app.use(express.json());

app.get("/", (_request, response) => {
  response.json({
    product: "Kibs",
    backend: "express",
    status: "ok"
  });
});

app.use("/api", apiRouter);

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({
    error: "Something went wrong while handling the request."
  });
});

app.use((request, response) => {
  response.status(404).json({
    error: \`Route not found: \${request.method} \${request.originalUrl}\`
  });
});

module.exports = app;
`;
}

function buildServerFile() {
  return `require("dotenv").config();

const app = require("./app");

const port = Number(process.env.PORT) || 3001;

app.listen(port, () => {
  console.log(\`Kibs backend listening on port \${port}\`);
});
`;
}

function buildDatabaseConfigFile() {
  return `const mysql = require("mysql2/promise");

let pool;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 3306,
      database: process.env.DB_NAME || "kibs_app",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }

  return pool;
}

async function query(sql, values) {
  const [rows] = await getPool().execute(sql, values);
  return rows;
}

module.exports = {
  getPool,
  query,
};
`;
}

function buildRouteIndexFile(config) {
  const entityImports = config.entities
    .map((entity) => {
      const naming = createEntityNaming(entity.name);
      return `const ${createRouterVariableName(naming.routeName)} = require("./${naming.routeName}");`;
    })
    .join("\n");

  const entityRoutes = config.entities
    .map((entity) => {
      const naming = createEntityNaming(entity.name);
      return `router.use("/${naming.routeName}", ${createRouterVariableName(naming.routeName)});`;
    })
    .join("\n");

  const importSection = entityImports ? `${entityImports}\n\n` : "";
  const routeSection = entityRoutes ? `${entityRoutes}\n\n` : "";

  return `const express = require("express");
${importSection}const router = express.Router();

router.get("/", (_request, response) => {
  response.json({
    status: "ok",
    message: "Kibs API ready"
  });
});

${routeSection}module.exports = router;
`;
}

function buildEntityRouteFile(naming) {
  const controllerVariableName = createControllerVariableName(naming.routeName);

  return `const express = require("express");
const ${controllerVariableName} = require("../controllers/${naming.routeName}");

const router = express.Router();

router.get("/", ${controllerVariableName}.list);
router.get("/:id", ${controllerVariableName}.getById);
router.post("/", ${controllerVariableName}.create);
router.put("/:id", ${controllerVariableName}.update);
router.delete("/:id", ${controllerVariableName}.remove);

module.exports = router;
`;
}

function buildControllerFile(entity, naming) {
  const writableFields = entity.fields.filter((field) => field.name !== "id");
  const fieldNames = writableFields.map((field) => field.name);
  const requiredFieldNames = writableFields
    .filter((field) => field.required)
    .map((field) => field.name);
  const relationshipNotes = writableFields
    .filter((field) => field.type === "foreignKey")
    .map((field) => {
      const referencedEntityNaming = createEntityNaming(field.references);
      return `  ${JSON.stringify(field.name)}: ${JSON.stringify(
        `${field.references} -> ${referencedEntityNaming.tableName}.id`
      )},`;
    })
    .join("\n");

  const relationshipSection = relationshipNotes
    ? `const RELATIONSHIPS = {\n${relationshipNotes}\n};\n\n`
    : "";

  const createInsertSection = fieldNames.length
    ? `  const columns = CREATE_FIELDS.join(", ");
  const placeholders = CREATE_FIELDS.map(() => "?").join(", ");
  const values = CREATE_FIELDS.map((fieldName) => payload[fieldName]);

  const result = await query(
    \`INSERT INTO \${TABLE_NAME} (\${columns}) VALUES (\${placeholders})\`,
    values
  );
`
    : `  const result = await query(\`INSERT INTO \${TABLE_NAME} () VALUES ()\`);
`;

  const createRequiredCheck = requiredFieldNames.length
    ? `  const missingFields = REQUIRED_FIELDS.filter((fieldName) => isMissingValue(payload[fieldName]));

  if (missingFields.length > 0) {
    return response.status(400).json({
      error: \`Missing required fields: \${missingFields.join(", ")}\`
    });
  }

`
    : "";

  return `const { query } = require("../config/database");

const ENTITY_NAME = ${JSON.stringify(naming.entityName)};
const TABLE_NAME = ${JSON.stringify(naming.tableName)};
const CREATE_FIELDS = ${JSON.stringify(fieldNames, null, 2)};
const REQUIRED_FIELDS = ${JSON.stringify(requiredFieldNames, null, 2)};
${relationshipSection}async function list(_request, response, next) {
  try {
    const rows = await query(\`SELECT * FROM \${TABLE_NAME} ORDER BY id DESC\`);
    response.json(rows);
  } catch (error) {
    next(error);
  }
}

async function getById(request, response, next) {
  try {
    const id = Number(request.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return response.status(400).json({ error: "A valid numeric id is required." });
    }

    const rows = await query(\`SELECT * FROM \${TABLE_NAME} WHERE id = ?\`, [id]);

    if (rows.length === 0) {
      return response.status(404).json({ error: \`\${ENTITY_NAME} not found.\` });
    }

    response.json(rows[0]);
  } catch (error) {
    next(error);
  }
}

async function create(request, response, next) {
  try {
    const payload = pickPayload(request.body);
${createRequiredCheck}${createInsertSection}
    const rows = await query(\`SELECT * FROM \${TABLE_NAME} WHERE id = ?\`, [result.insertId]);
    response.status(201).json(rows[0] || { id: result.insertId, ...payload });
  } catch (error) {
    next(error);
  }
}

async function update(request, response, next) {
  try {
    const id = Number(request.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return response.status(400).json({ error: "A valid numeric id is required." });
    }

    const payload = pickPayload(request.body);
    const fieldsToUpdate = Object.keys(payload);

    if (fieldsToUpdate.length === 0) {
      return response.status(400).json({ error: "Provide at least one field to update." });
    }

    const assignments = fieldsToUpdate.map((fieldName) => \`\${fieldName} = ?\`).join(", ");
    const values = fieldsToUpdate.map((fieldName) => payload[fieldName]);
    const result = await query(
      \`UPDATE \${TABLE_NAME} SET \${assignments} WHERE id = ?\`,
      values.concat(id)
    );

    if (result.affectedRows === 0) {
      return response.status(404).json({ error: \`\${ENTITY_NAME} not found.\` });
    }

    const rows = await query(\`SELECT * FROM \${TABLE_NAME} WHERE id = ?\`, [id]);
    response.json(rows[0]);
  } catch (error) {
    next(error);
  }
}

async function remove(request, response, next) {
  try {
    const id = Number(request.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return response.status(400).json({ error: "A valid numeric id is required." });
    }

    const result = await query(\`DELETE FROM \${TABLE_NAME} WHERE id = ?\`, [id]);

    if (result.affectedRows === 0) {
      return response.status(404).json({ error: \`\${ENTITY_NAME} not found.\` });
    }

    response.status(204).send();
  } catch (error) {
    next(error);
  }
}

function pickPayload(body) {
  const payload = {};
  const source = body && typeof body === "object" ? body : {};

  for (const fieldName of CREATE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(source, fieldName)) {
      payload[fieldName] = source[fieldName];
    }
  }

  return payload;
}

function isMissingValue(value) {
  return typeof value === "undefined" || value === null || value === "";
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
};
`;
}

function createRouterVariableName(routeName) {
  return `${toSafeIdentifier(routeName)}Router`;
}

function createControllerVariableName(routeName) {
  return `${toSafeIdentifier(routeName)}Controller`;
}

function toSafeIdentifier(value) {
  return value.replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase());
}

module.exports = {
  generateBackend,
};
