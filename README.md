# bot_09

A GitHub activity bot that creates **real, current-date Git commits**. It appends small records to `activity.json` and commits them with the system's actual clock — no backdating, no `--date` manipulation, no history rewriting.

> **Important**: This bot creates commits timestamped to the moment it runs. It does not alter historical Git timestamps or rewrite any existing commits.

---

## Table of Contents

1. [What it does](#what-it-does)
2. [Project structure](#project-structure)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [CLI commands](#cli-commands)
6. [Local scheduling](#local-scheduling)
7. [GitHub Actions setup](#github-actions-setup)
8. [Authentication](#authentication)
9. [Safety considerations](#safety-considerations)
10. [Running tests](#running-tests)

---

## What it does

- Reads or creates `activity.json`
- Appends a new entry with the **real current ISO timestamp**
- Stages the file and commits it using `simple-git` (no `--date` flag)
- Optionally pushes to the configured remote
- Never modifies Git history

Example `activity.json` after three runs:

```json
{
  "activities": [
    {
      "timestamp": "2026-08-22T17:05:00.000Z",
      "type": "automated-development-activity"
    },
    {
      "timestamp": "2026-08-23T10:00:01.000Z",
      "type": "automated-development-activity"
    },
    {
      "timestamp": "2026-08-24T10:00:02.000Z",
      "type": "automated-development-activity"
    }
  ]
}
```

---

## Project structure

```
bot_09/
├── src/
│   ├── index.js            # Entry point
│   ├── cli.js              # CLI (commander)
│   ├── config.js           # Defaults + env overrides
│   ├── activityGenerator.js # Appends to activity.json
│   ├── gitService.js       # simple-git wrapper
│   └── validators.js       # Safety checks
├── tests/
│   ├── activityGenerator.test.js
│   ├── config.test.js
│   └── validators.test.js
├── .github/
│   └── workflows/
│       ├── ci.yml          # Runs tests on every push/PR
│       └── activity.yml    # Scheduled activity bot
├── activity.json           # Append-only activity log
├── .gitignore
├── .env.example            # Environment variable template
├── package.json
└── README.md
```

---

## Installation

```bash
# Clone the repository
git clone https://github.com/shambhaviakhouri/bot_09.git
cd bot_09

# Install dependencies
npm install
```

---

## Configuration

All configuration is done via environment variables. Copy `.env.example` to `.env` and edit:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `GITHUB_TOKEN` | _(none)_ | Token for authenticated pushes (local only) |
| `REPO_PATH` | project root | Absolute path to the repository |
| `COMMIT_COUNT` | `1` | Default commits per run |
| `PUSH` | `false` | Set to `true` to push by default |
| `ACTIVITY_FILE` | `activity.json` | Name of the activity log file |

CLI flags always take precedence over environment variables.

---

## CLI commands

```bash
# Show help
npm start -- help

# Show repository status
npm start -- status

# Create 1 commit (default)
npm start -- generate

# Create a specific number of commits
npm start -- generate --commits 1
npm start -- generate --commits 3
npm start -- generate --commits 5

# Create commits AND push to remote
npm start -- generate --commits 1 --push
npm start -- generate --commits 5 --push
```

Default behavior is **safe** — it never pushes unless `--push` is explicitly supplied.

---

## Local scheduling

### Windows Task Scheduler

1. Open **Task Scheduler** → **Create Basic Task**
2. Set a daily or weekday trigger
3. Set the action to:
   - **Program**: `node`
   - **Arguments**: `C:\path\to\bot_09\src\index.js generate --commits 1 --push`
   - **Start in**: `C:\path\to\bot_09`
4. Under **Conditions**, uncheck "Start only if computer is on AC power" if needed

Or use a `.bat` file:

```bat
@echo off
cd /d C:\path\to\bot_09
node src\index.js generate --commits 1 --push
```

Schedule the `.bat` file with Task Scheduler.

### Linux / macOS cron

```bash
crontab -e
```

Add (runs every weekday at 10:00 AM):

```cron
0 10 * * 1-5 cd /path/to/bot_09 && node src/index.js generate --commits 1 --push >> /tmp/bot_09.log 2>&1
```

Use reasonable intervals. Do not create excessive commits.

---

## GitHub Actions setup

The bot ships with two workflows:

### `.github/workflows/ci.yml`
Runs `npm test` on every push and pull request. No special secrets required.

### `.github/workflows/activity.yml`
Runs the bot on a schedule (weekdays at 10:00 UTC by default).

**Setup steps:**

1. Push this repository to GitHub
2. No additional secrets are needed — the workflow uses the built-in `GITHUB_TOKEN`
3. Go to **Settings → Actions → General** and ensure **"Allow GitHub Actions to create and approve pull requests"** and **"Read and write permissions"** are enabled under **Workflow permissions**
4. The workflow will run automatically on schedule, or you can trigger it manually from the **Actions** tab

**To change the schedule**, edit the `cron` expression in `.github/workflows/activity.yml`:

```yaml
schedule:
  - cron: "0 10 * * 1-5"   # weekdays at 10:00 UTC
```

---

## Authentication

### GitHub Actions
The workflow uses `${{ secrets.GITHUB_TOKEN }}` — the token GitHub injects automatically into every workflow run. You do not need to create or store any token.

### Local pushes
Set `GITHUB_TOKEN` in your `.env` file (never commit it):

```env
GITHUB_TOKEN=ghp_your_personal_access_token
```

The token needs **Contents: Write** scope for the target repository. The bot injects it into the remote URL at runtime and never stores it on disk.

---

## Safety considerations

- **No backdating**: The bot uses `new Date().toISOString()` — the real system clock
- **No `--date` flag**: `simple-git` commits are created without any timestamp override
- **No history rewriting**: `git rebase`, `git filter-branch`, and `git commit --amend` are never called
- **Push is opt-in**: Nothing is pushed unless `--push` is explicitly provided
- **Remote verification**: Before pushing, the bot checks that the remote is on `github.com`
- **No empty commits**: The bot always modifies `activity.json` before committing
- **No stored credentials**: Tokens are read from environment variables only

---

## Running tests

```bash
npm test
```

Tests cover:

- Activity appending and timestamp correctness
- No-backdating assertion (timestamps must be ≥ current time)
- Corrupt file recovery
- Commit message pool validation
- Config defaults and env var overrides
- Git repo detection and push validation

---

## Recommended GitHub repository settings

1. **Settings → Actions → General → Workflow permissions**: set to **Read and write permissions**
2. **Settings → Branches**: optionally protect `main` to prevent force-pushes
3. **Settings → Actions → General**: enable **"Allow GitHub Actions to create and approve pull requests"** if you want the bot to be able to open PRs in the future
4. Do **not** enable "Delete head branches" for branches the bot commits to