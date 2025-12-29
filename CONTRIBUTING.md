# Contributing to ASCII Art Generator

Thank you for your interest in contributing! This guide will help you get started.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:

   ```bash
   git clone https://github.com/YOUR_USERNAME/ACII-art-generator.git
   cd ACII-art-generator
   ```

3. **Install dependencies**:

   ```bash
   npm install
   ```

4. **Create a branch** for your changes:

   ```bash
   git checkout -b feat/your-feature-name
   ```

---

## Branch Naming

Use the following prefixes:

| Prefix | Purpose |
|--------|---------|
| `feat/` | New features |
| `fix/` | Bug fixes |
| `docs/` | Documentation updates |
| `refactor/` | Code refactoring |
| `test/` | Test additions/updates |

**Examples**: `feat/gif-support`, `fix/ios-clipboard`, `docs/api-reference`

---

## Making Changes

1. Make your changes following the [Development Guide](./DEVELOPMENT.md)
2. Write/update tests for your changes
3. Run the pre-commit checklist:

   ```bash
   npm run typecheck
   npm run lint
   npm run test
   npm run build
   ```

4. Commit using [Conventional Commits](https://www.conventionalcommits.org/)

---

## Pull Request Process

1. **Update documentation** if your changes affect usage
2. **Update CHANGELOG.md** under "Unreleased"
3. **Push your branch** to your fork
4. **Open a Pull Request** against `main`
5. **Fill out the PR template** completely
6. **Request a review**

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] Tests pass locally
- [ ] Documentation updated if needed
- [ ] CHANGELOG.md updated
- [ ] No merge conflicts
- [ ] Descriptive commit messages

---

## Code Review

All PRs require at least one approval before merging. Reviewers will check:

- Code quality and readability
- Test coverage
- Documentation accuracy
- Adherence to project conventions

---

## Reporting Issues

When opening an issue, please include:

1. **Description** of the problem or feature request
2. **Steps to reproduce** (for bugs)
3. **Expected vs actual behavior** (for bugs)
4. **Screenshots** if applicable
5. **Environment** (browser, OS)

---

## Questions?

Open a [Discussion](https://github.com/shonegrad/ACII-art-generator/discussions) for general questions.
