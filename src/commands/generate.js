const { createUserError } = require("../utils/cli-errors");

function registerGenerateCommand(program) {
  program
    .command("generate")
    .description("Run Kibs code generation for the current project")
    .action(() => {
      throw createUserError(
        "'kibs generate' is planned but not implemented yet.\nCurrent Phase 2 work only prepares the command shell."
      );
    });
}

module.exports = {
  registerGenerateCommand,
};
