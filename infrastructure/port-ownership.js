const path = require('node:path');

function normalizePath(value) {
  return path.normalize(value).replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * A listener is project-owned only when its command line contains the exact
 * workspace path followed by a path/argument boundary. A similarly named
 * directory (for example CMC-Network-copy) must never be treated as owned.
 */
function isProjectOwnedProcess(commandLine, workspaceRoot) {
  if (!commandLine || !workspaceRoot) return false;

  const normalizedCommand = String(commandLine).replace(/\\/g, '/').toLowerCase();
  const normalizedRoot = normalizePath(workspaceRoot);
  const workspacePattern = new RegExp(
    `${escapeRegExp(normalizedRoot)}(?:/|["'\\s]|$)`,
  );

  return workspacePattern.test(normalizedCommand);
}

module.exports = { isProjectOwnedProcess };
