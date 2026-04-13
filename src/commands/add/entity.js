const fs = require("fs");
const readline = require("node:readline/promises");
const { loadConfig, saveConfig, validateConfig } = require("../../core/config");
const {
  SUPPORTED_FIELD_TYPES,
  normalizeNameKey,
  validateEntityName,
  validateFieldName,
} = require("../../core/entity-definition");
const { createUserError } = require("../../utils/cli-errors");
const logger = require("../../utils/logger");

function registerAddEntityCommand(program) {
  program
    .command("entity")
    .description("Add an entity definition to kibs.config.json")
    .action(async () => {
      const projectDirectory = process.cwd();
      let config;

      try {
        config = loadConfig(projectDirectory);
      } catch (error) {
        throw createUserError(error.message);
      }

      const promptSession = createPromptSession();

      try {
        logger.info("Add a new entity to this Kibs project.");
        logger.info("Press Enter without a field name when you are done adding fields.");
        logger.info("");

        const entity = await promptForEntity(promptSession, config);
        const nextConfig = {
          ...config,
          entities: config.entities.concat(entity),
        };

        validateConfig(nextConfig);
        saveConfig(projectDirectory, nextConfig);

        logger.success(
          `Saved entity "${entity.name}" with ${entity.fields.length} field${entity.fields.length === 1 ? "" : "s"}.`
        );
      } finally {
        promptSession.close();
      }
    });
}

function createPromptSession() {
  if (process.stdin.isTTY) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return {
      ask(question) {
        return rl.question(question);
      },
      close() {
        rl.close();
      },
    };
  }

  const pipedInput = fs.readFileSync(0, "utf8");
  const lines = pipedInput.split(/\r?\n/);
  let lineIndex = 0;

  return {
    ask(question) {
      process.stdout.write(question);
      const answer = lineIndex < lines.length ? lines[lineIndex] : "";
      lineIndex += 1;
      return Promise.resolve(answer);
    },
    close() {},
  };
}

async function promptForEntity(promptSession, config) {
  const entityName = await promptForEntityName(promptSession, config.entities);
  const fields = await promptForFields(promptSession);

  if (fields.length === 0) {
    throw createUserError(`Entity "${entityName}" must include at least one field.`);
  }

  return {
    name: entityName,
    fields,
  };
}

async function promptForEntityName(promptSession, entities) {
  const existingNames = new Set(entities.map((entity) => normalizeNameKey(entity.name)));

  while (true) {
    const answer = await promptSession.ask("Entity name: ");
    const entityName = answer.trim();

    try {
      validateEntityName(entityName, "Entity name");
    } catch (error) {
      logger.info(toPromptMessage(error.message, "Enter a name like Employee or Project."));
      continue;
    }

    if (existingNames.has(normalizeNameKey(entityName))) {
      throw createUserError(`An entity named "${entityName}" already exists.`);
    }

    return entityName;
  }
}

async function promptForFields(promptSession) {
  const fields = [];
  const fieldNames = new Set();

  while (true) {
    logger.info("");
    const rawName = await promptSession.ask("Field name (leave blank to finish): ");
    const fieldName = rawName.trim();

    if (!fieldName) {
      return fields;
    }

    try {
      validateFieldName(fieldName, "Field name");
    } catch (error) {
      logger.info(
        toPromptMessage(
          error.message,
          "Use camelCase like firstName or departmentId."
        )
      );
      continue;
    }

    const normalizedFieldName = normalizeNameKey(fieldName);

    if (fieldNames.has(normalizedFieldName)) {
      logger.info(`Field "${fieldName}" is already in this entity. Choose a different name.`);
      continue;
    }

    const type = await promptForFieldType(promptSession);
    const field = {
      name: fieldName,
      type,
      required: await promptForYesNo(promptSession, "Required? (y/N): "),
      unique: await promptForYesNo(promptSession, "Unique? (y/N): "),
    };

    if (type === "enum") {
      field.values = await promptForEnumValues(promptSession);
    }

    if (type === "foreignKey") {
      field.references = await promptForReference(promptSession);
    }

    fields.push(field);
    fieldNames.add(normalizedFieldName);
    logger.success(`Added field "${fieldName}".`);
  }
}

async function promptForFieldType(promptSession) {
  logger.info("Field types:");

  for (let index = 0; index < SUPPORTED_FIELD_TYPES.length; index += 1) {
    logger.info(`${index + 1}. ${SUPPORTED_FIELD_TYPES[index]}`);
  }

  while (true) {
    const answer = (await promptSession.ask("Field type: ")).trim();

    if (!answer) {
      logger.info("Choose a field type from the list above.");
      continue;
    }

    const typeByNumber = SUPPORTED_FIELD_TYPES[Number(answer) - 1];

    if (typeByNumber) {
      return typeByNumber;
    }

    const normalizedAnswer = answer.toLowerCase();

    if (SUPPORTED_FIELD_TYPES.includes(normalizedAnswer)) {
      return normalizedAnswer;
    }

    logger.info(
      `Use a number 1-${SUPPORTED_FIELD_TYPES.length} or type the field name exactly.`
    );
  }
}

async function promptForYesNo(promptSession, question) {
  while (true) {
    const answer = (await promptSession.ask(question)).trim().toLowerCase();

    if (!answer || answer === "n" || answer === "no") {
      return false;
    }

    if (answer === "y" || answer === "yes") {
      return true;
    }

    logger.info("Please answer y or n.");
  }
}

async function promptForEnumValues(promptSession) {
  while (true) {
    const answer = await promptSession.ask("Enum values (comma-separated): ");
    const values = answer
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    if (values.length === 0) {
      logger.info("Enter at least one value, for example: active, inactive");
      continue;
    }

    return values;
  }
}

async function promptForReference(promptSession) {
  while (true) {
    const answer = await promptSession.ask("Referenced entity name: ");
    const reference = answer.trim();

    try {
      validateEntityName(reference, "Referenced entity name");
    } catch (error) {
      logger.info(
        toPromptMessage(
          error.message,
          "Enter the entity this field points to, for example: Department"
        )
      );
      continue;
    }

    return reference;
  }
}

function toPromptMessage(errorMessage, fallbackMessage) {
  if (typeof errorMessage !== "string") {
    return fallbackMessage;
  }

  const firstLetterIndex = errorMessage.search(/[A-Za-z]/);

  if (firstLetterIndex === -1) {
    return fallbackMessage;
  }

  return `${errorMessage.charAt(firstLetterIndex).toUpperCase()}${errorMessage.slice(
    firstLetterIndex + 1
  )}`;
}

module.exports = {
  registerAddEntityCommand,
};
