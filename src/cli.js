#!/usr/bin/env node

const { Command } = require("commander");
const packageJson = require("../package.json");
const { registerInitCommand } = require("./commands/init");

async function main(argv) {
  const program = new Command();

  program
    .name("kibs")
    .description("Kibs CLI - terminal-based full-stack CRUD system generator")
    .version(packageJson.version);

  registerInitCommand(program);

  await program.parseAsync(argv);
}

main(process.argv).catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
