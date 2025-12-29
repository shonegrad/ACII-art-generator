---
description: Run the test suite
---

# Test Workflow

// turbo-all

## Run All Tests

1. **Run the full test suite**

```bash
npm run test
```

## Watch Mode (for development)

1. **Run tests in watch mode**

```bash
npm run test:watch
```

## With Coverage

1. **Run tests with coverage report**

```bash
npm run test -- --coverage
```

## Notes

- Tests are located in files ending with `.test.ts` or `.test.tsx`
- Test utilities like mocks are in `__mocks__` directories
- Coverage reports are generated in the `coverage/` directory
