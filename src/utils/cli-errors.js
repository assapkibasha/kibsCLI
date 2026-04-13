const logger = require("./logger");

function createUserError(message) {
  const error = new Error(message);
  error.isUserError = true;
  return error;
}

function handleCliError(error) {
  const message = error && error.message ? error.message : "Unknown error";

  logger.error(`Error: ${message}`);

  if (!error || error.isUserError) {
    return;
  }

  logger.error("Something unexpected failed. Re-run the command after checking your inputs.");
}

module.exports = {
  createUserError,
  handleCliError,
};
