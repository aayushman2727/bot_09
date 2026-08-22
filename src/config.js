'use strict';

/**
 * config.js
 * Central configuration for bot_09.
 * All values can be overridden via environment variables.
 * No historical dates. No --date manipulation.
 */

const path = require('path');

const REPO_PATH = process.env.REPO_PATH
  ? path.resolve(process.env.REPO_PATH)
  : path.resolve(__dirname, '..');

const config = {
  /** Absolute path to the repository root */
  repoPath: REPO_PATH,

  /** Path to the activity file (relative to repo root) */
  activityFile: process.env.ACTIVITY_FILE || 'activity.json',

  /** Default number of commits per run */
  commitCount: parseInt(process.env.COMMIT_COUNT, 10) || 1,

  /** Whether to push after committing (must be explicitly enabled) */
  push: process.env.PUSH === 'true' || false,

  /** Optional GitHub token for authenticated pushes */
  githubToken: process.env.GITHUB_TOKEN || null,

  /** Commit message prefix pool — small, meaningful set */
  commitMessages: [
    'chore: update development activity',
    'chore: record automation run',
    'chore: update project activity',
    'test: record automation execution',
    'chore: log activity entry',
  ],

  /** Activity entry type label written to activity.json */
  activityType: 'automated-development-activity',
};

module.exports = config;
