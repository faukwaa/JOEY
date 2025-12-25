import process from "node:process";
import path from "node:path";
import { promises } from "node:fs";
async function pathExists(path2) {
  try {
    await promises.access(path2);
    return true;
  } catch {
    return false;
  }
}
const resolvePath = (cwd, sourcePath, destinationPath) => {
  sourcePath = path.resolve(cwd, sourcePath);
  destinationPath = path.resolve(cwd, destinationPath);
  return {
    sourcePath,
    destinationPath
  };
};
const validatePathsExist = (sourcePath, destinationPath, suffix = "Path") => {
  if (!sourcePath || !destinationPath) {
    throw new TypeError(`\`source${suffix}\` and \`destination${suffix}\` required`);
  }
};
const validateSameDirectory = (source, destination) => {
  if (path.dirname(source) !== path.dirname(destination)) {
    throw new Error("`source` and `destination` must be in the same directory");
  }
};
const _moveFile = async (sourcePath, destinationPath, { overwrite = true, cwd = process.cwd(), directoryMode, validateDirectory = false } = {}) => {
  if (cwd) {
    ({ sourcePath, destinationPath } = resolvePath(cwd, sourcePath, destinationPath));
  }
  if (validateDirectory) {
    validateSameDirectory(sourcePath, destinationPath);
  }
  if (!overwrite && await pathExists(destinationPath)) {
    throw new Error(`The destination file exists: ${destinationPath}`);
  }
  await promises.mkdir(path.dirname(destinationPath), {
    recursive: true,
    mode: directoryMode
  });
  try {
    await promises.rename(sourcePath, destinationPath);
  } catch (error) {
    if (error.code === "EXDEV") {
      await promises.copyFile(sourcePath, destinationPath);
      await promises.unlink(sourcePath);
    } else {
      throw error;
    }
  }
};
async function moveFile(sourcePath, destinationPath, options) {
  validatePathsExist(sourcePath, destinationPath);
  return _moveFile(sourcePath, destinationPath, options);
}
export {
  moveFile as m
};
