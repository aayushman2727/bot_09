'use strict';

/**
 * cli.js
 * Parses command-line arguments and orchestrates the bot workflow.
 *
 * Supported commands:
 *   generate [--commits <n>] [--push]
 *   status
 *   help
 */

const path = require('path');
const { Command } = require('commander');
const config = require('./config');
const { appendActivity, pickCommitMessage } = require('./activityGenerator');
const { addAndCommit, push: gitPush, getStatus } = require('./gitService');
const { isGitRepo, validatePush } = require('./validators');

const program = new Command();

program
  .name('bot_09')
  .description('GitHub activity bot — commits using the real current time. No backdating.')
  .version('2.0.0');

// ── generate ──────────────────────────────────────────────────────────────────
program
  .command('generate')
  .description('Append to activity.json and create real Git commits')
  .option(
    '-c, --commits <n>',
    'number of commits to create',
    String(config.commitCount)
  )
  .option('--push', 'push to remote after committing', false)
  .action(async (opts) => {
    const repoPath = config.repoPath;
    const commitCount = Math.max(1, parseInt(opts.commits, 10) || 1);
    const shouldPush = opts.push || config.push;

    // Safety: must be a git repo
    if (!isGitRepo(repoPath)) {
      console.error(`✗ Not a Git repository: ${repoPath}`);
      process.exit(1);
    }

    console.log(`\n🤖 bot_09 — generating ${commitCount} commit(s)\n`);

    for (let i = 1; i <= commitCount; i++) {
      // 1. Append a real-time entry to activity.json
      const { filePath, timestamp } = appendActivity(repoPath);
      const message = pickCommitMessage();

      console.log(`  [${i}/${commitCount}] ${timestamp}`);
      console.log(`        msg : ${message}`);
      console.log(`        file: ${path.relative(repoPath, filePath)}`);

      // 2. Stage + commit (no --date, no GIT_AUTHOR_DATE)
      try {
        await addAndCommit(filePath, message, repoPath);
        console.log(`        ✓ committed\n`);
      } catch (err) {
        console.error(`        ✗ commit failed: ${err.message}`);
        process.exit(1);
      }
    }

    // 3. Optionally push
    if (shouldPush) {
      const validation = await validatePush(repoPath);
      if (!validation.ok) {
        console.error(`\n✗ Push aborted — ${validation.reason}`);
        process.exit(1);
      }

      console.log('🚀 Pushing to remote…');
      try {
        await gitPush(repoPath);
        console.log('✓ Pushed successfully.\n');
      } catch (err) {
        console.error(`✗ Push failed: ${err.message}`);
        process.exit(1);
      }
    } else {
      console.log('ℹ  Not pushing (use --push to push to remote).\n');
    }
  });

// ── status ────────────────────────────────────────────────────────────────────
program
  .command('status')
  .description('Show current repository status')
  .action(async () => {
    const repoPath = config.repoPath;

    if (!isGitRepo(repoPath)) {
      console.error(`✗ Not a Git repository: ${repoPath}`);
      process.exit(1);
    }

    try {
      const status = await getStatus(repoPath);
      console.log('\n📊 Repository Status\n');
      console.log(`  Repo   : ${repoPath}`);
      console.log(`  Branch : ${status.branch}`);
      console.log(`  Remote : ${status.remote}`);
      console.log(`  Modified files  : ${status.modified.length}`);
      console.log(`  Staged files    : ${status.staged.length}`);
      console.log(`  Untracked files : ${status.untracked.length}`);
      if (status.recentCommits.length) {
        console.log('\n  Recent commits:');
        status.recentCommits.forEach((c) => console.log(`    ${c}`));
      }
      console.log();
    } catch (err) {
      console.error(`✗ Status failed: ${err.message}`);
      process.exit(1);
    }
  });

// ── help is provided automatically by commander ───────────────────────────────

module.exports = { program };
