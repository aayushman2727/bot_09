'use strict';

/**
 * activityGenerator.js
 * Appends a new activity record to activity.json using the REAL current time.
 * Never backdates. Never uses --date.
 */

const fs = require('fs');
const path = require('path');
const config = require('./config');

/**
 * Reads the current activity.json, appending a new entry with
 * the actual current ISO timestamp, then writes it back.
 *
 * @param {string} repoPath - absolute path to repository root
 * @returns {{ filePath: string, timestamp: string, entry: object }}
 */
function appendActivity(repoPath) {
  const filePath = path.join(repoPath, config.activityFile);

  // Load existing data or start fresh
  let data = { activities: [] };
  if (fs.existsSync(filePath)) {
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.activities)) {
        data = parsed;
      }
    } catch {
      // Corrupt file → start fresh
      data = { activities: [] };
    }
  }

  // Use the REAL current time — no subtraction, no --date
  const timestamp = new Date().toISOString();

  const entry = {
    timestamp,
    type: config.activityType,
  };

  data.activities.push(entry);

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');

  return { filePath, timestamp, entry };
}

/**
 * Picks a commit message from the configured pool.
 * Uses a simple round-robin based on the current second so the
 * distribution is predictable in tests but varied across runs.
 *
 * @returns {string}
 */
function pickCommitMessage() {
  const messages = config.commitMessages;
  const index = new Date().getSeconds() % messages.length;
  return messages[index];
}

module.exports = { appendActivity, pickCommitMessage };
