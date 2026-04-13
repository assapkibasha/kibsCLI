const { generateBackend } = require("../core/backend-generator");
const logger = require("../utils/logger");

function registerGenerateCommand(program) {
  program
    .command("generate")
    .description("Run Kibs code generation for the current project")
    .action(async () => {
      logger.info("Generating backend from kibs.config.json...");

      const result = await generateBackend(process.cwd());

      for (const filePath of result.writtenFiles) {
        logger.success(`Generated: ${filePath}`);
      }

      logger.info("");
      logger.info(
        `Generated backend files for ${result.entityCount} entit${result.entityCount === 1 ? "y" : "ies"}.`
      );
      logger.info("Next steps:");
      logger.info("1. cd backend");
      logger.info("2. npm install");
      logger.info("3. Copy .env.example to .env and update your MySQL settings");
      logger.info("4. npm start");
    });
}

module.exports = {
  registerGenerateCommand,
};
