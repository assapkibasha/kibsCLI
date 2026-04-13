const fs = require("fs/promises");
const path = require("path");

async function ensureDir(directoryPath) {
  await fs.mkdir(directoryPath, { recursive: true });
}

async function writeFile(filePath, content) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, "utf8");
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function isDirectoryEmpty(directoryPath) {
  const entries = await fs.readdir(directoryPath);
  return entries.length === 0;
}

function assertSafeProjectTarget(projectName) {
  const trimmed = typeof projectName === "string" ? projectName.trim() : "";

  if (!trimmed) {
    throw new Error("Project name is required.");
  }

  if (trimmed.includes("/") || trimmed.includes("\\") || trimmed === "." || trimmed === "..") {
    throw new Error("Project name must be a single directory name.");
  }

  if (trimmed !== projectName) {
    throw new Error("Project name must not start or end with whitespace.");
  }
}

module.exports = {
  ensureDir,
  writeFile,
  pathExists,
  isDirectoryEmpty,
  assertSafeProjectTarget,
};
