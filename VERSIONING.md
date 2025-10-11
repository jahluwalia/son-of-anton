# Versioning Strategy

Son of Anton follows [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`

## Automated Version Bumping

When a PR is merged to `main`, the version is automatically bumped based on the PR title/body:

- **MAJOR** (x.0.0): Breaking changes
  - PR title/body contains: `breaking`, `major`
  - Example: "BREAKING: Remove deprecated flags"

- **MINOR** (0.x.0): New features
  - PR title/body contains: `feat`, `feature`, `minor`
  - Example: "feat: Add new battle animations"

- **PATCH** (0.0.x): Bug fixes and small changes
  - Default for all other PRs
  - Example: "fix: Correct personality prompt"

## Version Bump Flow

1. Create a feature branch
2. Make changes
3. Open PR with appropriate title (e.g., `feat: Add XYZ`)
4. Merge PR to `main`
5. GitHub Actions automatically:
   - Bumps version in `package.json`
   - Creates git tag
   - Commits and pushes to `main`

## Manual Version Bumping

If needed, you can manually bump versions:

```bash
# Patch (0.0.x)
npm version patch

# Minor (0.x.0)
npm version minor

# Major (x.0.0)
npm version major

# Specific version
npm version 1.2.3
```

## Current Version

The current version is always displayed in the Son of Anton banner:
```
Son of Anton v0.1.2
Claude Code v2.1.0 (model) [DECEASED ☠️]
```
