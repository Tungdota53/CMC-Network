const test = require('node:test');
const assert = require('node:assert/strict');
const { isProjectOwnedProcess } = require('./port-ownership');

const workspaceRoot = 'D:\\Projects\\CMC-Network';

test('recognizes a process launched from this workspace', () => {
  assert.equal(
    isProjectOwnedProcess(
      '"node" "D:\\Projects\\CMC-Network\\node_modules\\next\\dist\\bin\\next" dev',
      workspaceRoot,
    ),
    true,
  );
});

test('does not claim a process from another project', () => {
  assert.equal(
    isProjectOwnedProcess(
      '"node" "D:\\Projects\\Other-App\\node_modules\\next\\dist\\bin\\next" dev',
      workspaceRoot,
    ),
    false,
  );
});

test('does not match a workspace-name prefix collision', () => {
  assert.equal(
    isProjectOwnedProcess(
      '"node" "D:\\Projects\\CMC-Network-copy\\server.js"',
      workspaceRoot,
    ),
    false,
  );
});

test('treats a missing command line as foreign', () => {
  assert.equal(isProjectOwnedProcess(undefined, workspaceRoot), false);
});
