const { createUserError } = require("../../utils/cli-errors");

function registerAddAuthCommand(program) {
  program
    .command("auth")
    .description("Add session auth scaffolding to a Kibs project")
    .action(() => {
      throw createUserError(
        "'kibs add auth' is planned but not implemented yet.\nCurrent Phase 2 work only prepares the command shell."
      );
    });
}

module.exports = {
  registerAddAuthCommand,
};
