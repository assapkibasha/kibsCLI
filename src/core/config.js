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

module.exports = {
  createDefaultConfig,
  loadConfig,
  saveConfig,
  validateConfig,
};
