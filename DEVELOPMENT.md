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

> **⚠️ MANDATORY**: Always check ports and reuse browser tabs before starting development.

### Check for Running Processes

**Before starting the dev server**, always check if port 3000 is already in use:

```bash
# Check if port 3000 is in use
lsof -i :3000

# If processes are found, kill them
kill -9 $(lsof -ti :3000)

# Verify port is now free
lsof -i :3000 || echo "Port 3000 is free"
```

### Prevent Duplicate Instances

**Rule**: Never run multiple dev server instances. Before starting:

1. Check terminal for existing running servers
2. Check Activity Monitor / `ps aux | grep node` for orphan processes
3. Kill existing processes before starting a new one

```bash
# One-liner to safely start (kills existing, then starts new)
kill -9 $(lsof -ti :3000) 2>/dev/null; npm run dev
```

### Browser Tab Hygiene

> **⚠️ MANDATORY**: Reuse existing browser tabs instead of opening new ones.

**Rules**:

- Check if `localhost:3000` is already open in a browser tab
- If open, refresh that tab instead of opening a new one
- Only open a new tab if no existing tab is available
- Close unused development tabs to reduce memory usage

**For AI Agents**:

- Before using `open_browser_url`, check if the page is already open
- Use page refresh instead of opening new URLs when possible
- Avoid spawning multiple browser windows for the same task

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
