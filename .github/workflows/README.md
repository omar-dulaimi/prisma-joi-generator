# CI/CD Workflows

This repository uses GitHub Actions for automated testing, building, and releasing. Here's an overview of the workflows:

## Core Workflows

### 1. CI (`ci.yml`)
**Trigger**: Push/PR to master branch

**Jobs**:
- **verify**: Node.js 22.x and 24.x
  - `npm run test:type-check`
  - `npx eslint src/ tests/ scripts/`, read-only. Not `npm run lint`, which passes `--fix` and
    can rewrite the sources it is supposed to be judging
  - `npx vitest run`, every test file rather than a curated subset
  - `npm run gen-example`
  - `npm run check:emitted`, which runs the schemas the generator emits under Node's own
    loader. The vitest suite loads them through Vite, which resolves a circular import to
    `undefined` instead of failing, so it cannot see an output Node refuses to import
- **packaged-artifact**: Node.js 22.x and 24.x, Prisma 6 and Prisma 7
  - Builds `package/` with the same script the release job uses, and asserts it is not empty.
    `package.sh` used to run a bare `tsc` with no `set -e`, so a missing tsc produced an empty
    package and exited 0
  - Asserts the published dependencies carry no second Prisma. `@prisma/internals` bundles its
    own schema parser, which is what made every Prisma 7 project fail with
    `P1012: Argument "url" is missing in data source block`
  - Packs the tarball, installs it into an empty `"type": "module"` project with a schema
    written for that Prisma major, runs `npx prisma generate`, then runs the emitted schemas

  No step here is `continue-on-error`. Every one of them was, which is how a package that
  could not be imported and could not run on Prisma 7 stayed green.

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
- Require status checks: the four "Typecheck, lint, test" and "Packaged artifact" matrix jobs
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
# Run every test file, which is what CI does
npx vitest run

# Run the schemas the generator emits, under Node's own loader
npm run gen-example
npm run check:emitted

# Build the directory that gets published
npm run package

# Test release process (dry run)
npm run release:dry

# Type check
npm run test:type-check

# Lint code, read-only, the way CI does
npx eslint src/ tests/ scripts/
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