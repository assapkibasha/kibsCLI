const { registerAddEntityCommand } = require("./entity");
const { registerAddAuthCommand } = require("./auth");

function registerAddCommand(program) {
  const addCommand = program
    .command("add")
    .description("Add project features to an existing Kibs app");

  registerAddEntityCommand(addCommand);
  registerAddAuthCommand(addCommand);

  addCommand.action(() => {
    addCommand.help();
  });
}

module.exports = {
  registerAddCommand,
};
