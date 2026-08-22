'use strict';

/**
 * validators.js
 * Safety checks before committing or pushing.
 */

const fs = require('fs');
const path = require('path');
const simpleGit = require('simple-git');

/**
 * Returns true if the given directory contains a .git folder.
 * @param {string} repoPath
 * @returns {boolean}
 */
function isGitRepo(repoPath) {
  return fs.existsSync(path.join(repoPath, '.git'));
}

/**
 * Returns the current branch name, or null on error.
 * @param {string} repoPath
 * @returns {Promise<string|null>}
 */
async function getBranch(repoPath) {
  try {
    const git = simpleGit(repoPath);
    const result = await git.revparse(['--abbrev-ref', 'HEAD']);
    return result.trim();
  } catch {
    return null;
  }
}

/**
 * Returns the URL of the 'origin' remote, or null if not set.
 * @param {string} repoPath
 * @returns {Promise<string|null>}
 */
async function getRemote(repoPath) {
  try {
    const git = simpleGit(repoPath);
    const remotes = await git.getRemotes(true);
    const origin = remotes.find((r) => r.name === 'origin');
    return origin ? origin.refs.push || origin.refs.fetch : null;
  } catch {
    return null;
  }
}

/**
 * Validates that a push is safe:
 *  - must be a git repo
 *  - must have a known remote
 *  - remote must be on github.com
 *
 * @param {string} repoPath
 * @returns {Promise<{ ok: boolean, reason?: string }>}
 */
async function validatePush(repoPath) {
  if (!isGitRepo(repoPath)) {
    return { ok: false, reason: 'Not a Git repository: ' + repoPath };
  }

  const remote = await getRemote(repoPath);
  if (!remote) {
    return { ok: false, reason: 'No remote named "origin" is configured.' };
  }

  if (!remote.includes('github.com')) {
    return {
      ok: false,
      reason: `Remote does not appear to be a GitHub repository: ${remote}`,
    };
  }

  return { ok: true };
}

module.exports = { isGitRepo, getBranch, getRemote, validatePush };
