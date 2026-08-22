'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { isGitRepo, getBranch, getRemote, validatePush } = require('../src/validators');

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bot09-validators-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('isGitRepo', () => {
  test('returns false for a plain directory (no .git)', () => {
    expect(isGitRepo(tmpDir)).toBe(false);
  });

  test('returns true when a .git directory exists', () => {
    fs.mkdirSync(path.join(tmpDir, '.git'));
    expect(isGitRepo(tmpDir)).toBe(true);
  });

  test('returns false for a non-existent path', () => {
    expect(isGitRepo(path.join(tmpDir, 'does-not-exist'))).toBe(false);
  });
});

describe('getBranch', () => {
  test('returns null for a non-git directory', async () => {
    const branch = await getBranch(tmpDir);
    expect(branch).toBeNull();
  });
});

describe('getRemote', () => {
  test('returns null for a non-git directory', async () => {
    const remote = await getRemote(tmpDir);
    expect(remote).toBeNull();
  });
});

describe('validatePush', () => {
  test('fails when the directory is not a git repo', async () => {
    const result = await validatePush(tmpDir);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/Not a Git repository/);
  });

  test('fails when there is no remote configured', async () => {
    // Init a bare git repo with no remote
    fs.mkdirSync(path.join(tmpDir, '.git'));
    // getBranch/getRemote call real simple-git; with no remotes configured
    // validatePush will fail at the "no remote" check
    const result = await validatePush(tmpDir);
    expect(result.ok).toBe(false);
  });
});
