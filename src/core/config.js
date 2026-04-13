const fs = require("fs");
const path = require("path");

function createDefaultConfig(projectName) {
  const config = {
    version: 1,
    projectName,
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
  };

  return validateConfig(config);
}

function loadConfig(projectDirectory) {
  const configPath = getConfigPath(projectDirectory);

  if (!fs.existsSync(configPath)) {
    throw new Error(`Could not find kibs.config.json in ${projectDirectory}.`);
  }

  let rawConfig;

  try {
    rawConfig = fs.readFileSync(configPath, "utf8");
  } catch {
    throw new Error(`Could not read kibs.config.json in ${projectDirectory}.`);
  }

  let config;

  try {
    config = JSON.parse(rawConfig);
  } catch {
    throw new Error("kibs.config.json contains invalid JSON.");
  }

  return validateConfig(config);
}

function saveConfig(projectDirectory, config) {
  const validConfig = validateConfig(config);
  const configPath = getConfigPath(projectDirectory);
  const content = `${JSON.stringify(validConfig, null, 2)}\n`;

  fs.writeFileSync(configPath, content, "utf8");
}

function validateConfig(config) {
  assertPlainObject(config, 'kibs.config.json');

  if (config.version !== 1) {
    throw new Error("kibs.config.json must use version = 1.");
  }

  assertNonEmptyString(config.projectName, "projectName");

  assertPlainObject(config.frontend, "frontend");
  assertFieldValue(config.frontend.framework, "frontend.framework", "react");
  assertFieldValue(config.frontend.styling, "frontend.styling", "tailwind");

  assertPlainObject(config.backend, "backend");
  assertFieldValue(config.backend.framework, "backend.framework", "express");

  assertPlainObject(config.database, "database");
  assertFieldValue(config.database.client, "database.client", "mysql");

  assertPlainObject(config.auth, "auth");

  if (typeof config.auth.enabled !== "boolean") {
    throw new Error('kibs.config.json field "auth.enabled" must be a boolean.');
  }

  assertFieldValue(config.auth.mode, "auth.mode", "session");

  assertArray(config.entities, "entities");
  assertArray(config.relationships, "relationships");
  assertArray(config.reports, "reports");
  validateEntities(config.entities);

  return config;
}

function getConfigPath(projectDirectory) {
  return path.join(projectDirectory, "kibs.config.json");
}

function assertPlainObject(value, fieldName) {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    if (fieldName === "kibs.config.json") {
      throw new Error("kibs.config.json must be a JSON object.");
    }

    throw new Error(`kibs.config.json field "${fieldName}" must be an object.`);
  }
}

function assertNonEmptyString(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`kibs.config.json is missing required field: ${fieldName}.`);
  }
}

function assertFieldValue(value, fieldName, expectedValue) {
  if (typeof value === "undefined") {
    throw new Error(`kibs.config.json is missing required field: ${fieldName}.`);
  }

  throwIfUnexpectedValue(value, fieldName, expectedValue);
}

function throwIfUnexpectedValue(value, fieldName, expectedValue) {
  if (value !== expectedValue) {
    throw new Error(
      `kibs.config.json must use ${fieldName} = "${expectedValue}" for Kibs v1.`
    );
  }
}

function assertArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw new Error(`kibs.config.json field "${fieldName}" must be an array.`);
  }
}

function validateEntities(entities) {
  const entityNames = new Set();

  for (let index = 0; index < entities.length; index += 1) {
    const entity = entities[index];
    const entityPath = `entities[${index}]`;

    assertPlainObject(entity, entityPath);
    assertNonEmptyString(entity.name, `${entityPath}.name`);
    assertArray(entity.fields, `${entityPath}.fields`);

    const normalizedEntityName = entity.name.trim().toLowerCase();

    if (entityNames.has(normalizedEntityName)) {
      throw new Error(`kibs.config.json contains a duplicate entity name: ${entity.name}.`);
    }

    entityNames.add(normalizedEntityName);
    validateFields(entity.fields, entityPath, entity.name);
  }
}

function validateFields(fields, entityPath, entityName) {
  const fieldNames = new Set();

  for (let index = 0; index < fields.length; index += 1) {
    const field = fields[index];
    const fieldPath = `${entityPath}.fields[${index}]`;

    assertPlainObject(field, fieldPath);
    assertNonEmptyString(field.name, `${fieldPath}.name`);
    assertSupportedFieldType(field.type, `${fieldPath}.type`);
    assertBoolean(field.required, `${fieldPath}.required`);
    assertBoolean(field.unique, `${fieldPath}.unique`);

    const normalizedFieldName = field.name.trim().toLowerCase();

    if (fieldNames.has(normalizedFieldName)) {
      throw new Error(
        `kibs.config.json entity "${entityName}" contains a duplicate field name: ${field.name}.`
      );
    }

    fieldNames.add(normalizedFieldName);

    if (field.type === "enum") {
      assertArray(field.values, `${fieldPath}.values`);

      if (field.values.length === 0) {
        throw new Error(`kibs.config.json field "${fieldPath}.values" must not be empty.`);
      }

      for (let valueIndex = 0; valueIndex < field.values.length; valueIndex += 1) {
        assertNonEmptyString(field.values[valueIndex], `${fieldPath}.values[${valueIndex}]`);
      }
    }

    if (field.type === "foreignKey") {
      assertNonEmptyString(field.references, `${fieldPath}.references`);
    }
  }
}

function assertSupportedFieldType(value, fieldName) {
  const supportedTypes = [
    "string",
    "number",
    "date",
    "boolean",
    "text",
    "enum",
    "foreignKey",
  ];

  if (!supportedTypes.includes(value)) {
    throw new Error(
      `kibs.config.json field "${fieldName}" must be one of: ${supportedTypes.join(", ")}.`
    );
  }
}

function assertBoolean(value, fieldName) {
  if (typeof value !== "boolean") {
    throw new Error(`kibs.config.json field "${fieldName}" must be a boolean.`);
  }
}

module.exports = {
  createDefaultConfig,
  loadConfig,
  saveConfig,
  validateConfig,
};
