const { scaffoldProject } = require("../core/project-scaffold");
const logger = require("../utils/logger");

function registerInitCommand(program) {
  program
    .command("init <project-name>")
    .description("Create a new Kibs project")
    .action(async (projectName) => {
      logger.info(`Creating Kibs project: ${projectName}`);

      const result = await scaffoldProject(projectName, process.cwd());

      for (const directory of result.createdDirectories) {
        logger.success(`Created: ${directory}`);
      }

      for (const file of result.createdFiles) {
        logger.success(`Created: ${file}`);
      }

      logger.info("");
      logger.info("Next steps:");
      logger.info(`1. cd ${result.relativeProjectPath}\\backend && npm install`);
      logger.info("2. npm start");
      logger.info(
        "3. Set up the frontend dependencies when continuing the Kibs generator flow"
      );
    });
}

module.exports = {
  registerInitCommand,
};
