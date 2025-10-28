# Git Hooks

This directory contains git hooks for automatic version management.

## Setup

Run once after cloning:
```bash
npm run setup-hooks
```

Or manually:
```bash
git config core.hooksPath .githooks
```

## Hooks

### pre-push (Windows/PowerShell)
Automatically increments the **patch version** before every push to GitHub.

Example:
- Current version: `1.1.0`
- After push: `1.1.1`

### Manual Version Control

Use these npm scripts when you need major/minor bumps:

```bash
# Increment minor version (1.1.0 → 1.2.0)
npm run version:minor

# Increment major version (1.1.0 → 2.0.0)  
npm run version:major

# Manual patch increment (usually not needed)
npm run version:patch
```

## How It Works

1. You commit your changes normally
2. When you push to GitHub, the hook checks if version was manually changed
3. If not changed, it automatically increments the patch number
4. The version bump is added to your commit via `git commit --amend`
5. Push continues with the updated version

## Skipping Auto-Increment

If you manually update the version before committing, the hook will detect this and skip auto-increment.
