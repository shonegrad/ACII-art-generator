# Development Guide

This document defines non-negotiable development rules and best practices for the ASCII Art Generator project.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Development Setup](#development-setup)
- [Port/Process Hygiene](#portprocess-hygiene)
- [Versioning](#versioning)
- [Commit Conventions](#commit-conventions)
- [Pre-Commit Checklist](#pre-commit-checklist)
- [Code Style](#code-style)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18.3.1 |
| Build Tool | Vite 6.3.5 |
| Language | TypeScript |
| Styling | Tailwind CSS v4.1.3 |
| UI Components | shadcn/ui + Radix primitives |
| Testing | Vitest + React Testing Library |

---

## Development Setup

```bash
# Install dependencies
npm install

# Start development server (port 3000)
npm run dev

# Run tests
npm run test

# Type check
npm run typecheck

# Lint
npm run lint

# Build for production
npm run build
```

---

## Port/Process Hygiene

**Rule**: Before starting the dev server, check for existing processes on port 3000.

```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill existing process if needed
kill -9 $(lsof -ti :3000)
```

**Rule**: Reuse existing browser tabs instead of opening new ones.

---

## Versioning

**Single Source of Truth**: The `VERSION` file in the project root.

**Format**: [Semantic Versioning](https://semver.org/) - `MAJOR.MINOR.PATCH`

| Change Type | Version Bump | Example |
|-------------|--------------|---------|
| Breaking changes | MAJOR | 1.0.0 → 2.0.0 |
| New features (backward compatible) | MINOR | 1.0.0 → 1.1.0 |
| Bug fixes | PATCH | 1.0.0 → 1.0.1 |

**Update Process**:

1. Update `VERSION` file
2. Update `package.json` version
3. Update `CHANGELOG.md`
4. Commit with version tag

---

## Commit Conventions

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Types**:

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Code style (formatting, no logic change) |
| `refactor` | Code refactoring |
| `test` | Adding/updating tests |
| `chore` | Maintenance tasks |

**Examples**:

```
feat(image): add support for GIF input
fix(clipboard): handle iOS Safari copy restrictions
docs(readme): add deployment instructions
```

---

## Pre-Commit Checklist

Before every commit, ensure:

- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] `npm run build` succeeds
- [ ] No console.log statements (except in development)
- [ ] CHANGELOG.md updated (for features/fixes)

---

## Code Style

### TypeScript

- Use strict mode (enabled in tsconfig)
- Prefer `const` over `let`
- Use explicit return types for functions
- Use interfaces over type aliases where applicable

### React Components

- Use functional components with hooks
- Place hooks at the top of components
- Extract reusable logic into custom hooks
- Colocate component styles with components

### File Organization

```
src/
├── components/
│   ├── ui/          # shadcn/ui components
│   ├── utils/       # Utility functions
│   └── *.tsx        # Feature components
├── styles/          # Additional CSS
└── App.tsx          # Main app component
```

### Naming Conventions

| Entity | Convention | Example |
|--------|------------|---------|
| Components | PascalCase | `AsciiArtGenerator` |
| Hooks | camelCase with `use` prefix | `useMobile` |
| Utilities | camelCase | `copyToClipboard` |
| CSS classes | kebab-case / Tailwind | `text-primary` |
