'use strict';

/**
 * gitService.js
 * Thin wrapper around simple-git.
 *
 * IMPORTANT: addAndCommit() does NOT pass --date or any timestamp
 * override to git. Every commit is timestamped by the system clock.
 */

const simpleGit = require('simple-git');
const config = require('./config');

/**
 * Stages a file and creates a commit with the current system time.
 * No --date flag is used.
 *
 * @param {string} filePath - absolute path to the file to stage
 * @param {string} message  - commit message
 * @param {string} repoPath - absolute path to the repository
 * @returns {Promise<void>}
 */
async function addAndCommit(filePath, message, repoPath) {
  const git = simpleGit(repoPath);
  await git.add(filePath);

  // git commit — no --date, no GIT_AUTHOR_DATE manipulation
  await git.commit(message);
}

/**
 * Pushes the current branch to origin.
 * If a GITHUB_TOKEN is set, injects it into the remote URL.
 *
 * @param {string} repoPath
 * @returns {Promise<void>}
 */
async function push(repoPath) {
  const git = simpleGit(repoPath);

  if (config.githubToken) {
    // Build an authenticated remote URL so credentials are never stored in config
    const remotes = await git.getRemotes(true);
    const origin = remotes.find((r) => r.name === 'origin');
    if (origin) {
      const rawUrl = origin.refs.push;
      // Insert token into https URL: https://TOKEN@github.com/...
      const authUrl = rawUrl.replace(
        'https://',
        `https://${config.githubToken}@`
      );
      await git.push(authUrl, 'HEAD');
      return;
    }
  }

  await git.push('origin', 'HEAD');
}

/**
 * Returns a human-readable status summary of the repository.
 *
 * @param {string} repoPath
 * @returns {Promise<object>}
 */
async function getStatus(repoPath) {
  const git = simpleGit(repoPath);
  const [statusResult, branchResult, remotes, log] = await Promise.all([
    git.status(),
    git.revparse(['--abbrev-ref', 'HEAD']).catch(() => 'unknown'),
    git.getRemotes(true).catch(() => []),
    git.log(['--oneline', '-5']).catch(() => ({ all: [] })),
  ]);

  const origin = remotes.find((r) => r.name === 'origin');

  return {
    branch: branchResult.trim(),
    remote: origin ? origin.refs.push : '(none)',
    modified: statusResult.modified,
    staged: statusResult.staged,
    untracked: statusResult.not_added,
    recentCommits: log.all.map((c) => `${c.hash.slice(0, 7)} ${c.message}`),
  };
}

module.exports = { addAndCommit, push, getStatus };
