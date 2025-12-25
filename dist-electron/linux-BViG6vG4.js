import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { c as commonjsGlobal, g as getDefaultExportFromCjs } from "./index-9BUM44k2.js";
import require$$0 from "fs";
import require$$0$1 from "path";
import require$$0$2 from "child_process";
import require$$0$3 from "os";
import require$$0$4 from "util";
import require$$0$6 from "assert";
import require$$0$5 from "events";
import require$$0$8 from "buffer";
import require$$0$7 from "stream";
import { m as moveFile } from "./index-xUpBvQPr.js";
var xdgTrashdir$1 = { exports: {} };
var df$1 = { exports: {} };
var execa = { exports: {} };
var crossSpawn = { exports: {} };
var windows;
var hasRequiredWindows;
function requireWindows() {
  if (hasRequiredWindows) return windows;
  hasRequiredWindows = 1;
  windows = isexe;
  isexe.sync = sync;
  var fs2 = require$$0;
  function checkPathExt(path2, options) {
    var pathext = options.pathExt !== void 0 ? options.pathExt : process.env.PATHEXT;
    if (!pathext) {
      return true;
    }
    pathext = pathext.split(";");
    if (pathext.indexOf("") !== -1) {
      return true;
    }
    for (var i = 0; i < pathext.length; i++) {
      var p = pathext[i].toLowerCase();
      if (p && path2.substr(-p.length).toLowerCase() === p) {
        return true;
      }
    }
    return false;
  }
  function checkStat(stat, path2, options) {
    if (!stat.isSymbolicLink() && !stat.isFile()) {
      return false;
    }
    return checkPathExt(path2, options);
  }
  function isexe(path2, options, cb) {
    fs2.stat(path2, function(er, stat) {
      cb(er, er ? false : checkStat(stat, path2, options));
    });
  }
  function sync(path2, options) {
    return checkStat(fs2.statSync(path2), path2, options);
  }
  return windows;
}
var mode;
var hasRequiredMode;
function requireMode() {
  if (hasRequiredMode) return mode;
  hasRequiredMode = 1;
  mode = isexe;
  isexe.sync = sync;
  var fs2 = require$$0;
  function isexe(path2, options, cb) {
    fs2.stat(path2, function(er, stat) {
      cb(er, er ? false : checkStat(stat, options));
    });
  }
  function sync(path2, options) {
    return checkStat(fs2.statSync(path2), options);
  }
  function checkStat(stat, options) {
    return stat.isFile() && checkMode(stat, options);
  }
  function checkMode(stat, options) {
    var mod = stat.mode;
    var uid = stat.uid;
    var gid = stat.gid;
    var myUid = options.uid !== void 0 ? options.uid : process.getuid && process.getuid();
    var myGid = options.gid !== void 0 ? options.gid : process.getgid && process.getgid();
    var u = parseInt("100", 8);
    var g = parseInt("010", 8);
    var o = parseInt("001", 8);
    var ug = u | g;
    var ret = mod & o || mod & g && gid === myGid || mod & u && uid === myUid || mod & ug && myUid === 0;
    return ret;
  }
  return mode;
}
var isexe_1;
var hasRequiredIsexe;
function requireIsexe() {
  if (hasRequiredIsexe) return isexe_1;
  hasRequiredIsexe = 1;
  var core;
  if (process.platform === "win32" || commonjsGlobal.TESTING_WINDOWS) {
    core = requireWindows();
  } else {
    core = requireMode();
  }
  isexe_1 = isexe;
  isexe.sync = sync;
  function isexe(path2, options, cb) {
    if (typeof options === "function") {
      cb = options;
      options = {};
    }
    if (!cb) {
      if (typeof Promise !== "function") {
        throw new TypeError("callback not provided");
      }
      return new Promise(function(resolve, reject) {
        isexe(path2, options || {}, function(er, is) {
          if (er) {
            reject(er);
          } else {
            resolve(is);
          }
        });
      });
    }
    core(path2, options || {}, function(er, is) {
      if (er) {
        if (er.code === "EACCES" || options && options.ignoreErrors) {
          er = null;
          is = false;
        }
      }
      cb(er, is);
    });
  }
  function sync(path2, options) {
    try {
      return core.sync(path2, options || {});
    } catch (er) {
      if (options && options.ignoreErrors || er.code === "EACCES") {
        return false;
      } else {
        throw er;
      }
    }
  }
  return isexe_1;
}
var which_1;
var hasRequiredWhich;
function requireWhich() {
  if (hasRequiredWhich) return which_1;
  hasRequiredWhich = 1;
  const isWindows = process.platform === "win32" || process.env.OSTYPE === "cygwin" || process.env.OSTYPE === "msys";
  const path2 = require$$0$1;
  const COLON = isWindows ? ";" : ":";
  const isexe = requireIsexe();
  const getNotFoundError = (cmd) => Object.assign(new Error(`not found: ${cmd}`), { code: "ENOENT" });
  const getPathInfo = (cmd, opt) => {
    const colon = opt.colon || COLON;
    const pathEnv = cmd.match(/\//) || isWindows && cmd.match(/\\/) ? [""] : [
      // windows always checks the cwd first
      ...isWindows ? [process.cwd()] : [],
      ...(opt.path || process.env.PATH || /* istanbul ignore next: very unusual */
      "").split(colon)
    ];
    const pathExtExe = isWindows ? opt.pathExt || process.env.PATHEXT || ".EXE;.CMD;.BAT;.COM" : "";
    const pathExt = isWindows ? pathExtExe.split(colon) : [""];
    if (isWindows) {
      if (cmd.indexOf(".") !== -1 && pathExt[0] !== "")
        pathExt.unshift("");
    }
    return {
      pathEnv,
      pathExt,
      pathExtExe
    };
  };
  const which = (cmd, opt, cb) => {
    if (typeof opt === "function") {
      cb = opt;
      opt = {};
    }
    if (!opt)
      opt = {};
    const { pathEnv, pathExt, pathExtExe } = getPathInfo(cmd, opt);
    const found = [];
    const step = (i) => new Promise((resolve, reject) => {
      if (i === pathEnv.length)
        return opt.all && found.length ? resolve(found) : reject(getNotFoundError(cmd));
      const ppRaw = pathEnv[i];
      const pathPart = /^".*"$/.test(ppRaw) ? ppRaw.slice(1, -1) : ppRaw;
      const pCmd = path2.join(pathPart, cmd);
      const p = !pathPart && /^\.[\\\/]/.test(cmd) ? cmd.slice(0, 2) + pCmd : pCmd;
      resolve(subStep(p, i, 0));
    });
    const subStep = (p, i, ii) => new Promise((resolve, reject) => {
      if (ii === pathExt.length)
        return resolve(step(i + 1));
      const ext = pathExt[ii];
      isexe(p + ext, { pathExt: pathExtExe }, (er, is) => {
        if (!er && is) {
          if (opt.all)
            found.push(p + ext);
          else
            return resolve(p + ext);
        }
        return resolve(subStep(p, i, ii + 1));
      });
    });
    return cb ? step(0).then((res) => cb(null, res), cb) : step(0);
  };
  const whichSync = (cmd, opt) => {
    opt = opt || {};
    const { pathEnv, pathExt, pathExtExe } = getPathInfo(cmd, opt);
    const found = [];
    for (let i = 0; i < pathEnv.length; i++) {
      const ppRaw = pathEnv[i];
      const pathPart = /^".*"$/.test(ppRaw) ? ppRaw.slice(1, -1) : ppRaw;
      const pCmd = path2.join(pathPart, cmd);
      const p = !pathPart && /^\.[\\\/]/.test(cmd) ? cmd.slice(0, 2) + pCmd : pCmd;
      for (let j = 0; j < pathExt.length; j++) {
        const cur = p + pathExt[j];
        try {
          const is = isexe.sync(cur, { pathExt: pathExtExe });
          if (is) {
            if (opt.all)
              found.push(cur);
            else
              return cur;
          }
        } catch (ex) {
        }
      }
    }
    if (opt.all && found.length)
      return found;
    if (opt.nothrow)
      return null;
    throw getNotFoundError(cmd);
  };
  which_1 = which;
  which.sync = whichSync;
  return which_1;
}
var pathKey = { exports: {} };
var hasRequiredPathKey;
function requirePathKey() {
  if (hasRequiredPathKey) return pathKey.exports;
  hasRequiredPathKey = 1;
  const pathKey$1 = (options = {}) => {
    const environment = options.env || process.env;
    const platform = options.platform || process.platform;
    if (platform !== "win32") {
      return "PATH";
    }
    return Object.keys(environment).reverse().find((key) => key.toUpperCase() === "PATH") || "Path";
  };
  pathKey.exports = pathKey$1;
  pathKey.exports.default = pathKey$1;
  return pathKey.exports;
}
var resolveCommand_1;
var hasRequiredResolveCommand;
function requireResolveCommand() {
  if (hasRequiredResolveCommand) return resolveCommand_1;
  hasRequiredResolveCommand = 1;
  const path2 = require$$0$1;
  const which = requireWhich();
  const getPathKey = requirePathKey();
  function resolveCommandAttempt(parsed, withoutPathExt) {
    const env = parsed.options.env || process.env;
    const cwd = process.cwd();
    const hasCustomCwd = parsed.options.cwd != null;
    const shouldSwitchCwd = hasCustomCwd && process.chdir !== void 0 && !process.chdir.disabled;
    if (shouldSwitchCwd) {
      try {
        process.chdir(parsed.options.cwd);
      } catch (err) {
      }
    }
    let resolved;
    try {
      resolved = which.sync(parsed.command, {
        path: env[getPathKey({ env })],
        pathExt: withoutPathExt ? path2.delimiter : void 0
      });
    } catch (e) {
    } finally {
      if (shouldSwitchCwd) {
        process.chdir(cwd);
      }
    }
    if (resolved) {
      resolved = path2.resolve(hasCustomCwd ? parsed.options.cwd : "", resolved);
    }
    return resolved;
  }
  function resolveCommand(parsed) {
    return resolveCommandAttempt(parsed) || resolveCommandAttempt(parsed, true);
  }
  resolveCommand_1 = resolveCommand;
  return resolveCommand_1;
}
var _escape = {};
var hasRequired_escape;
function require_escape() {
  if (hasRequired_escape) return _escape;
  hasRequired_escape = 1;
  const metaCharsRegExp = /([()\][%!^"`<>&|;, *?])/g;
  function escapeCommand(arg) {
    arg = arg.replace(metaCharsRegExp, "^$1");
    return arg;
  }
  function escapeArgument(arg, doubleEscapeMetaChars) {
    arg = `${arg}`;
    arg = arg.replace(/(?=(\\+?)?)\1"/g, '$1$1\\"');
    arg = arg.replace(/(?=(\\+?)?)\1$/, "$1$1");
    arg = `"${arg}"`;
    arg = arg.replace(metaCharsRegExp, "^$1");
    if (doubleEscapeMetaChars) {
      arg = arg.replace(metaCharsRegExp, "^$1");
    }
    return arg;
  }
  _escape.command = escapeCommand;
  _escape.argument = escapeArgument;
  return _escape;
}
var shebangRegex;
var hasRequiredShebangRegex;
function requireShebangRegex() {
  if (hasRequiredShebangRegex) return shebangRegex;
  hasRequiredShebangRegex = 1;
  shebangRegex = /^#!(.*)/;
  return shebangRegex;
}
var shebangCommand;
var hasRequiredShebangCommand;
function requireShebangCommand() {
  if (hasRequiredShebangCommand) return shebangCommand;
  hasRequiredShebangCommand = 1;
  const shebangRegex2 = requireShebangRegex();
  shebangCommand = (string = "") => {
    const match = string.match(shebangRegex2);
    if (!match) {
      return null;
    }
    const [path2, argument] = match[0].replace(/#! ?/, "").split(" ");
    const binary = path2.split("/").pop();
    if (binary === "env") {
      return argument;
    }
    return argument ? `${binary} ${argument}` : binary;
  };
  return shebangCommand;
}
var readShebang_1;
var hasRequiredReadShebang;
function requireReadShebang() {
  if (hasRequiredReadShebang) return readShebang_1;
  hasRequiredReadShebang = 1;
  const fs2 = require$$0;
  const shebangCommand2 = requireShebangCommand();
  function readShebang(command2) {
    const size = 150;
    const buffer = Buffer.alloc(size);
    let fd;
    try {
      fd = fs2.openSync(command2, "r");
      fs2.readSync(fd, buffer, 0, size, 0);
      fs2.closeSync(fd);
    } catch (e) {
    }
    return shebangCommand2(buffer.toString());
  }
  readShebang_1 = readShebang;
  return readShebang_1;
}
var parse_1;
var hasRequiredParse;
function requireParse() {
  if (hasRequiredParse) return parse_1;
  hasRequiredParse = 1;
  const path2 = require$$0$1;
  const resolveCommand = requireResolveCommand();
  const escape = require_escape();
  const readShebang = requireReadShebang();
  const isWin = process.platform === "win32";
  const isExecutableRegExp = /\.(?:com|exe)$/i;
  const isCmdShimRegExp = /node_modules[\\/].bin[\\/][^\\/]+\.cmd$/i;
  function detectShebang(parsed) {
    parsed.file = resolveCommand(parsed);
    const shebang = parsed.file && readShebang(parsed.file);
    if (shebang) {
      parsed.args.unshift(parsed.file);
      parsed.command = shebang;
      return resolveCommand(parsed);
    }
    return parsed.file;
  }
  function parseNonShell(parsed) {
    if (!isWin) {
      return parsed;
    }
    const commandFile = detectShebang(parsed);
    const needsShell = !isExecutableRegExp.test(commandFile);
    if (parsed.options.forceShell || needsShell) {
      const needsDoubleEscapeMetaChars = isCmdShimRegExp.test(commandFile);
      parsed.command = path2.normalize(parsed.command);
      parsed.command = escape.command(parsed.command);
      parsed.args = parsed.args.map((arg) => escape.argument(arg, needsDoubleEscapeMetaChars));
      const shellCommand = [parsed.command].concat(parsed.args).join(" ");
      parsed.args = ["/d", "/s", "/c", `"${shellCommand}"`];
      parsed.command = process.env.comspec || "cmd.exe";
      parsed.options.windowsVerbatimArguments = true;
    }
    return parsed;
  }
  function parse(command2, args, options) {
    if (args && !Array.isArray(args)) {
      options = args;
      args = null;
    }
    args = args ? args.slice(0) : [];
    options = Object.assign({}, options);
    const parsed = {
      command: command2,
      args,
      options,
      file: void 0,
      original: {
        command: command2,
        args
      }
    };
    return options.shell ? parsed : parseNonShell(parsed);
  }
  parse_1 = parse;
  return parse_1;
}
var enoent;
var hasRequiredEnoent;
function requireEnoent() {
  if (hasRequiredEnoent) return enoent;
  hasRequiredEnoent = 1;
  const isWin = process.platform === "win32";
  function notFoundError(original, syscall) {
    return Object.assign(new Error(`${syscall} ${original.command} ENOENT`), {
      code: "ENOENT",
      errno: "ENOENT",
      syscall: `${syscall} ${original.command}`,
      path: original.command,
      spawnargs: original.args
    });
  }
  function hookChildProcess(cp, parsed) {
    if (!isWin) {
      return;
    }
    const originalEmit = cp.emit;
    cp.emit = function(name, arg1) {
      if (name === "exit") {
        const err = verifyENOENT(arg1, parsed);
        if (err) {
          return originalEmit.call(cp, "error", err);
        }
      }
      return originalEmit.apply(cp, arguments);
    };
  }
  function verifyENOENT(status, parsed) {
    if (isWin && status === 1 && !parsed.file) {
      return notFoundError(parsed.original, "spawn");
    }
    return null;
  }
  function verifyENOENTSync(status, parsed) {
    if (isWin && status === 1 && !parsed.file) {
      return notFoundError(parsed.original, "spawnSync");
    }
    return null;
  }
  enoent = {
    hookChildProcess,
    verifyENOENT,
    verifyENOENTSync,
    notFoundError
  };
  return enoent;
}
var hasRequiredCrossSpawn;
function requireCrossSpawn() {
  if (hasRequiredCrossSpawn) return crossSpawn.exports;
  hasRequiredCrossSpawn = 1;
  const cp = require$$0$2;
  const parse = requireParse();
  const enoent2 = requireEnoent();
  function spawn(command2, args, options) {
    const parsed = parse(command2, args, options);
    const spawned = cp.spawn(parsed.command, parsed.args, parsed.options);
    enoent2.hookChildProcess(spawned, parsed);
    return spawned;
  }
  function spawnSync(command2, args, options) {
    const parsed = parse(command2, args, options);
    const result = cp.spawnSync(parsed.command, parsed.args, parsed.options);
    result.error = result.error || enoent2.verifyENOENTSync(result.status, parsed);
    return result;
  }
  crossSpawn.exports = spawn;
  crossSpawn.exports.spawn = spawn;
  crossSpawn.exports.sync = spawnSync;
  crossSpawn.exports._parse = parse;
  crossSpawn.exports._enoent = enoent2;
  return crossSpawn.exports;
}
var stripFinalNewline;
var hasRequiredStripFinalNewline;
function requireStripFinalNewline() {
  if (hasRequiredStripFinalNewline) return stripFinalNewline;
  hasRequiredStripFinalNewline = 1;
  stripFinalNewline = (input) => {
    const LF = typeof input === "string" ? "\n" : "\n".charCodeAt();
    const CR = typeof input === "string" ? "\r" : "\r".charCodeAt();
    if (input[input.length - 1] === LF) {
      input = input.slice(0, input.length - 1);
    }
    if (input[input.length - 1] === CR) {
      input = input.slice(0, input.length - 1);
    }
    return input;
  };
  return stripFinalNewline;
}
var npmRunPath = { exports: {} };
npmRunPath.exports;
var hasRequiredNpmRunPath;
function requireNpmRunPath() {
  if (hasRequiredNpmRunPath) return npmRunPath.exports;
  hasRequiredNpmRunPath = 1;
  (function(module) {
    const path2 = require$$0$1;
    const pathKey2 = requirePathKey();
    const npmRunPath2 = (options) => {
      options = {
        cwd: process.cwd(),
        path: process.env[pathKey2()],
        ...options
      };
      let previous;
      let cwdPath = path2.resolve(options.cwd);
      const result = [];
      while (previous !== cwdPath) {
        result.push(path2.join(cwdPath, "node_modules/.bin"));
        previous = cwdPath;
        cwdPath = path2.resolve(cwdPath, "..");
      }
      result.push(path2.dirname(process.execPath));
      return result.concat(options.path).join(path2.delimiter);
    };
    module.exports = npmRunPath2;
    module.exports.default = npmRunPath2;
    module.exports.env = (options) => {
      options = {
        env: process.env,
        ...options
      };
      const env = { ...options.env };
      const path22 = pathKey2({ env });
      options.path = env[path22];
      env[path22] = module.exports(options);
      return env;
    };
  })(npmRunPath);
  return npmRunPath.exports;
}
var onetime = { exports: {} };
var mimicFn = { exports: {} };
var hasRequiredMimicFn;
function requireMimicFn() {
  if (hasRequiredMimicFn) return mimicFn.exports;
  hasRequiredMimicFn = 1;
  const mimicFn$1 = (to, from) => {
    for (const prop of Reflect.ownKeys(from)) {
      Object.defineProperty(to, prop, Object.getOwnPropertyDescriptor(from, prop));
    }
    return to;
  };
  mimicFn.exports = mimicFn$1;
  mimicFn.exports.default = mimicFn$1;
  return mimicFn.exports;
}
var hasRequiredOnetime;
function requireOnetime() {
  if (hasRequiredOnetime) return onetime.exports;
  hasRequiredOnetime = 1;
  const mimicFn2 = requireMimicFn();
  const calledFunctions = /* @__PURE__ */ new WeakMap();
  const onetime$1 = (function_, options = {}) => {
    if (typeof function_ !== "function") {
      throw new TypeError("Expected a function");
    }
    let returnValue;
    let callCount = 0;
    const functionName = function_.displayName || function_.name || "<anonymous>";
    const onetime2 = function(...arguments_) {
      calledFunctions.set(onetime2, ++callCount);
      if (callCount === 1) {
        returnValue = function_.apply(this, arguments_);
        function_ = null;
      } else if (options.throw === true) {
        throw new Error(`Function \`${functionName}\` can only be called once`);
      }
      return returnValue;
    };
    mimicFn2(onetime2, function_);
    calledFunctions.set(onetime2, callCount);
    return onetime2;
  };
  onetime.exports = onetime$1;
  onetime.exports.default = onetime$1;
  onetime.exports.callCount = (function_) => {
    if (!calledFunctions.has(function_)) {
      throw new Error(`The given function \`${function_.name}\` is not wrapped by the \`onetime\` package`);
    }
    return calledFunctions.get(function_);
  };
  return onetime.exports;
}
var error;
var hasRequiredError;
function requireError() {
  if (hasRequiredError) return error;
  hasRequiredError = 1;
  const os2 = require$$0$3;
  const util = require$$0$4;
  const getCode = (error2, code) => {
    if (error2 && error2.code) {
      return [error2.code, os2.constants.errno[error2.code]];
    }
    if (Number.isInteger(code)) {
      return [util.getSystemErrorName(-code), code];
    }
    return [];
  };
  const getErrorPrefix = ({ timedOut, timeout, signal, exitCodeName, exitCode, isCanceled }) => {
    if (timedOut) {
      return `timed out after ${timeout} milliseconds`;
    }
    if (isCanceled) {
      return "was canceled";
    }
    if (signal) {
      return `was killed with ${signal}`;
    }
    if (exitCode !== void 0) {
      return `failed with exit code ${exitCode} (${exitCodeName})`;
    }
    return "failed";
  };
  const makeError = ({
    stdout,
    stderr,
    all,
    error: error2,
    signal,
    code,
    command: command2,
    timedOut,
    isCanceled,
    killed,
    parsed: { options: { timeout } }
  }) => {
    const [exitCodeName, exitCode] = getCode(error2, code);
    const prefix = getErrorPrefix({ timedOut, timeout, signal, exitCodeName, exitCode, isCanceled });
    const message = `Command ${prefix}: ${command2}`;
    if (error2 instanceof Error) {
      error2.originalMessage = error2.message;
      error2.message = `${message}
${error2.message}`;
    } else {
      error2 = new Error(message);
    }
    error2.command = command2;
    delete error2.code;
    error2.exitCode = exitCode;
    error2.exitCodeName = exitCodeName;
    error2.stdout = stdout;
    error2.stderr = stderr;
    if (all !== void 0) {
      error2.all = all;
    }
    if ("bufferedData" in error2) {
      delete error2.bufferedData;
    }
    error2.failed = true;
    error2.timedOut = Boolean(timedOut);
    error2.isCanceled = isCanceled;
    error2.killed = killed && !timedOut;
    error2.signal = signal || void 0;
    return error2;
  };
  error = makeError;
  return error;
}
var stdio = { exports: {} };
var hasRequiredStdio;
function requireStdio() {
  if (hasRequiredStdio) return stdio.exports;
  hasRequiredStdio = 1;
  const aliases = ["stdin", "stdout", "stderr"];
  const hasAlias = (opts) => aliases.some((alias) => opts[alias] !== void 0);
  const normalizeStdio = (opts) => {
    if (!opts) {
      return;
    }
    const { stdio: stdio2 } = opts;
    if (stdio2 === void 0) {
      return aliases.map((alias) => opts[alias]);
    }
    if (hasAlias(opts)) {
      throw new Error(`It's not possible to provide \`stdio\` in combination with one of ${aliases.map((alias) => `\`${alias}\``).join(", ")}`);
    }
    if (typeof stdio2 === "string") {
      return stdio2;
    }
    if (!Array.isArray(stdio2)) {
      throw new TypeError(`Expected \`stdio\` to be of type \`string\` or \`Array\`, got \`${typeof stdio2}\``);
    }
    const length = Math.max(stdio2.length, aliases.length);
    return Array.from({ length }, (value, index) => stdio2[index]);
  };
  stdio.exports = normalizeStdio;
  stdio.exports.node = (opts) => {
    const stdio2 = normalizeStdio(opts);
    if (stdio2 === "ipc") {
      return "ipc";
    }
    if (stdio2 === void 0 || typeof stdio2 === "string") {
      return [stdio2, stdio2, stdio2, "ipc"];
    }
    if (stdio2.includes("ipc")) {
      return stdio2;
    }
    return [...stdio2, "ipc"];
  };
  return stdio.exports;
}
var signalExit = { exports: {} };
var signals = { exports: {} };
var hasRequiredSignals;
function requireSignals() {
  if (hasRequiredSignals) return signals.exports;
  hasRequiredSignals = 1;
  (function(module) {
    module.exports = [
      "SIGABRT",
      "SIGALRM",
      "SIGHUP",
      "SIGINT",
      "SIGTERM"
    ];
    if (process.platform !== "win32") {
      module.exports.push(
        "SIGVTALRM",
        "SIGXCPU",
        "SIGXFSZ",
        "SIGUSR2",
        "SIGTRAP",
        "SIGSYS",
        "SIGQUIT",
        "SIGIOT"
        // should detect profiler and enable/disable accordingly.
        // see #21
        // 'SIGPROF'
      );
    }
    if (process.platform === "linux") {
      module.exports.push(
        "SIGIO",
        "SIGPOLL",
        "SIGPWR",
        "SIGSTKFLT",
        "SIGUNUSED"
      );
    }
  })(signals);
  return signals.exports;
}
var hasRequiredSignalExit;
function requireSignalExit() {
  if (hasRequiredSignalExit) return signalExit.exports;
  hasRequiredSignalExit = 1;
  var process2 = commonjsGlobal.process;
  const processOk = function(process3) {
    return process3 && typeof process3 === "object" && typeof process3.removeListener === "function" && typeof process3.emit === "function" && typeof process3.reallyExit === "function" && typeof process3.listeners === "function" && typeof process3.kill === "function" && typeof process3.pid === "number" && typeof process3.on === "function";
  };
  if (!processOk(process2)) {
    signalExit.exports = function() {
      return function() {
      };
    };
  } else {
    var assert = require$$0$6;
    var signals2 = requireSignals();
    var isWin = /^win/i.test(process2.platform);
    var EE = require$$0$5;
    if (typeof EE !== "function") {
      EE = EE.EventEmitter;
    }
    var emitter;
    if (process2.__signal_exit_emitter__) {
      emitter = process2.__signal_exit_emitter__;
    } else {
      emitter = process2.__signal_exit_emitter__ = new EE();
      emitter.count = 0;
      emitter.emitted = {};
    }
    if (!emitter.infinite) {
      emitter.setMaxListeners(Infinity);
      emitter.infinite = true;
    }
    signalExit.exports = function(cb, opts) {
      if (!processOk(commonjsGlobal.process)) {
        return function() {
        };
      }
      assert.equal(typeof cb, "function", "a callback must be provided for exit handler");
      if (loaded === false) {
        load();
      }
      var ev = "exit";
      if (opts && opts.alwaysLast) {
        ev = "afterexit";
      }
      var remove = function() {
        emitter.removeListener(ev, cb);
        if (emitter.listeners("exit").length === 0 && emitter.listeners("afterexit").length === 0) {
          unload();
        }
      };
      emitter.on(ev, cb);
      return remove;
    };
    var unload = function unload2() {
      if (!loaded || !processOk(commonjsGlobal.process)) {
        return;
      }
      loaded = false;
      signals2.forEach(function(sig) {
        try {
          process2.removeListener(sig, sigListeners[sig]);
        } catch (er) {
        }
      });
      process2.emit = originalProcessEmit;
      process2.reallyExit = originalProcessReallyExit;
      emitter.count -= 1;
    };
    signalExit.exports.unload = unload;
    var emit = function emit2(event, code, signal) {
      if (emitter.emitted[event]) {
        return;
      }
      emitter.emitted[event] = true;
      emitter.emit(event, code, signal);
    };
    var sigListeners = {};
    signals2.forEach(function(sig) {
      sigListeners[sig] = function listener() {
        if (!processOk(commonjsGlobal.process)) {
          return;
        }
        var listeners = process2.listeners(sig);
        if (listeners.length === emitter.count) {
          unload();
          emit("exit", null, sig);
          emit("afterexit", null, sig);
          if (isWin && sig === "SIGHUP") {
            sig = "SIGINT";
          }
          process2.kill(process2.pid, sig);
        }
      };
    });
    signalExit.exports.signals = function() {
      return signals2;
    };
    var loaded = false;
    var load = function load2() {
      if (loaded || !processOk(commonjsGlobal.process)) {
        return;
      }
      loaded = true;
      emitter.count += 1;
      signals2 = signals2.filter(function(sig) {
        try {
          process2.on(sig, sigListeners[sig]);
          return true;
        } catch (er) {
          return false;
        }
      });
      process2.emit = processEmit;
      process2.reallyExit = processReallyExit;
    };
    signalExit.exports.load = load;
    var originalProcessReallyExit = process2.reallyExit;
    var processReallyExit = function processReallyExit2(code) {
      if (!processOk(commonjsGlobal.process)) {
        return;
      }
      process2.exitCode = code || /* istanbul ignore next */
      0;
      emit("exit", process2.exitCode, null);
      emit("afterexit", process2.exitCode, null);
      originalProcessReallyExit.call(process2, process2.exitCode);
    };
    var originalProcessEmit = process2.emit;
    var processEmit = function processEmit2(ev, arg) {
      if (ev === "exit" && processOk(commonjsGlobal.process)) {
        if (arg !== void 0) {
          process2.exitCode = arg;
        }
        var ret = originalProcessEmit.apply(this, arguments);
        emit("exit", process2.exitCode, null);
        emit("afterexit", process2.exitCode, null);
        return ret;
      } else {
        return originalProcessEmit.apply(this, arguments);
      }
    };
  }
  return signalExit.exports;
}
var pFinally;
var hasRequiredPFinally;
function requirePFinally() {
  if (hasRequiredPFinally) return pFinally;
  hasRequiredPFinally = 1;
  pFinally = async (promise2, onFinally = (() => {
  })) => {
    let value;
    try {
      value = await promise2;
    } catch (error2) {
      await onFinally();
      throw error2;
    }
    await onFinally();
    return value;
  };
  return pFinally;
}
var kill;
var hasRequiredKill;
function requireKill() {
  if (hasRequiredKill) return kill;
  hasRequiredKill = 1;
  const os2 = require$$0$3;
  const onExit = requireSignalExit();
  const pFinally2 = requirePFinally();
  const DEFAULT_FORCE_KILL_TIMEOUT = 1e3 * 5;
  const spawnedKill = (kill2, signal = "SIGTERM", options = {}) => {
    const killResult = kill2(signal);
    setKillTimeout(kill2, signal, options, killResult);
    return killResult;
  };
  const setKillTimeout = (kill2, signal, options, killResult) => {
    if (!shouldForceKill(signal, options, killResult)) {
      return;
    }
    const timeout = getForceKillAfterTimeout(options);
    setTimeout(() => {
      kill2("SIGKILL");
    }, timeout).unref();
  };
  const shouldForceKill = (signal, { forceKillAfterTimeout }, killResult) => {
    return isSigterm(signal) && forceKillAfterTimeout !== false && killResult;
  };
  const isSigterm = (signal) => {
    return signal === os2.constants.signals.SIGTERM || typeof signal === "string" && signal.toUpperCase() === "SIGTERM";
  };
  const getForceKillAfterTimeout = ({ forceKillAfterTimeout = true }) => {
    if (forceKillAfterTimeout === true) {
      return DEFAULT_FORCE_KILL_TIMEOUT;
    }
    if (!Number.isInteger(forceKillAfterTimeout) || forceKillAfterTimeout < 0) {
      throw new TypeError(`Expected the \`forceKillAfterTimeout\` option to be a non-negative integer, got \`${forceKillAfterTimeout}\` (${typeof forceKillAfterTimeout})`);
    }
    return forceKillAfterTimeout;
  };
  const spawnedCancel = (spawned, context) => {
    const killResult = spawned.kill();
    if (killResult) {
      context.isCanceled = true;
    }
  };
  const timeoutKill = (spawned, signal, reject) => {
    spawned.kill(signal);
    reject(Object.assign(new Error("Timed out"), { timedOut: true, signal }));
  };
  const setupTimeout = (spawned, { timeout, killSignal = "SIGTERM" }, spawnedPromise) => {
    if (timeout === 0 || timeout === void 0) {
      return spawnedPromise;
    }
    if (!Number.isInteger(timeout) || timeout < 0) {
      throw new TypeError(`Expected the \`timeout\` option to be a non-negative integer, got \`${timeout}\` (${typeof timeout})`);
    }
    let timeoutId;
    const timeoutPromise = new Promise((resolve, reject) => {
      timeoutId = setTimeout(() => {
        timeoutKill(spawned, killSignal, reject);
      }, timeout);
    });
    const safeSpawnedPromise = pFinally2(spawnedPromise, () => {
      clearTimeout(timeoutId);
    });
    return Promise.race([timeoutPromise, safeSpawnedPromise]);
  };
  const setExitHandler = (spawned, { cleanup, detached }, timedPromise) => {
    if (!cleanup || detached) {
      return timedPromise;
    }
    const removeExitHandler = onExit(() => {
      spawned.kill();
    });
    return pFinally2(timedPromise, removeExitHandler);
  };
  kill = {
    spawnedKill,
    spawnedCancel,
    setupTimeout,
    setExitHandler
  };
  return kill;
}
var isStream_1;
var hasRequiredIsStream;
function requireIsStream() {
  if (hasRequiredIsStream) return isStream_1;
  hasRequiredIsStream = 1;
  const isStream = (stream2) => stream2 !== null && typeof stream2 === "object" && typeof stream2.pipe === "function";
  isStream.writable = (stream2) => isStream(stream2) && stream2.writable !== false && typeof stream2._write === "function" && typeof stream2._writableState === "object";
  isStream.readable = (stream2) => isStream(stream2) && stream2.readable !== false && typeof stream2._read === "function" && typeof stream2._readableState === "object";
  isStream.duplex = (stream2) => isStream.writable(stream2) && isStream.readable(stream2);
  isStream.transform = (stream2) => isStream.duplex(stream2) && typeof stream2._transform === "function";
  isStream_1 = isStream;
  return isStream_1;
}
var getStream = { exports: {} };
var once = { exports: {} };
var wrappy_1;
var hasRequiredWrappy;
function requireWrappy() {
  if (hasRequiredWrappy) return wrappy_1;
  hasRequiredWrappy = 1;
  wrappy_1 = wrappy;
  function wrappy(fn, cb) {
    if (fn && cb) return wrappy(fn)(cb);
    if (typeof fn !== "function")
      throw new TypeError("need wrapper function");
    Object.keys(fn).forEach(function(k) {
      wrapper[k] = fn[k];
    });
    return wrapper;
    function wrapper() {
      var args = new Array(arguments.length);
      for (var i = 0; i < args.length; i++) {
        args[i] = arguments[i];
      }
      var ret = fn.apply(this, args);
      var cb2 = args[args.length - 1];
      if (typeof ret === "function" && ret !== cb2) {
        Object.keys(cb2).forEach(function(k) {
          ret[k] = cb2[k];
        });
      }
      return ret;
    }
  }
  return wrappy_1;
}
var hasRequiredOnce;
function requireOnce() {
  if (hasRequiredOnce) return once.exports;
  hasRequiredOnce = 1;
  var wrappy = requireWrappy();
  once.exports = wrappy(once$1);
  once.exports.strict = wrappy(onceStrict);
  once$1.proto = once$1(function() {
    Object.defineProperty(Function.prototype, "once", {
      value: function() {
        return once$1(this);
      },
      configurable: true
    });
    Object.defineProperty(Function.prototype, "onceStrict", {
      value: function() {
        return onceStrict(this);
      },
      configurable: true
    });
  });
  function once$1(fn) {
    var f = function() {
      if (f.called) return f.value;
      f.called = true;
      return f.value = fn.apply(this, arguments);
    };
    f.called = false;
    return f;
  }
  function onceStrict(fn) {
    var f = function() {
      if (f.called)
        throw new Error(f.onceError);
      f.called = true;
      return f.value = fn.apply(this, arguments);
    };
    var name = fn.name || "Function wrapped with `once`";
    f.onceError = name + " shouldn't be called more than once";
    f.called = false;
    return f;
  }
  return once.exports;
}
var endOfStream;
var hasRequiredEndOfStream;
function requireEndOfStream() {
  if (hasRequiredEndOfStream) return endOfStream;
  hasRequiredEndOfStream = 1;
  var once2 = requireOnce();
  var noop = function() {
  };
  var qnt = commonjsGlobal.Bare ? queueMicrotask : process.nextTick.bind(process);
  var isRequest = function(stream2) {
    return stream2.setHeader && typeof stream2.abort === "function";
  };
  var isChildProcess = function(stream2) {
    return stream2.stdio && Array.isArray(stream2.stdio) && stream2.stdio.length === 3;
  };
  var eos = function(stream2, opts, callback) {
    if (typeof opts === "function") return eos(stream2, null, opts);
    if (!opts) opts = {};
    callback = once2(callback || noop);
    var ws = stream2._writableState;
    var rs = stream2._readableState;
    var readable = opts.readable || opts.readable !== false && stream2.readable;
    var writable = opts.writable || opts.writable !== false && stream2.writable;
    var cancelled = false;
    var onlegacyfinish = function() {
      if (!stream2.writable) onfinish();
    };
    var onfinish = function() {
      writable = false;
      if (!readable) callback.call(stream2);
    };
    var onend = function() {
      readable = false;
      if (!writable) callback.call(stream2);
    };
    var onexit = function(exitCode) {
      callback.call(stream2, exitCode ? new Error("exited with error code: " + exitCode) : null);
    };
    var onerror = function(err) {
      callback.call(stream2, err);
    };
    var onclose = function() {
      qnt(onclosenexttick);
    };
    var onclosenexttick = function() {
      if (cancelled) return;
      if (readable && !(rs && (rs.ended && !rs.destroyed))) return callback.call(stream2, new Error("premature close"));
      if (writable && !(ws && (ws.ended && !ws.destroyed))) return callback.call(stream2, new Error("premature close"));
    };
    var onrequest = function() {
      stream2.req.on("finish", onfinish);
    };
    if (isRequest(stream2)) {
      stream2.on("complete", onfinish);
      stream2.on("abort", onclose);
      if (stream2.req) onrequest();
      else stream2.on("request", onrequest);
    } else if (writable && !ws) {
      stream2.on("end", onlegacyfinish);
      stream2.on("close", onlegacyfinish);
    }
    if (isChildProcess(stream2)) stream2.on("exit", onexit);
    stream2.on("end", onend);
    stream2.on("finish", onfinish);
    if (opts.error !== false) stream2.on("error", onerror);
    stream2.on("close", onclose);
    return function() {
      cancelled = true;
      stream2.removeListener("complete", onfinish);
      stream2.removeListener("abort", onclose);
      stream2.removeListener("request", onrequest);
      if (stream2.req) stream2.req.removeListener("finish", onfinish);
      stream2.removeListener("end", onlegacyfinish);
      stream2.removeListener("close", onlegacyfinish);
      stream2.removeListener("finish", onfinish);
      stream2.removeListener("exit", onexit);
      stream2.removeListener("end", onend);
      stream2.removeListener("error", onerror);
      stream2.removeListener("close", onclose);
    };
  };
  endOfStream = eos;
  return endOfStream;
}
var pump_1;
var hasRequiredPump;
function requirePump() {
  if (hasRequiredPump) return pump_1;
  hasRequiredPump = 1;
  var once2 = requireOnce();
  var eos = requireEndOfStream();
  var fs2;
  try {
    fs2 = require("fs");
  } catch (e) {
  }
  var noop = function() {
  };
  var ancient = typeof process === "undefined" ? false : /^v?\.0/.test(process.version);
  var isFn = function(fn) {
    return typeof fn === "function";
  };
  var isFS = function(stream2) {
    if (!ancient) return false;
    if (!fs2) return false;
    return (stream2 instanceof (fs2.ReadStream || noop) || stream2 instanceof (fs2.WriteStream || noop)) && isFn(stream2.close);
  };
  var isRequest = function(stream2) {
    return stream2.setHeader && isFn(stream2.abort);
  };
  var destroyer = function(stream2, reading, writing, callback) {
    callback = once2(callback);
    var closed = false;
    stream2.on("close", function() {
      closed = true;
    });
    eos(stream2, { readable: reading, writable: writing }, function(err) {
      if (err) return callback(err);
      closed = true;
      callback();
    });
    var destroyed = false;
    return function(err) {
      if (closed) return;
      if (destroyed) return;
      destroyed = true;
      if (isFS(stream2)) return stream2.close(noop);
      if (isRequest(stream2)) return stream2.abort();
      if (isFn(stream2.destroy)) return stream2.destroy();
      callback(err || new Error("stream was destroyed"));
    };
  };
  var call = function(fn) {
    fn();
  };
  var pipe = function(from, to) {
    return from.pipe(to);
  };
  var pump = function() {
    var streams = Array.prototype.slice.call(arguments);
    var callback = isFn(streams[streams.length - 1] || noop) && streams.pop() || noop;
    if (Array.isArray(streams[0])) streams = streams[0];
    if (streams.length < 2) throw new Error("pump requires two streams per minimum");
    var error2;
    var destroys = streams.map(function(stream2, i) {
      var reading = i < streams.length - 1;
      var writing = i > 0;
      return destroyer(stream2, reading, writing, function(err) {
        if (!error2) error2 = err;
        if (err) destroys.forEach(call);
        if (reading) return;
        destroys.forEach(call);
        callback(error2);
      });
    });
    return streams.reduce(pipe);
  };
  pump_1 = pump;
  return pump_1;
}
var bufferStream;
var hasRequiredBufferStream;
function requireBufferStream() {
  if (hasRequiredBufferStream) return bufferStream;
  hasRequiredBufferStream = 1;
  const { PassThrough: PassThroughStream } = require$$0$7;
  bufferStream = (options) => {
    options = { ...options };
    const { array } = options;
    let { encoding } = options;
    const isBuffer = encoding === "buffer";
    let objectMode = false;
    if (array) {
      objectMode = !(encoding || isBuffer);
    } else {
      encoding = encoding || "utf8";
    }
    if (isBuffer) {
      encoding = null;
    }
    const stream2 = new PassThroughStream({ objectMode });
    if (encoding) {
      stream2.setEncoding(encoding);
    }
    let length = 0;
    const chunks = [];
    stream2.on("data", (chunk) => {
      chunks.push(chunk);
      if (objectMode) {
        length = chunks.length;
      } else {
        length += chunk.length;
      }
    });
    stream2.getBufferedValue = () => {
      if (array) {
        return chunks;
      }
      return isBuffer ? Buffer.concat(chunks, length) : chunks.join("");
    };
    stream2.getBufferedLength = () => length;
    return stream2;
  };
  return bufferStream;
}
var hasRequiredGetStream;
function requireGetStream() {
  if (hasRequiredGetStream) return getStream.exports;
  hasRequiredGetStream = 1;
  const { constants: BufferConstants } = require$$0$8;
  const pump = requirePump();
  const bufferStream2 = requireBufferStream();
  class MaxBufferError extends Error {
    constructor() {
      super("maxBuffer exceeded");
      this.name = "MaxBufferError";
    }
  }
  async function getStream$1(inputStream, options) {
    if (!inputStream) {
      return Promise.reject(new Error("Expected a stream"));
    }
    options = {
      maxBuffer: Infinity,
      ...options
    };
    const { maxBuffer } = options;
    let stream2;
    await new Promise((resolve, reject) => {
      const rejectPromise = (error2) => {
        if (error2 && stream2.getBufferedLength() <= BufferConstants.MAX_LENGTH) {
          error2.bufferedData = stream2.getBufferedValue();
        }
        reject(error2);
      };
      stream2 = pump(inputStream, bufferStream2(options), (error2) => {
        if (error2) {
          rejectPromise(error2);
          return;
        }
        resolve();
      });
      stream2.on("data", () => {
        if (stream2.getBufferedLength() > maxBuffer) {
          rejectPromise(new MaxBufferError());
        }
      });
    });
    return stream2.getBufferedValue();
  }
  getStream.exports = getStream$1;
  getStream.exports.default = getStream$1;
  getStream.exports.buffer = (stream2, options) => getStream$1(stream2, { ...options, encoding: "buffer" });
  getStream.exports.array = (stream2, options) => getStream$1(stream2, { ...options, array: true });
  getStream.exports.MaxBufferError = MaxBufferError;
  return getStream.exports;
}
var mergeStream;
var hasRequiredMergeStream;
function requireMergeStream() {
  if (hasRequiredMergeStream) return mergeStream;
  hasRequiredMergeStream = 1;
  const { PassThrough } = require$$0$7;
  mergeStream = function() {
    var sources = [];
    var output = new PassThrough({ objectMode: true });
    output.setMaxListeners(0);
    output.add = add;
    output.isEmpty = isEmpty;
    output.on("unpipe", remove);
    Array.prototype.slice.call(arguments).forEach(add);
    return output;
    function add(source) {
      if (Array.isArray(source)) {
        source.forEach(add);
        return this;
      }
      sources.push(source);
      source.once("end", remove.bind(null, source));
      source.once("error", output.emit.bind(output, "error"));
      source.pipe(output, { end: false });
      return this;
    }
    function isEmpty() {
      return sources.length == 0;
    }
    function remove(source) {
      sources = sources.filter(function(it) {
        return it !== source;
      });
      if (!sources.length && output.readable) {
        output.end();
      }
    }
  };
  return mergeStream;
}
var stream;
var hasRequiredStream;
function requireStream() {
  if (hasRequiredStream) return stream;
  hasRequiredStream = 1;
  const isStream = requireIsStream();
  const getStream2 = requireGetStream();
  const mergeStream2 = requireMergeStream();
  const handleInput = (spawned, input) => {
    if (input === void 0 || spawned.stdin === void 0) {
      return;
    }
    if (isStream(input)) {
      input.pipe(spawned.stdin);
    } else {
      spawned.stdin.end(input);
    }
  };
  const makeAllStream = (spawned) => {
    if (!spawned.stdout && !spawned.stderr) {
      return;
    }
    const mixed = mergeStream2();
    if (spawned.stdout) {
      mixed.add(spawned.stdout);
    }
    if (spawned.stderr) {
      mixed.add(spawned.stderr);
    }
    return mixed;
  };
  const getBufferedData = async (stream2, streamPromise) => {
    if (!stream2) {
      return;
    }
    stream2.destroy();
    try {
      return await streamPromise;
    } catch (error2) {
      return error2.bufferedData;
    }
  };
  const getStreamPromise = (stream2, { encoding, buffer, maxBuffer }) => {
    if (!stream2) {
      return;
    }
    if (!buffer) {
      return new Promise((resolve, reject) => {
        stream2.once("end", resolve).once("error", reject);
      });
    }
    if (encoding) {
      return getStream2(stream2, { encoding, maxBuffer });
    }
    return getStream2.buffer(stream2, { maxBuffer });
  };
  const getSpawnedResult = async ({ stdout, stderr, all }, { encoding, buffer, maxBuffer }, processDone) => {
    const stdoutPromise = getStreamPromise(stdout, { encoding, buffer, maxBuffer });
    const stderrPromise = getStreamPromise(stderr, { encoding, buffer, maxBuffer });
    const allPromise = getStreamPromise(all, { encoding, buffer, maxBuffer: maxBuffer * 2 });
    try {
      return await Promise.all([processDone, stdoutPromise, stderrPromise, allPromise]);
    } catch (error2) {
      return Promise.all([
        { error: error2, code: error2.code, signal: error2.signal, timedOut: error2.timedOut },
        getBufferedData(stdout, stdoutPromise),
        getBufferedData(stderr, stderrPromise),
        getBufferedData(all, allPromise)
      ]);
    }
  };
  const validateInputSync = ({ input }) => {
    if (isStream(input)) {
      throw new TypeError("The `input` option cannot be a stream in sync mode");
    }
  };
  stream = {
    handleInput,
    makeAllStream,
    getSpawnedResult,
    validateInputSync
  };
  return stream;
}
var promise;
var hasRequiredPromise;
function requirePromise() {
  if (hasRequiredPromise) return promise;
  hasRequiredPromise = 1;
  const mergePromiseProperty = (spawned, promise2, property) => {
    const value = typeof promise2 === "function" ? (...args) => promise2()[property](...args) : promise2[property].bind(promise2);
    Object.defineProperty(spawned, property, {
      value,
      writable: true,
      enumerable: false,
      configurable: true
    });
  };
  const mergePromise = (spawned, promise2) => {
    mergePromiseProperty(spawned, promise2, "then");
    mergePromiseProperty(spawned, promise2, "catch");
    if (Promise.prototype.finally) {
      mergePromiseProperty(spawned, promise2, "finally");
    }
    return spawned;
  };
  const getSpawnedPromise = (spawned) => {
    return new Promise((resolve, reject) => {
      spawned.on("exit", (code, signal) => {
        resolve({ code, signal });
      });
      spawned.on("error", (error2) => {
        reject(error2);
      });
      if (spawned.stdin) {
        spawned.stdin.on("error", (error2) => {
          reject(error2);
        });
      }
    });
  };
  promise = {
    mergePromise,
    getSpawnedPromise
  };
  return promise;
}
var command;
var hasRequiredCommand;
function requireCommand() {
  if (hasRequiredCommand) return command;
  hasRequiredCommand = 1;
  const SPACES_REGEXP = / +/g;
  const joinCommand = (file, args = []) => {
    if (!Array.isArray(args)) {
      return file;
    }
    return [file, ...args].join(" ");
  };
  const handleEscaping = (tokens, token, index) => {
    if (index === 0) {
      return [token];
    }
    const previousToken = tokens[tokens.length - 1];
    if (previousToken.endsWith("\\")) {
      return [...tokens.slice(0, -1), `${previousToken.slice(0, -1)} ${token}`];
    }
    return [...tokens, token];
  };
  const parseCommand = (command2) => {
    return command2.trim().split(SPACES_REGEXP).reduce(handleEscaping, []);
  };
  command = {
    joinCommand,
    parseCommand
  };
  return command;
}
var hasRequiredExeca;
function requireExeca() {
  if (hasRequiredExeca) return execa.exports;
  hasRequiredExeca = 1;
  const path2 = require$$0$1;
  const childProcess = require$$0$2;
  const crossSpawn2 = requireCrossSpawn();
  const stripFinalNewline2 = requireStripFinalNewline();
  const npmRunPath2 = requireNpmRunPath();
  const onetime2 = requireOnetime();
  const makeError = requireError();
  const normalizeStdio = requireStdio();
  const { spawnedKill, spawnedCancel, setupTimeout, setExitHandler } = requireKill();
  const { handleInput, getSpawnedResult, makeAllStream, validateInputSync } = requireStream();
  const { mergePromise, getSpawnedPromise } = requirePromise();
  const { joinCommand, parseCommand } = requireCommand();
  const DEFAULT_MAX_BUFFER = 1e3 * 1e3 * 100;
  const getEnv = ({ env: envOption, extendEnv, preferLocal, localDir }) => {
    const env = extendEnv ? { ...process.env, ...envOption } : envOption;
    if (preferLocal) {
      return npmRunPath2.env({ env, cwd: localDir });
    }
    return env;
  };
  const handleArgs = (file, args, options = {}) => {
    const parsed = crossSpawn2._parse(file, args, options);
    file = parsed.command;
    args = parsed.args;
    options = parsed.options;
    options = {
      maxBuffer: DEFAULT_MAX_BUFFER,
      buffer: true,
      stripFinalNewline: true,
      extendEnv: true,
      preferLocal: false,
      localDir: options.cwd || process.cwd(),
      encoding: "utf8",
      reject: true,
      cleanup: true,
      ...options,
      windowsHide: true
    };
    options.env = getEnv(options);
    options.stdio = normalizeStdio(options);
    if (process.platform === "win32" && path2.basename(file, ".exe") === "cmd") {
      args.unshift("/q");
    }
    return { file, args, options, parsed };
  };
  const handleOutput = (options, value, error2) => {
    if (typeof value !== "string" && !Buffer.isBuffer(value)) {
      return error2 === void 0 ? void 0 : "";
    }
    if (options.stripFinalNewline) {
      return stripFinalNewline2(value);
    }
    return value;
  };
  const execa$1 = (file, args, options) => {
    const parsed = handleArgs(file, args, options);
    const command2 = joinCommand(file, args);
    let spawned;
    try {
      spawned = childProcess.spawn(parsed.file, parsed.args, parsed.options);
    } catch (error2) {
      const dummySpawned = new childProcess.ChildProcess();
      const errorPromise = Promise.reject(makeError({
        error: error2,
        stdout: "",
        stderr: "",
        all: "",
        command: command2,
        parsed,
        timedOut: false,
        isCanceled: false,
        killed: false
      }));
      return mergePromise(dummySpawned, errorPromise);
    }
    const spawnedPromise = getSpawnedPromise(spawned);
    const timedPromise = setupTimeout(spawned, parsed.options, spawnedPromise);
    const processDone = setExitHandler(spawned, parsed.options, timedPromise);
    const context = { isCanceled: false };
    spawned.kill = spawnedKill.bind(null, spawned.kill.bind(spawned));
    spawned.cancel = spawnedCancel.bind(null, spawned, context);
    const handlePromise = async () => {
      const [{ error: error2, code, signal, timedOut }, stdoutResult, stderrResult, allResult] = await getSpawnedResult(spawned, parsed.options, processDone);
      const stdout = handleOutput(parsed.options, stdoutResult);
      const stderr = handleOutput(parsed.options, stderrResult);
      const all = handleOutput(parsed.options, allResult);
      if (error2 || code !== 0 || signal !== null) {
        const returnedError = makeError({
          error: error2,
          code,
          signal,
          stdout,
          stderr,
          all,
          command: command2,
          parsed,
          timedOut,
          isCanceled: context.isCanceled,
          killed: spawned.killed
        });
        if (!parsed.options.reject) {
          return returnedError;
        }
        throw returnedError;
      }
      return {
        command: command2,
        exitCode: 0,
        exitCodeName: "SUCCESS",
        stdout,
        stderr,
        all,
        failed: false,
        timedOut: false,
        isCanceled: false,
        killed: false
      };
    };
    const handlePromiseOnce = onetime2(handlePromise);
    crossSpawn2._enoent.hookChildProcess(spawned, parsed.parsed);
    handleInput(spawned, parsed.options.input);
    spawned.all = makeAllStream(spawned);
    return mergePromise(spawned, handlePromiseOnce);
  };
  execa.exports = execa$1;
  execa.exports.sync = (file, args, options) => {
    const parsed = handleArgs(file, args, options);
    const command2 = joinCommand(file, args);
    validateInputSync(parsed.options);
    let result;
    try {
      result = childProcess.spawnSync(parsed.file, parsed.args, parsed.options);
    } catch (error2) {
      throw makeError({
        error: error2,
        stdout: "",
        stderr: "",
        all: "",
        command: command2,
        parsed,
        timedOut: false,
        isCanceled: false,
        killed: false
      });
    }
    result.stdout = handleOutput(parsed.options, result.stdout, result.error);
    result.stderr = handleOutput(parsed.options, result.stderr, result.error);
    if (result.error || result.status !== 0 || result.signal !== null) {
      const error2 = makeError({
        ...result,
        code: result.status,
        command: command2,
        parsed,
        timedOut: result.error && result.error.code === "ETIMEDOUT",
        isCanceled: false,
        killed: result.signal !== null
      });
      if (!parsed.options.reject) {
        return error2;
      }
      throw error2;
    }
    return {
      command: command2,
      exitCode: 0,
      exitCodeName: "SUCCESS",
      stdout: result.stdout,
      stderr: result.stderr,
      failed: false,
      timedOut: false,
      isCanceled: false,
      killed: false
    };
  };
  execa.exports.command = (command2, options) => {
    const [file, ...args] = parseCommand(command2);
    return execa$1(file, args, options);
  };
  execa.exports.commandSync = (command2, options) => {
    const [file, ...args] = parseCommand(command2);
    return execa$1.sync(file, args, options);
  };
  execa.exports.node = (scriptPath, args, options = {}) => {
    if (args && !Array.isArray(args) && typeof args === "object") {
      options = args;
      args = [];
    }
    const stdio2 = normalizeStdio.node(options);
    const { nodePath = process.execPath, nodeOptions = process.execArgv } = options;
    return execa$1(
      nodePath,
      [
        ...nodeOptions,
        scriptPath,
        ...Array.isArray(args) ? args : []
      ],
      {
        ...options,
        stdin: void 0,
        stdout: void 0,
        stderr: void 0,
        stdio: stdio2,
        shell: false
      }
    );
  };
  return execa.exports;
}
var hasRequiredDf$1;
function requireDf$1() {
  if (hasRequiredDf$1) return df$1.exports;
  hasRequiredDf$1 = 1;
  const execa2 = requireExeca();
  const getColumnBoundaries = async (header) => {
    const regex = /^\S+\s+|\s*\S+\s*\S+$|\s*\S+/g;
    const boundaries = [];
    let match;
    while (match = regex.exec(header)) {
      boundaries.push(match[0].length);
    }
    boundaries[boundaries.length - 1] = -1;
    return boundaries;
  };
  const parseOutput = async (output) => {
    const lines = output.trim().split("\n");
    const boundaries = await getColumnBoundaries(lines[0]);
    return lines.slice(1).map((line) => {
      const cl = boundaries.map((boundary) => {
        const column = boundary > 0 ? line.slice(0, boundary) : line;
        line = line.slice(boundary);
        return column.trim();
      });
      return {
        filesystem: cl[0],
        size: parseInt(cl[1], 10) * 1024,
        used: parseInt(cl[2], 10) * 1024,
        available: parseInt(cl[3], 10) * 1024,
        capacity: parseInt(cl[4], 10) / 100,
        mountpoint: cl[5]
      };
    });
  };
  const run = async (args) => {
    const { stdout } = await execa2("df", args);
    return parseOutput(stdout);
  };
  const df2 = async () => run(["-kP"]);
  df2.fs = async (name) => {
    if (typeof name !== "string") {
      throw new TypeError("The `name` parameter required");
    }
    const data = await run(["-kP"]);
    for (const item of data) {
      if (item.filesystem === name) {
        return item;
      }
    }
    throw new Error(`The specified filesystem \`${name}\` doesn't exist`);
  };
  df2.file = async (file) => {
    if (typeof file !== "string") {
      throw new TypeError("The `file` parameter is required");
    }
    let data;
    try {
      data = await run(["-kP", file]);
    } catch (error2) {
      if (/No such file or directory/.test(error2.stderr)) {
        throw new Error(`The specified file \`${file}\` doesn't exist`);
      }
      throw error2;
    }
    return data[0];
  };
  df$1.exports = df2;
  df$1.exports.default = df2;
  if (process.env.NODE_ENV === "test") {
    df$1.exports._parseOutput = parseOutput;
  }
  return df$1.exports;
}
var df = { exports: {} };
var hasRequiredDf;
function requireDf() {
  if (hasRequiredDf) return df.exports;
  hasRequiredDf = 1;
  var childProcess = require$$0$2;
  function run(args, cb) {
    childProcess.execFile("df", args, function(err, stdout) {
      if (err) {
        cb(err);
        return;
      }
      cb(null, stdout.trim().split("\n").slice(1).map(function(el) {
        var cl = el.split(/\s+(?=[\d\/])/);
        return {
          filesystem: cl[0],
          size: parseInt(cl[1], 10) * 1024,
          used: parseInt(cl[2], 10) * 1024,
          available: parseInt(cl[3], 10) * 1024,
          capacity: parseInt(cl[4], 10) / 100,
          mountpoint: cl[5]
        };
      }));
    });
  }
  var df$12 = df.exports = function(cb) {
    run(["-kP"], cb);
  };
  df$12.fs = function(name, cb) {
    if (typeof name !== "string") {
      throw new Error("name required");
    }
    run(["-kP"], function(err, data) {
      if (err) {
        cb(err);
        return;
      }
      var ret;
      data.forEach(function(el) {
        if (el.filesystem === name) {
          ret = el;
        }
      });
      cb(null, ret);
    });
  };
  df$12.file = function(file, cb) {
    if (typeof file !== "string") {
      throw new Error("file required");
    }
    run(["-kP", file], function(err, data) {
      if (err) {
        cb(err);
        return;
      }
      cb(null, data[0]);
    });
  };
  return df.exports;
}
var pify = { exports: {} };
var hasRequiredPify;
function requirePify() {
  if (hasRequiredPify) return pify.exports;
  hasRequiredPify = 1;
  var processFn = function(fn, P, opts) {
    return function() {
      var that = this;
      var args = new Array(arguments.length);
      for (var i = 0; i < arguments.length; i++) {
        args[i] = arguments[i];
      }
      return new P(function(resolve, reject) {
        args.push(function(err, result) {
          if (err) {
            reject(err);
          } else if (opts.multiArgs) {
            var results = new Array(arguments.length - 1);
            for (var i2 = 1; i2 < arguments.length; i2++) {
              results[i2 - 1] = arguments[i2];
            }
            resolve(results);
          } else {
            resolve(result);
          }
        });
        fn.apply(that, args);
      });
    };
  };
  var pify$1 = pify.exports = function(obj, P, opts) {
    if (typeof P !== "function") {
      opts = P;
      P = Promise;
    }
    opts = opts || {};
    opts.exclude = opts.exclude || [/.+Sync$/];
    var filter = function(key) {
      var match = function(pattern) {
        return typeof pattern === "string" ? key === pattern : pattern.test(key);
      };
      return opts.include ? opts.include.some(match) : !opts.exclude.some(match);
    };
    var ret = typeof obj === "function" ? function() {
      if (opts.excludeMain) {
        return obj.apply(this, arguments);
      }
      return processFn(obj, P, opts).apply(this, arguments);
    } : {};
    return Object.keys(obj).reduce(function(ret2, key) {
      var x = obj[key];
      ret2[key] = typeof x === "function" && filter(key) ? processFn(x, P, opts) : x;
      return ret2;
    }, ret);
  };
  pify$1.all = pify$1;
  return pify.exports;
}
var pinkie;
var hasRequiredPinkie;
function requirePinkie() {
  if (hasRequiredPinkie) return pinkie;
  hasRequiredPinkie = 1;
  var PENDING = "pending";
  var SETTLED = "settled";
  var FULFILLED = "fulfilled";
  var REJECTED = "rejected";
  var NOOP = function() {
  };
  var isNode = typeof commonjsGlobal !== "undefined" && typeof commonjsGlobal.process !== "undefined" && typeof commonjsGlobal.process.emit === "function";
  var asyncSetTimer = typeof setImmediate === "undefined" ? setTimeout : setImmediate;
  var asyncQueue = [];
  var asyncTimer;
  function asyncFlush() {
    for (var i = 0; i < asyncQueue.length; i++) {
      asyncQueue[i][0](asyncQueue[i][1]);
    }
    asyncQueue = [];
    asyncTimer = false;
  }
  function asyncCall(callback, arg) {
    asyncQueue.push([callback, arg]);
    if (!asyncTimer) {
      asyncTimer = true;
      asyncSetTimer(asyncFlush, 0);
    }
  }
  function invokeResolver(resolver, promise2) {
    function resolvePromise(value) {
      resolve(promise2, value);
    }
    function rejectPromise(reason) {
      reject(promise2, reason);
    }
    try {
      resolver(resolvePromise, rejectPromise);
    } catch (e) {
      rejectPromise(e);
    }
  }
  function invokeCallback(subscriber) {
    var owner = subscriber.owner;
    var settled = owner._state;
    var value = owner._data;
    var callback = subscriber[settled];
    var promise2 = subscriber.then;
    if (typeof callback === "function") {
      settled = FULFILLED;
      try {
        value = callback(value);
      } catch (e) {
        reject(promise2, e);
      }
    }
    if (!handleThenable(promise2, value)) {
      if (settled === FULFILLED) {
        resolve(promise2, value);
      }
      if (settled === REJECTED) {
        reject(promise2, value);
      }
    }
  }
  function handleThenable(promise2, value) {
    var resolved;
    try {
      if (promise2 === value) {
        throw new TypeError("A promises callback cannot return that same promise.");
      }
      if (value && (typeof value === "function" || typeof value === "object")) {
        var then = value.then;
        if (typeof then === "function") {
          then.call(value, function(val) {
            if (!resolved) {
              resolved = true;
              if (value === val) {
                fulfill(promise2, val);
              } else {
                resolve(promise2, val);
              }
            }
          }, function(reason) {
            if (!resolved) {
              resolved = true;
              reject(promise2, reason);
            }
          });
          return true;
        }
      }
    } catch (e) {
      if (!resolved) {
        reject(promise2, e);
      }
      return true;
    }
    return false;
  }
  function resolve(promise2, value) {
    if (promise2 === value || !handleThenable(promise2, value)) {
      fulfill(promise2, value);
    }
  }
  function fulfill(promise2, value) {
    if (promise2._state === PENDING) {
      promise2._state = SETTLED;
      promise2._data = value;
      asyncCall(publishFulfillment, promise2);
    }
  }
  function reject(promise2, reason) {
    if (promise2._state === PENDING) {
      promise2._state = SETTLED;
      promise2._data = reason;
      asyncCall(publishRejection, promise2);
    }
  }
  function publish(promise2) {
    promise2._then = promise2._then.forEach(invokeCallback);
  }
  function publishFulfillment(promise2) {
    promise2._state = FULFILLED;
    publish(promise2);
  }
  function publishRejection(promise2) {
    promise2._state = REJECTED;
    publish(promise2);
    if (!promise2._handled && isNode) {
      commonjsGlobal.process.emit("unhandledRejection", promise2._data, promise2);
    }
  }
  function notifyRejectionHandled(promise2) {
    commonjsGlobal.process.emit("rejectionHandled", promise2);
  }
  function Promise2(resolver) {
    if (typeof resolver !== "function") {
      throw new TypeError("Promise resolver " + resolver + " is not a function");
    }
    if (this instanceof Promise2 === false) {
      throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
    }
    this._then = [];
    invokeResolver(resolver, this);
  }
  Promise2.prototype = {
    constructor: Promise2,
    _state: PENDING,
    _then: null,
    _data: void 0,
    _handled: false,
    then: function(onFulfillment, onRejection) {
      var subscriber = {
        owner: this,
        then: new this.constructor(NOOP),
        fulfilled: onFulfillment,
        rejected: onRejection
      };
      if ((onRejection || onFulfillment) && !this._handled) {
        this._handled = true;
        if (this._state === REJECTED && isNode) {
          asyncCall(notifyRejectionHandled, this);
        }
      }
      if (this._state === FULFILLED || this._state === REJECTED) {
        asyncCall(invokeCallback, subscriber);
      } else {
        this._then.push(subscriber);
      }
      return subscriber.then;
    },
    catch: function(onRejection) {
      return this.then(null, onRejection);
    }
  };
  Promise2.all = function(promises) {
    if (!Array.isArray(promises)) {
      throw new TypeError("You must pass an array to Promise.all().");
    }
    return new Promise2(function(resolve2, reject2) {
      var results = [];
      var remaining = 0;
      function resolver(index) {
        remaining++;
        return function(value) {
          results[index] = value;
          if (!--remaining) {
            resolve2(results);
          }
        };
      }
      for (var i = 0, promise2; i < promises.length; i++) {
        promise2 = promises[i];
        if (promise2 && typeof promise2.then === "function") {
          promise2.then(resolver(i), reject2);
        } else {
          results[i] = promise2;
        }
      }
      if (!remaining) {
        resolve2(results);
      }
    });
  };
  Promise2.race = function(promises) {
    if (!Array.isArray(promises)) {
      throw new TypeError("You must pass an array to Promise.race().");
    }
    return new Promise2(function(resolve2, reject2) {
      for (var i = 0, promise2; i < promises.length; i++) {
        promise2 = promises[i];
        if (promise2 && typeof promise2.then === "function") {
          promise2.then(resolve2, reject2);
        } else {
          resolve2(promise2);
        }
      }
    });
  };
  Promise2.resolve = function(value) {
    if (value && typeof value === "object" && value.constructor === Promise2) {
      return value;
    }
    return new Promise2(function(resolve2) {
      resolve2(value);
    });
  };
  Promise2.reject = function(reason) {
    return new Promise2(function(resolve2, reject2) {
      reject2(reason);
    });
  };
  pinkie = Promise2;
  return pinkie;
}
var pinkiePromise;
var hasRequiredPinkiePromise;
function requirePinkiePromise() {
  if (hasRequiredPinkiePromise) return pinkiePromise;
  hasRequiredPinkiePromise = 1;
  pinkiePromise = typeof Promise === "function" ? Promise : requirePinkie();
  return pinkiePromise;
}
var mountPoint;
var hasRequiredMountPoint;
function requireMountPoint() {
  if (hasRequiredMountPoint) return mountPoint;
  hasRequiredMountPoint = 1;
  var df2 = requireDf();
  var pify2 = requirePify();
  var Promise2 = requirePinkiePromise();
  mountPoint = function(file) {
    return pify2(df2.file, Promise2)(file).then(function(data) {
      return data.mountpoint;
    });
  };
  return mountPoint;
}
var osHomedir;
var hasRequiredOsHomedir;
function requireOsHomedir() {
  if (hasRequiredOsHomedir) return osHomedir;
  hasRequiredOsHomedir = 1;
  var os2 = require$$0$3;
  function homedir() {
    var env = process.env;
    var home = env.HOME;
    var user = env.LOGNAME || env.USER || env.LNAME || env.USERNAME;
    if (process.platform === "win32") {
      return env.USERPROFILE || env.HOMEDRIVE + env.HOMEPATH || home || null;
    }
    if (process.platform === "darwin") {
      return home || (user ? "/Users/" + user : null);
    }
    if (process.platform === "linux") {
      return home || (process.getuid() === 0 ? "/root" : user ? "/home/" + user : null);
    }
    return home || null;
  }
  osHomedir = typeof os2.homedir === "function" ? os2.homedir : homedir;
  return osHomedir;
}
var userHome;
var hasRequiredUserHome;
function requireUserHome() {
  if (hasRequiredUserHome) return userHome;
  hasRequiredUserHome = 1;
  userHome = requireOsHomedir()();
  return userHome;
}
var xdgBasedir = {};
var hasRequiredXdgBasedir;
function requireXdgBasedir() {
  if (hasRequiredXdgBasedir) return xdgBasedir;
  hasRequiredXdgBasedir = 1;
  (function(exports$1) {
    const os2 = require$$0$3;
    const path2 = require$$0$1;
    const homeDirectory = os2.homedir();
    const { env } = process;
    exports$1.data = env.XDG_DATA_HOME || (homeDirectory ? path2.join(homeDirectory, ".local", "share") : void 0);
    exports$1.config = env.XDG_CONFIG_HOME || (homeDirectory ? path2.join(homeDirectory, ".config") : void 0);
    exports$1.cache = env.XDG_CACHE_HOME || (homeDirectory ? path2.join(homeDirectory, ".cache") : void 0);
    exports$1.runtime = env.XDG_RUNTIME_DIR || void 0;
    exports$1.dataDirs = (env.XDG_DATA_DIRS || "/usr/local/share/:/usr/share/").split(":");
    if (exports$1.data) {
      exports$1.dataDirs.unshift(exports$1.data);
    }
    exports$1.configDirs = (env.XDG_CONFIG_DIRS || "/etc/xdg").split(":");
    if (exports$1.config) {
      exports$1.configDirs.unshift(exports$1.config);
    }
  })(xdgBasedir);
  return xdgBasedir;
}
var hasRequiredXdgTrashdir;
function requireXdgTrashdir() {
  if (hasRequiredXdgTrashdir) return xdgTrashdir$1.exports;
  hasRequiredXdgTrashdir = 1;
  const fs2 = require$$0.promises;
  const path2 = require$$0$1;
  const df2 = requireDf$1();
  const mountPoint2 = requireMountPoint();
  const userHome2 = requireUserHome();
  const xdgBasedir2 = requireXdgBasedir();
  const check = async (filePath) => {
    const topuid = `${filePath}-${process.getuid()}`;
    const stickyBitMode = 17407;
    try {
      const stats = await fs2.lstat(filePath);
      if (stats.isSymbolicLink() || stats.mode !== stickyBitMode) {
        return topuid;
      }
      return path2.join(filePath, String(process.getuid()));
    } catch (error2) {
      if (error2.code === "ENOENT") {
        return topuid;
      }
      return path2.join(xdgBasedir2.data, "Trash");
    }
  };
  xdgTrashdir$1.exports = async (filePath) => {
    if (process.platform !== "linux") {
      return Promise.reject(new Error("Only Linux systems are supported"));
    }
    if (!filePath) {
      return Promise.resolve(path2.join(xdgBasedir2.data, "Trash"));
    }
    const [homeMountPoint, fileMountPoint] = await Promise.all([
      mountPoint2(userHome2),
      // Ignore errors in case `file` is a dangling symlink
      mountPoint2(filePath).catch(() => {
      })
    ]);
    if (!fileMountPoint || fileMountPoint === homeMountPoint) {
      return path2.join(xdgBasedir2.data, "Trash");
    }
    return check(path2.join(fileMountPoint, ".Trash"));
  };
  xdgTrashdir$1.exports.all = async () => {
    if (process.platform !== "linux") {
      return Promise.reject(new Error("Only Linux systems are supported"));
    }
    return Promise.all((await df2()).map((fileSystem) => {
      if (fileSystem.mountpoint === "/") {
        return path2.join(xdgBasedir2.data, "Trash");
      }
      return check(path2.join(fileSystem.mountpoint, ".Trash"));
    }));
  };
  return xdgTrashdir$1.exports;
}
var xdgTrashdirExports = requireXdgTrashdir();
const xdgTrashdir = /* @__PURE__ */ getDefaultExportFromCjs(xdgTrashdirExports);
async function pMap(iterable, mapper, {
  concurrency: concurrency2 = Number.POSITIVE_INFINITY,
  stopOnError = true,
  signal
} = {}) {
  return new Promise((resolve_, reject_) => {
    if (iterable[Symbol.iterator] === void 0 && iterable[Symbol.asyncIterator] === void 0) {
      throw new TypeError(`Expected \`input\` to be either an \`Iterable\` or \`AsyncIterable\`, got (${typeof iterable})`);
    }
    if (typeof mapper !== "function") {
      throw new TypeError("Mapper function is required");
    }
    if (!(Number.isSafeInteger(concurrency2) && concurrency2 >= 1 || concurrency2 === Number.POSITIVE_INFINITY)) {
      throw new TypeError(`Expected \`concurrency\` to be an integer from 1 and up or \`Infinity\`, got \`${concurrency2}\` (${typeof concurrency2})`);
    }
    const result = [];
    const errors = [];
    const skippedIndexesMap = /* @__PURE__ */ new Map();
    let isRejected = false;
    let isResolved = false;
    let isIterableDone = false;
    let resolvingCount = 0;
    let currentIndex = 0;
    const iterator = iterable[Symbol.iterator] === void 0 ? iterable[Symbol.asyncIterator]() : iterable[Symbol.iterator]();
    const signalListener = () => {
      reject(signal.reason);
    };
    const cleanup = () => {
      signal?.removeEventListener("abort", signalListener);
    };
    const resolve = (value) => {
      resolve_(value);
      cleanup();
    };
    const reject = (reason) => {
      isRejected = true;
      isResolved = true;
      reject_(reason);
      cleanup();
    };
    if (signal) {
      if (signal.aborted) {
        reject(signal.reason);
      }
      signal.addEventListener("abort", signalListener, { once: true });
    }
    const next = async () => {
      if (isResolved) {
        return;
      }
      const nextItem = await iterator.next();
      const index = currentIndex;
      currentIndex++;
      if (nextItem.done) {
        isIterableDone = true;
        if (resolvingCount === 0 && !isResolved) {
          if (!stopOnError && errors.length > 0) {
            reject(new AggregateError(errors));
            return;
          }
          isResolved = true;
          if (skippedIndexesMap.size === 0) {
            resolve(result);
            return;
          }
          const pureResult = [];
          for (const [index2, value] of result.entries()) {
            if (skippedIndexesMap.get(index2) === pMapSkip) {
              continue;
            }
            pureResult.push(value);
          }
          resolve(pureResult);
        }
        return;
      }
      resolvingCount++;
      (async () => {
        try {
          const element = await nextItem.value;
          if (isResolved) {
            return;
          }
          const value = await mapper(element, index);
          if (value === pMapSkip) {
            skippedIndexesMap.set(index, value);
          }
          result[index] = value;
          resolvingCount--;
          await next();
        } catch (error2) {
          if (stopOnError) {
            reject(error2);
          } else {
            errors.push(error2);
            resolvingCount--;
            try {
              await next();
            } catch (error3) {
              reject(error3);
            }
          }
        }
      })();
    };
    (async () => {
      for (let index = 0; index < concurrency2; index++) {
        try {
          await next();
        } catch (error2) {
          reject(error2);
          break;
        }
        if (isIterableDone || isRejected) {
          break;
        }
      }
    })();
  });
}
const pMapSkip = /* @__PURE__ */ Symbol("skip");
var procfsError;
var hasRequiredProcfsError;
function requireProcfsError() {
  if (hasRequiredProcfsError) return procfsError;
  hasRequiredProcfsError = 1;
  class ProcfsError extends Error {
    constructor(code, message, sourceError) {
      super(message);
      this.name = "ProcfsError";
      this.code = code;
      if (sourceError !== void 0) {
        this.sourceError = sourceError;
      }
    }
  }
  ProcfsError.ERR_PARSING_FAILED = "EPARSE";
  ProcfsError.ERR_UNKNOWN = "EUNKNOWN";
  ProcfsError.ERR_NOT_FOUND = "ENOENT";
  ProcfsError.parsingError = (src, msg) => {
    let e = new ProcfsError(ProcfsError.ERR_PARSING_FAILED, `Parsing failed: ${msg}`);
    e.sourceText = src;
    return e;
  };
  ProcfsError.generic = (err) => {
    if (err instanceof ProcfsError) {
      return err;
    }
    switch (err.code) {
      case "ENOENT":
        return new ProcfsError(ProcfsError.ERR_NOT_FOUND, "File not found", err);
      /* istanbul ignore next should not ever happen*/
      default:
        return new ProcfsError(ProcfsError.ERR_UNKNOWN, `Unknown error: ${err.message}`, err);
    }
  };
  procfsError = ProcfsError;
  return procfsError;
}
function commonjsRequire(path2) {
  throw new Error('Could not dynamically require "' + path2 + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
}
var parsers_1;
var hasRequiredParsers;
function requireParsers() {
  if (hasRequiredParsers) return parsers_1;
  hasRequiredParsers = 1;
  const trim = (str) => str.trim();
  class Parsers {
  }
  const parsers = new Parsers();
  for (let name of [
    "cgroups",
    "config",
    "cpuinfo",
    "devices",
    "diskstats",
    "filesystems",
    "loadavg",
    "meminfo",
    "partitions",
    "processAutogroup",
    "processCgroups",
    "processCmdline",
    "processEnviron",
    "processes",
    "processExe",
    "processFd",
    "processFdinfo",
    "processFds",
    "processGidMap",
    "processIo",
    "processLimits",
    "processMountinfo",
    "processNetDev",
    "processNetTcp4",
    "processNetTcp6",
    "processNetUdp4",
    "processNetUdp6",
    "processNetUnix",
    "processNetWireless",
    "processStat",
    "processStatm",
    "processStatus",
    "processThreads",
    "processUidMap",
    "stat",
    "swaps",
    "uptime"
  ]) {
    Object.defineProperty(Parsers.prototype, name, {
      get: function() {
        let value = commonjsRequire(`./parsers/${name}`);
        Object.defineProperty(this, name, { value });
        return value;
      }
    });
  }
  parsers.cmdline = trim;
  parsers.processComm = trim;
  parsers.processCpuset = trim;
  parsers.processOomScore = (src) => parseInt(src);
  parsers.processTimerslackNs = (src) => parseInt(src);
  parsers.version = trim;
  parsers.processCwd = (src) => src;
  parsers.processPersonality = (src) => parseInt(src, 16);
  parsers_1 = parsers;
  return parsers_1;
}
var utils;
var hasRequiredUtils;
function requireUtils() {
  if (hasRequiredUtils) return utils;
  hasRequiredUtils = 1;
  const {
    readlinkSync,
    readdirSync,
    openSync,
    readSync,
    closeSync,
    readFileSync,
    existsSync
  } = require$$0;
  const tmpBufMinLen = 4096 * 2;
  const tmpBufMaxLen = 4096 * 8;
  let tmpBuf = Buffer.allocUnsafeSlow(tmpBufMinLen);
  const read = (path2) => {
    const fd = openSync(path2, "r", 438);
    let pos = 0;
    let bytesRead;
    let buf = tmpBuf;
    let length = buf.length;
    do {
      bytesRead = readSync(fd, buf, pos, buf.length - pos, null);
      pos += bytesRead;
      if (pos === tmpBuf.length) {
        length = length << 1;
        let newBuf = Buffer.allocUnsafeSlow(length);
        if (length <= tmpBufMaxLen) {
          tmpBuf = newBuf;
        }
        buf.copy(newBuf);
        buf = newBuf;
      }
    } while (bytesRead !== 0);
    closeSync(fd);
    return buf.toString("utf8", 0, pos);
  };
  const readIdList = (path2) => {
    let ls = readdirSync(path2);
    for (let i = 0; i < ls.length; i++) {
      ls[i] = parseInt(ls[i]);
    }
    return ls;
  };
  const readBuffer = readFileSync;
  const exists = existsSync;
  const readdir = readdirSync;
  const devIdGetMinor = (devId) => devId >> 20 << 8 | devId & 255;
  const devIdGetMajor = (devId) => devId >> 8 & 255;
  const devIdFromMajorMinor = (major, minor) => minor >> 8 << 20 | (major & 255) << 8 | minor & 255;
  utils = {
    read,
    readLink: readlinkSync,
    readIdList,
    readBuffer,
    exists,
    readdir,
    devIdGetMinor,
    devIdGetMajor,
    devIdFromMajorMinor
  };
  return utils;
}
var procfs_1;
var hasRequiredProcfs;
function requireProcfs() {
  if (hasRequiredProcfs) return procfs_1;
  hasRequiredProcfs = 1;
  const ProcfsError = requireProcfsError();
  const parsers = requireParsers();
  const {
    read,
    readLink,
    readBuffer,
    readdir,
    devIdGetMinor,
    devIdGetMajor,
    devIdFromMajorMinor
  } = requireUtils();
  class Procfs {
    constructor(root) {
      if (root === void 0) {
        root = "/proc";
      }
      this.root = root;
      this.rootSlash = `${root}/`;
    }
    processes() {
      try {
        return parsers.processes(readdir(this.root));
      } catch (error2) {
        throw ProcfsError.generic(error2);
      }
    }
    processFds(pid) {
      if (pid !== void 0 && (!Number.isInteger(pid) || pid <= 0)) {
        throw new TypeError("pid");
      }
      try {
        return parsers.processFds(readdir(`${this.rootSlash}${pid === void 0 ? "self" : pid}/fd`));
      } catch (error2) {
        throw ProcfsError.generic(error2);
      }
    }
    processThreads(pid) {
      if (pid !== void 0 && (!Number.isInteger(pid) || pid <= 0)) {
        throw new TypeError("pid");
      }
      try {
        return parsers.processThreads(readdir(`${this.rootSlash}${pid === void 0 ? "self" : pid}/task`));
      } catch (error2) {
        throw ProcfsError.generic(error2);
      }
    }
    processFdinfo(fd, pid) {
      if (pid !== void 0 && !(Number.isInteger(pid) && pid >= 0)) {
        throw new TypeError("pid");
      }
      if (!Number.isInteger(fd) || fd <= 0) {
        throw new TypeError("fd");
      }
      try {
        return parsers.processFdinfo(read(`${this.rootSlash}${pid === void 0 ? "self" : pid}/fdinfo/${fd}`));
      } catch (error2) {
        throw ProcfsError.generic(error2);
      }
    }
    processFd(fd, pid) {
      if (pid !== void 0 && !(Number.isInteger(pid) && pid >= 0)) {
        throw new TypeError("pid");
      }
      if (!Number.isInteger(fd) || fd <= 0) {
        throw new TypeError("fd");
      }
      try {
        return parsers.processFd(readLink(`${this.rootSlash}${pid === void 0 ? "self" : pid}/fd/${fd}`));
      } catch (error2) {
        throw ProcfsError.generic(error2);
      }
    }
    config() {
      try {
        return parsers.config(readBuffer(`${this.rootSlash}config.gz`));
      } catch (error2) {
        throw ProcfsError.generic(error2);
      }
    }
  }
  Procfs.prototype.devIdGetMinor = devIdGetMinor;
  Procfs.prototype.devIdGetMajor = devIdGetMajor;
  Procfs.prototype.devIdFromMajorMinor = devIdFromMajorMinor;
  for (let [name, path2] of [
    ["processExe", "/exe"],
    ["processCwd", "/cwd"]
  ]) {
    Procfs.prototype[name] = function(pid) {
      if (pid !== void 0 && !(Number.isInteger(pid) && pid >= 0)) {
        throw new TypeError("pid");
      }
      try {
        return parsers[name](readLink(`${this.rootSlash}${pid === void 0 ? "self" : pid}${path2}`));
      } catch (error2) {
        throw ProcfsError.generic(error2);
      }
    };
  }
  for (let [name, path2] of [
    ["processMountinfo", "/mountinfo"],
    ["processIo", "/io"],
    ["processUidMap", "/uid_map"],
    ["processGidMap", "/gid_map"],
    ["processEnviron", "/environ"],
    ["processOomScore", "/oom_score"],
    ["processTimerslackNs", "/timerslack_ns"],
    ["processCmdline", "/cmdline"],
    ["processAutogroup", "/autogroup"],
    ["processStatm", "/statm"],
    ["processComm", "/comm"],
    ["processPersonality", "/personality"],
    ["processCgroups", "/cgroup"],
    ["processCpuset", "/cpuset"],
    ["processLimits", "/limits"],
    ["processStat", "/stat"],
    ["processStatus", "/status"],
    ["processNetDev", "/net/dev"],
    ["processNetWireless", "/net/wireless"],
    ["processNetUnix", "/net/unix"],
    ["processNetTcp4", "/net/tcp"],
    ["processNetTcp6", "/net/tcp6"],
    ["processNetUdp4", "/net/udp"],
    ["processNetUdp6", "/net/udp6"]
  ]) {
    Procfs.prototype[name] = function(pid) {
      if (pid !== void 0 && !(Number.isInteger(pid) && pid >= 0)) {
        throw new TypeError("pid");
      }
      try {
        return parsers[name](read(`${this.rootSlash}${pid === void 0 ? "self" : pid}${path2}`));
      } catch (error2) {
        throw ProcfsError.generic(error2);
      }
    };
  }
  for (let name of [
    "cpuinfo",
    "loadavg",
    "uptime",
    "version",
    "cmdline",
    "swaps",
    "stat",
    "devices",
    "filesystems",
    "diskstats",
    "partitions",
    "meminfo",
    "cgroups"
  ]) {
    Procfs.prototype[name] = function() {
      try {
        return parsers[name](read(this.rootSlash + name));
      } catch (error2) {
        throw ProcfsError.generic(error2);
      }
    };
  }
  for (let [name, parser, path2] of [
    ["netDev", "processNetDev", "net/dev"],
    ["netWireless", "processNetWireless", "net/wireless"],
    ["netUnix", "processNetUnix", "net/unix"],
    ["netTcp4", "processNetTcp4", "net/tcp"],
    ["netTcp6", "processNetTcp6", "net/tcp6"],
    ["netUdp4", "processNetUdp4", "net/udp"],
    ["netUdp6", "processNetUdp6", "net/udp6"]
  ]) {
    Procfs.prototype[name] = function() {
      try {
        return parsers[parser](read(this.rootSlash + path2));
      } catch (error2) {
        throw ProcfsError.generic(error2);
      }
    };
  }
  const procfs = new Procfs();
  procfs_1 = {
    procfs,
    Procfs,
    ProcfsError
  };
  return procfs_1;
}
var procfsExports = requireProcfs();
const concurrency = os.availableParallelism() * 8;
const formatDate = (date) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};
const trash = async (filePath, { filesPath, infoPath }) => {
  const name = randomUUID();
  const destination = path.join(filesPath, name);
  const trashInfoPath = path.join(infoPath, `${name}.trashinfo`);
  const trashInfo = [
    "[Trash Info]",
    `Path=${encodeURI(filePath)}`,
    `DeletionDate=${formatDate(/* @__PURE__ */ new Date())}`
  ].join("\n");
  await fs.promises.writeFile(trashInfoPath, trashInfo);
  await moveFile(filePath, destination);
  return {
    path: destination,
    info: trashInfoPath
  };
};
async function linux(paths) {
  const mountPointMap = /* @__PURE__ */ new Map();
  for (const mountInfo of Object.values(procfsExports.procfs.processMountinfo())) {
    if (/^\/(snap|var\/snap|run|sys|proc|dev)($|\/)/.test(mountInfo.mountPoint)) {
      continue;
    }
    if (!mountPointMap.has(mountInfo.devId)) {
      mountPointMap.set(mountInfo.devId, mountInfo.mountPoint);
    }
  }
  const trashPathsCache = /* @__PURE__ */ new Map();
  const getDeviceTrashPaths = async (deviceId) => {
    let trashPathsPromise = trashPathsCache.get(deviceId);
    if (!trashPathsPromise) {
      trashPathsPromise = (async () => {
        const trashPath = await xdgTrashdir(mountPointMap.get(deviceId));
        const paths2 = {
          filesPath: path.join(trashPath, "files"),
          infoPath: path.join(trashPath, "info")
        };
        await fs.promises.mkdir(paths2.filesPath, { mode: 448, recursive: true });
        await fs.promises.mkdir(paths2.infoPath, { mode: 448, recursive: true });
        return paths2;
      })();
      trashPathsCache.set(deviceId, trashPathsPromise);
    }
    return trashPathsPromise;
  };
  return pMap(paths, async (filePath) => {
    const stats = await fs.promises.lstat(filePath);
    const trashPaths = await getDeviceTrashPaths(stats.dev);
    return trash(filePath, trashPaths);
  }, { concurrency });
}
export {
  linux as default
};
