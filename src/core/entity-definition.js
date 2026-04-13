const SUPPORTED_FIELD_TYPES = [
  "string",
  "number",
  "date",
  "boolean",
  "text",
  "enum",
  "foreignKey",
];

const ENTITY_NAME_PATTERN = /^[A-Z][A-Za-z0-9]*$/;
const FIELD_NAME_PATTERN = /^[a-z][A-Za-z0-9]*$/;

function validateEntities(entities, options = {}) {
  assertArray(entities, "entities");

  const entityNames = new Set();

  for (let index = 0; index < entities.length; index += 1) {
    const entity = entities[index];
    const entityPath = `entities[${index}]`;

    assertPlainObject(entity, entityPath);
    validateEntityName(entity.name, `${entityPath}.name`);
    assertArray(entity.fields, `${entityPath}.fields`);

    const normalizedEntityName = normalizeNameKey(entity.name);

    if (entityNames.has(normalizedEntityName)) {
      throw new Error(`kibs.config.json contains a duplicate entity name: ${entity.name}.`);
    }

    entityNames.add(normalizedEntityName);
  }

  for (let index = 0; index < entities.length; index += 1) {
    const entity = entities[index];

    validateEntityDefinition(entity, {
      entityPath: `entities[${index}]`,
      knownEntityNames: options.knownEntityNames || entityNames,
      requireKnownReferences:
        typeof options.requireKnownReferences === "boolean"
          ? options.requireKnownReferences
          : true,
    });
  }
}

function validateEntityDefinition(entity, options = {}) {
  const entityPath = options.entityPath || "entity";

  assertPlainObject(entity, entityPath);
  validateEntityName(entity.name, `${entityPath}.name`);
  assertArray(entity.fields, `${entityPath}.fields`);
  validateFields(entity.fields, entity.name, {
    entityPath,
    knownEntityNames: options.knownEntityNames,
    requireKnownReferences: options.requireKnownReferences,
  });
}

function validateFields(fields, entityName, options = {}) {
  const entityPath = options.entityPath || `entity "${entityName}"`;
  const fieldNames = new Set();

  for (let index = 0; index < fields.length; index += 1) {
    const field = fields[index];
    const fieldPath = `${entityPath}.fields[${index}]`;

    assertPlainObject(field, fieldPath);
    validateFieldName(field.name, `${fieldPath}.name`);
    assertSupportedFieldType(field.type, `${fieldPath}.type`);
    assertBoolean(field.required, `${fieldPath}.required`);
    assertBoolean(field.unique, `${fieldPath}.unique`);

    const normalizedFieldName = normalizeNameKey(field.name);

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
      validateEntityName(field.references, `${fieldPath}.references`);

      if (!field.name.endsWith("Id")) {
        throw new Error(
          `kibs.config.json field "${fieldPath}.name" must use camelCase and end with "Id" for foreign keys, for example: departmentId.`
        );
      }

      if (
        options.requireKnownReferences &&
        options.knownEntityNames &&
        !hasEntityName(options.knownEntityNames, field.references)
      ) {
        throw new Error(
          `kibs.config.json field "${fieldPath}.references" must reference an existing entity. Could not find "${field.references}".`
        );
      }

      if (normalizeNameKey(field.references) === normalizeNameKey(entityName)) {
        throw new Error(
          `kibs.config.json field "${fieldPath}.references" cannot reference "${entityName}". Self-referencing foreign keys are not supported in Kibs v1.`
        );
      }
    }
  }
}

function validateEntityName(value, fieldName = "Entity name") {
  assertTrimmedNonEmptyString(value, fieldName);

  if (!ENTITY_NAME_PATTERN.test(value)) {
    throw new Error(
      `${describeField(fieldName)} must use PascalCase with no spaces, for example: Employee or ParkingRecord.`
    );
  }
}

function validateFieldName(value, fieldName = "Field name") {
  assertTrimmedNonEmptyString(value, fieldName);

  if (!FIELD_NAME_PATTERN.test(value)) {
    throw new Error(
      `${describeField(fieldName)} must use camelCase with no spaces, for example: firstName or departmentId.`
    );
  }
}

function normalizeNameKey(value) {
  return value.trim().toLowerCase();
}

function hasEntityName(entityNames, targetName) {
  const normalizedTargetName = normalizeNameKey(targetName);

  if (entityNames instanceof Set) {
    return entityNames.has(normalizedTargetName);
  }

  for (const entityName of entityNames) {
    if (normalizeNameKey(entityName) === normalizedTargetName) {
      return true;
    }
  }

  return false;
}

function assertPlainObject(value, fieldName) {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    throw new Error(`${describeField(fieldName)} must be an object.`);
  }
}

function assertTrimmedNonEmptyString(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${describeField(fieldName)} must be a non-empty string.`);
  }

  if (value !== value.trim()) {
    throw new Error(`${describeField(fieldName)} must not start or end with spaces.`);
  }
}

function assertNonEmptyString(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${describeField(fieldName)} must be a non-empty string.`);
  }
}

function assertArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw new Error(`${describeField(fieldName)} must be an array.`);
  }
}

function assertSupportedFieldType(value, fieldName) {
  if (!SUPPORTED_FIELD_TYPES.includes(value)) {
    throw new Error(
      `${describeField(fieldName)} must be one of: ${SUPPORTED_FIELD_TYPES.join(", ")}.`
    );
  }
}

function assertBoolean(value, fieldName) {
  if (typeof value !== "boolean") {
    throw new Error(`${describeField(fieldName)} must be a boolean.`);
  }
}

function describeField(fieldName) {
  if (fieldName === "entities" || fieldName.startsWith("entities[")) {
    return `kibs.config.json field "${fieldName}"`;
  }

  return fieldName;
}

module.exports = {
  SUPPORTED_FIELD_TYPES,
  normalizeNameKey,
  validateEntities,
  validateEntityDefinition,
  validateEntityName,
  validateFieldName,
};
