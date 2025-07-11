---
description: Description of the development cycle of this project
---

# Development Cycle

This document outlines the complete development workflow for working with the n8n MCP Server.

## 1. Feature Branch Creation

```bash
# Create a new feature branch from main
git checkout main
git pull
git checkout -b feature/my-new-feature
```

## 2. Development Process

1. **Start the development server** with hot-reloading:
   ```bash
   npm run dev
   ```

2. **Make code changes** using TypeScript with ES modules
   - Follow the TypeScript style guide
   - Use ES module imports with `.js` extensions
   - Maintain separation of concerns by following the layered architecture

3. **Format and lint your code**:
   ```bash
   npm run lint
   ```

4. **Run tests** to ensure functionality:
   ```bash
   # Run all tests
   npm test

   # Run specific test file
   npm test -- tests/unit/tools/workflow/list.test.ts

   # Run tests with coverage
   npm run test:coverage
   ```

5. **Build the project** to verify production readiness:
   ```bash
   npm run build
   ```

## 3. Documentation Updates

- Update API documentation for any modified or new tools/resources
- Add examples for new functionality
- Update developer documentation if architectural patterns change
- Ensure README.md remains current

## 4. Commit Changes

Follow the commit message convention:
```bash
git add .
git commit -m "feat: add pagination to workflow list tool"
```

Common prefixes:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Adding or updating tests
- `refactor:` - Code changes that neither fix bugs nor add features

## 5. Pull Request Process

1. **Push your branch**:
   ```bash
   git push -u origin feature/my-new-feature
   ```

2. **Create a pull request** with:
   - Clear description of changes
   - References to related issues
   - Summary of testing performed

3. **Address review feedback** with additional commits

4. **Merge to main** after approval and CI passing

## 6. Release Process

1. Ensure all tests pass on the main branch
2. Update version number according to semantic versioning
3. Create release notes documenting changes
4. Tag the release in git

## Development Best Practices

- Use TDD approach when possible
- Follow the DRY principle (Don't Repeat Yourself)
- Keep tools and resources focused on single responsibility
- Add appropriate error handling
- Document all public APIs and functions
- Review your own code before submitting PRs