const { registerInitCommand } = require("./init");
const { registerAddCommand } = require("./add");
const { registerGenerateCommand } = require("./generate");

function registerCommands(program) {
  registerInitCommand(program);
  registerAddCommand(program);
  registerGenerateCommand(program);
}

module.exports = {
  registerCommands,
};
