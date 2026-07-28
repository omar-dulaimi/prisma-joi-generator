# CI/CD Workflows

This repository uses GitHub Actions for automated testing, building, and releasing. Here's an overview of the workflows:

## Core Workflows

### 1. CI (`ci.yml`)
**Trigger**: Push/PR to master branch

**Jobs**:
- **test**: Runs on Node.js 18.x, 20.x, 22.x
  - Builds project with `npm run gen-example`
  - Type checking with `npm run test:type-check`
  - Linting with `npm run lint`
  - Basic tests with `npm run test:basic`
  - Comprehensive tests with coverage
  - MongoDB-specific tests
  - Multi-provider tests (sequential)
  - Uploads coverage to Codecov
- **package-test**: Tests package integrity
  - Builds and packages the project
  - Verifies package can be created successfully

### 2. Semantic Release (`semantic-release.yml`)
**Trigger**: Push to master branch

**Features**:
- Uses conventional commits for automated releases
- Generates changelogs automatically
- Creates GitHub releases with release notes
- Publishes to npm from the `package/` directory

## Configuration Files

### Semantic Release (`.releaserc.json`)
- Conventional commits configuration
- Automatic changelog generation
- Branch-based release strategy (master = stable releases)
- npm publishing from `package/` directory
- `repositoryUrl` is set explicitly. package.json uses npm's `git+https://` form, which
  @semantic-release/github parses into an empty `$owner`; its `fail` step then dies on a GraphQL error
  that masks whatever actually went wrong.

## Authentication

Publishing uses npm **Trusted Publishing** (OIDC). There is no npm token, and adding one would break it.

The npm account has "Require two-factor authentication and disallow tokens" enabled, so token-based
automation cannot publish at all. Instead, `@semantic-release/npm` requests a short-lived OIDC token from
GitHub and exchanges it with the registry. Four things make that work, and each is load-bearing:

- `id-token: write` on the release job, without which there is no token to exchange
- Node 24, because the exchange needs npm 11.5.1 or newer
- `@semantic-release/npm` 13 or newer, the first version with OIDC support
- no `registry-url` on `actions/setup-node` and no `NPM_TOKEN` in the release step, since either one writes
  an `.npmrc` that conflicts with the exchange

### Required secrets
- `GITHUB_TOKEN`: automatically provided by GitHub

That is the complete list. Nothing else needs configuring in the repository.

### One-time setup on npmjs.com
A Trusted Publisher must be registered for this package before the first release: package page, Settings,
Trusted Publisher, GitHub Actions, then this repository and the workflow filename, leaving the Environment
field **blank** (the release job declares no `environment:`, so filling it in makes the OIDC claim mismatch).

Until that exists, a release fails with `ENONPMTOKEN` at `verifyConditions`. That failure is safe: it
happens before anything is tagged or version-bumped, so registering the publisher and re-running the
workflow publishes cleanly with no cleanup.

### Branch protection
- Enable branch protection for `master`
- Require status checks: "test", "package-test"
- Require up-to-date branches

## Commit Message Format

Use conventional commits for automatic release management:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types**:
- `feat`: New features (minor version)
- `fix`: Bug fixes (patch version)
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring (patch version)
- `perf`: Performance improvements (patch version)
- `test`: Test changes
- `chore`: Maintenance tasks
- `ci`: CI/CD changes
- `build`: Build system changes

**Breaking Changes**:
Add `BREAKING CHANGE:` in footer or `!` after type for major version bumps.

**Examples**:
```
feat: add MongoDB native type support
fix: resolve schema generation for optional fields
docs: update installation instructions
feat!: change API for schema configuration
```

## Manual Release

To trigger a manual release:

1. Go to Actions → Release workflow
2. Click "Run workflow"
3. Select release type (patch/minor/major)
4. Click "Run workflow"

## Testing Locally

```bash
# Run basic tests
npm run test:basic

# Run with coverage
npm run test:coverage

# Run multi-provider tests
npm run test:multi:sequential

# Test release process (dry run)
npm run release:dry

# Type check
npm run test:type-check

# Lint code
npm run lint
```

## Monitoring

- **GitHub Actions**: View workflow runs in the Actions tab
- **NPM**: Monitor package downloads and versions
- **Codecov**: Track code coverage trends

## Troubleshooting

### Common Issues

1. **Tests failing on Windows**: 
   - Check file path separators
   - Verify line ending settings

2. **Release workflow fails**:
   - `ENONPMTOKEN` at verifyConditions means no Trusted Publisher is registered for this package on
     npmjs.com yet. Nothing was tagged or published, so register it and re-run.
   - `Have you granted the id-token: write permission` means the release job lost that permission.
   - Check conventional commit format, and that a releasable commit type is present.
   - Ensure all tests pass; the release job is gated on CI.

3. **Coverage upload fails**:
   - Verify CODECOV_TOKEN
   - Check coverage file generation

### Getting Help

- Review workflow logs in GitHub Actions
- Check the project's issue tracker
- Verify all required secrets are configured
- Test changes in a fork first