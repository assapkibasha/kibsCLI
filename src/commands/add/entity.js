const { createUserError } = require("../../utils/cli-errors");

function registerAddEntityCommand(program) {
  program
    .command("entity")
    .description("Add a CRUD entity scaffold to a Kibs project")
    .action(() => {
      throw createUserError(
        "'kibs add entity' is planned but not implemented yet.\nCurrent Phase 2 work only prepares the command shell."
      );
    });
}

module.exports = {
  registerAddEntityCommand,
};
