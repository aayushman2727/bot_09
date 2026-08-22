'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

// We test the module in isolation using a temporary directory
let tmpDir;
let activityGenerator;

beforeEach(() => {
  // Create a fresh temp directory for each test so tests don't interfere
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bot09-test-'));

  // Override config to point at our temp dir
  jest.resetModules();
  jest.doMock('../src/config', () => ({
    repoPath: tmpDir,
    activityFile: 'activity.json',
    commitCount: 1,
    push: false,
    githubToken: null,
    commitMessages: [
      'chore: update development activity',
      'chore: record automation run',
      'chore: update project activity',
      'test: record automation execution',
      'chore: log activity entry',
    ],
    activityType: 'automated-development-activity',
  }));

  activityGenerator = require('../src/activityGenerator');
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  jest.resetModules();
});

describe('appendActivity', () => {
  test('creates activity.json when it does not exist', () => {
    const result = activityGenerator.appendActivity(tmpDir);
    expect(fs.existsSync(result.filePath)).toBe(true);
  });

  test('writes a valid ISO 8601 timestamp', () => {
    const result = activityGenerator.appendActivity(tmpDir);
    const date = new Date(result.timestamp);
    expect(date.toISOString()).toBe(result.timestamp);
  });

  test('timestamp is close to current time (within 5 seconds)', () => {
    const before = Date.now();
    const result = activityGenerator.appendActivity(tmpDir);
    const after = Date.now();
    const ts = new Date(result.timestamp).getTime();
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after + 5000);
  });

  test('does NOT backdate (timestamp is not in the past year)', () => {
    const result = activityGenerator.appendActivity(tmpDir);
    const ts = new Date(result.timestamp);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    // Timestamp must be AFTER a year ago — no backdating
    expect(ts.getTime()).toBeGreaterThan(oneYearAgo.getTime());
  });

  test('appends multiple entries without overwriting existing ones', () => {
    activityGenerator.appendActivity(tmpDir);
    activityGenerator.appendActivity(tmpDir);
    activityGenerator.appendActivity(tmpDir);

    const raw = fs.readFileSync(path.join(tmpDir, 'activity.json'), 'utf8');
    const data = JSON.parse(raw);
    expect(data.activities).toHaveLength(3);
  });

  test('each entry has timestamp and type fields', () => {
    activityGenerator.appendActivity(tmpDir);
    activityGenerator.appendActivity(tmpDir);

    const raw = fs.readFileSync(path.join(tmpDir, 'activity.json'), 'utf8');
    const data = JSON.parse(raw);

    data.activities.forEach((entry) => {
      expect(entry).toHaveProperty('timestamp');
      expect(entry).toHaveProperty('type', 'automated-development-activity');
    });
  });

  test('handles corrupt activity.json gracefully by starting fresh', () => {
    const filePath = path.join(tmpDir, 'activity.json');
    fs.writeFileSync(filePath, 'NOT VALID JSON', 'utf8');

    const result = activityGenerator.appendActivity(tmpDir);
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);
    expect(data.activities).toHaveLength(1);
    expect(result.timestamp).toBeDefined();
  });
});

describe('pickCommitMessage', () => {
  test('returns a non-empty string', () => {
    const msg = activityGenerator.pickCommitMessage();
    expect(typeof msg).toBe('string');
    expect(msg.length).toBeGreaterThan(0);
  });

  test('returns a message from the configured pool', () => {
    const pool = [
      'chore: update development activity',
      'chore: record automation run',
      'chore: update project activity',
      'test: record automation execution',
      'chore: log activity entry',
    ];
    const msg = activityGenerator.pickCommitMessage();
    expect(pool).toContain(msg);
  });

  test('does not contain --date or moment().subtract', () => {
    const msg = activityGenerator.pickCommitMessage();
    expect(msg).not.toMatch(/--date/);
    expect(msg).not.toMatch(/subtract/);
  });
});
