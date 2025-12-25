import { promisify } from "node:util";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
function chunkify(iterable, chunkSize) {
  if (typeof iterable[Symbol.iterator] !== "function") {
    throw new TypeError("Expected an `Iterable` in the first argument");
  }
  if (!(Number.isSafeInteger(chunkSize) && chunkSize > 0)) {
    throw new TypeError(`Expected \`chunkSize\` to be an integer from 1 and up, got \`${chunkSize}\``);
  }
  return {
    *[Symbol.iterator]() {
      if (Array.isArray(iterable)) {
        for (let index = 0; index < iterable.length; index += chunkSize) {
          yield iterable.slice(index, index + chunkSize);
        }
        return;
      }
      let chunk = [];
      for (const value of iterable) {
        chunk.push(value);
        if (chunk.length === chunkSize) {
          yield chunk;
          chunk = [];
        }
      }
      if (chunk.length > 0) {
        yield chunk;
      }
    }
  };
}
const pExecFile = promisify(execFile);
async function chunkedExec(binary, paths, maxPaths) {
  for (const chunk of chunkify(paths, maxPaths)) {
    await pExecFile(fileURLToPath(binary), chunk);
  }
}
export {
  chunkedExec as c
};
