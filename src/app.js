const { Command } = require("commander");
const packageJson = require("../package.json");
const { registerCommands } = require("./commands");

async function runCli(argv) {
  const program = new Command();

  program
    .name("kibs")
    .description("Kibs CLI generates full-stack CRUD applications with the Kibs v1 stack.")
    .version(packageJson.version)
    .showHelpAfterError("(run 'kibs --help' for usage)")
    .addHelpText(
      "after",
      `
Examples:
  $ kibs init demo-app
  $ kibs add entity
  $ kibs add auth
  $ kibs generate
`
    );

  registerCommands(program);

  await program.parseAsync(argv);
}

module.exports = {
  runCli,
};
