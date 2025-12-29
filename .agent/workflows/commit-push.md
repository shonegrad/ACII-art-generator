---
description: Safe commit and push workflow following Conventional Commits
---

# Commit and Push Workflow

## Pre-Commit Checks

// turbo

1. **Run type checking**

```bash
npm run typecheck
```

// turbo
2. **Run linting**

```bash
npm run lint
```

// turbo
3. **Run tests**

```bash
npm run test
```

// turbo
4. **Run build**

```bash
npm run build
```

## Commit Steps

1. **Stage changes**

```bash
git add .
```

1. **Commit with Conventional Commits format**

```bash
git commit -m "<type>(<scope>): <description>"
```

Types: feat, fix, docs, style, refactor, test, chore

1. **Push to remote**

```bash
git push origin <branch-name>
```

## Version Updates (for releases)

1. **Update VERSION file** if releasing
2. **Update CHANGELOG.md**
3. **Tag the release**

```bash
git tag v$(cat VERSION)
git push origin v$(cat VERSION)
```
