'use strict';

describe('config', () => {
  beforeEach(() => {
    jest.resetModules();
    // Clear relevant env vars before each test
    delete process.env.COMMIT_COUNT;
    delete process.env.PUSH;
    delete process.env.GITHUB_TOKEN;
    delete process.env.REPO_PATH;
    delete process.env.ACTIVITY_FILE;
  });

  afterEach(() => {
    jest.resetModules();
  });

  test('default commitCount is 1', () => {
    const config = require('../src/config');
    expect(config.commitCount).toBe(1);
  });

  test('default push is false', () => {
    const config = require('../src/config');
    expect(config.push).toBe(false);
  });

  test('default activityFile is activity.json', () => {
    const config = require('../src/config');
    expect(config.activityFile).toBe('activity.json');
  });

  test('default githubToken is null', () => {
    const config = require('../src/config');
    expect(config.githubToken).toBeNull();
  });

  test('commitMessages is a non-empty array of strings', () => {
    const config = require('../src/config');
    expect(Array.isArray(config.commitMessages)).toBe(true);
    expect(config.commitMessages.length).toBeGreaterThan(0);
    config.commitMessages.forEach((m) => expect(typeof m).toBe('string'));
  });

  test('activityType is automated-development-activity', () => {
    const config = require('../src/config');
    expect(config.activityType).toBe('automated-development-activity');
  });

  test('COMMIT_COUNT env var overrides default', () => {
    process.env.COMMIT_COUNT = '5';
    const config = require('../src/config');
    expect(config.commitCount).toBe(5);
  });

  test('PUSH=true env var enables push', () => {
    process.env.PUSH = 'true';
    const config = require('../src/config');
    expect(config.push).toBe(true);
  });

  test('GITHUB_TOKEN env var is read', () => {
    process.env.GITHUB_TOKEN = 'ghp_testtoken';
    const config = require('../src/config');
    expect(config.githubToken).toBe('ghp_testtoken');
  });

  test('ACTIVITY_FILE env var overrides default', () => {
    process.env.ACTIVITY_FILE = 'custom.json';
    const config = require('../src/config');
    expect(config.activityFile).toBe('custom.json');
  });

  test('commit messages do not mention --date or subtract', () => {
    const config = require('../src/config');
    config.commitMessages.forEach((msg) => {
      expect(msg).not.toMatch(/--date/);
      expect(msg).not.toMatch(/subtract/);
    });
  });
});
