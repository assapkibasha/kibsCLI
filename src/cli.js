#!/usr/bin/env node

const { runCli } = require("./app");
const { handleCliError } = require("./utils/cli-errors");

runCli(process.argv).catch((error) => {
  handleCliError(error);
  process.exitCode = 1;
});
