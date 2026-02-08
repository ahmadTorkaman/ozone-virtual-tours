# Contributing to Ozone Studio

Thank you for your interest in contributing to Ozone Studio! This document provides guidelines and information for contributors.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Setup](#development-setup)
3. [Code Style](#code-style)
4. [Commit Messages](#commit-messages)
5. [Pull Request Process](#pull-request-process)
6. [Testing Guidelines](#testing-guidelines)
7. [Documentation](#documentation)

---

## Getting Started

### Before You Start

1. **Check existing issues** - Your idea may already be discussed
2. **Open an issue first** - For significant changes, discuss before coding
3. **Read the docs** - Familiarize yourself with the [Developer Guide](./DEVELOPER_GUIDE.md)

### Types of Contributions

- **Bug fixes** - Always welcome
- **Features** - Please discuss in an issue first
- **Documentation** - Improvements to docs, comments, examples
- **Tests** - Additional test coverage

---

## Development Setup

### Prerequisites

- Node.js 20+
- pnpm 8+
- Rust 1.75+
- Visual Studio Build Tools 2022 (Windows)

### Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/ozone-virtual-tours.git
cd ozone-virtual-tours

# Add upstream remote
git remote add upstream https://github.com/original/ozone-virtual-tours.git

# Install dependencies
pnpm install
cd client && pnpm install
cd ..

# Start development
cargo tauri dev
```

### Branch Strategy

```
main          # Production-ready code
└── develop   # Integration branch
    └── feature/your-feature  # Your work
```

Create feature branches from `develop`:

```bash
git checkout develop
git pull upstream develop
git checkout -b feature/your-feature
```

---

## Code Style

### TypeScript/React

- **Formatting**: Prettier defaults (run `pnpm lint:fix`)
- **Naming**:
  - Components: `PascalCase` (`SceneViewer.tsx`)
  - Functions/variables: `camelCase`
  - Constants: `SCREAMING_SNAKE_CASE`
  - Types/Interfaces: `PascalCase`

- **Exports**:
  ```typescript
  // Prefer named exports
  export function MyComponent() {}

  // Avoid default exports except for pages
  ```

- **Props**:
  ```typescript
  interface MyComponentProps {
    /** Description of prop */
    value: string;
    /** Optional callback */
    onChange?: (value: string) => void;
  }
  ```

### Rust

- **Formatting**: `cargo fmt`
- **Linting**: `cargo clippy`
- **Naming**:
  - Functions: `snake_case`
  - Types: `PascalCase`
  - Constants: `SCREAMING_SNAKE_CASE`

- **Documentation**:
  ```rust
  /// Brief description of the function
  ///
  /// # Arguments
  /// * `param` - Description
  ///
  /// # Returns
  /// Description of return value
  #[tauri::command]
  pub fn my_command(param: String) -> Result<(), String> {
      // ...
  }
  ```

### File Organization

```typescript
// 1. External imports
import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

// 2. Internal imports (absolute)
import { useLicenseStore } from '@/stores/licenseStore';
import type { Project } from '@/services/tauri';

// 3. Relative imports
import { Button } from './Button';

// 4. Types
interface Props {}

// 5. Component
export function MyComponent(props: Props) {}
```

---

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no code change |
| `refactor` | Code change without feature/fix |
| `test` | Adding/updating tests |
| `chore` | Build, tooling, deps |

### Examples

```
feat(scenes): add drag-and-drop scene reordering

fix(materials): prevent duplicate texture uploads

docs(api): add missing panorama command docs

test(stores): add licenseStore test coverage
```

### Scope Examples

- `projects`, `scenes`, `materials`, `panoramas`
- `license`, `updater`, `settings`
- `ui`, `3d`, `vr`
- `build`, `ci`, `deps`

---

## Pull Request Process

### Before Submitting

1. **Test locally**: `pnpm test` and `cargo test`
2. **Check types**: `pnpm typecheck`
3. **Lint**: `pnpm lint` and `cargo clippy`
4. **Update docs**: If you changed APIs

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation

## Testing
How did you test these changes?

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No new warnings
```

### Review Process

1. **Automated checks** must pass (CI)
2. **Code review** by maintainer
3. **Approval** required before merge
4. **Squash and merge** to keep history clean

---

## Testing Guidelines

### What to Test

- **Unit tests**: Pure functions, utilities
- **Store tests**: Zustand stores, state logic
- **Component tests**: User interactions, rendering
- **Integration**: API calls (with mocks)

### Test File Naming

```
ComponentName.tsx       → ComponentName.test.tsx
utilityFunction.ts     → utilityFunction.test.ts
storeName.ts           → storeName.test.ts
```

### Test Structure

```typescript
describe('ComponentName', () => {
  describe('feature/behavior', () => {
    it('should do something specific', () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

### Running Tests

```bash
# All tests
cd client && pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```

### Mocking Tauri

```typescript
import { vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';

vi.mock('@tauri-apps/api/core');

beforeEach(() => {
  vi.mocked(invoke).mockResolvedValue(mockData);
});
```

---

## Documentation

### When to Update Docs

- New features or commands → Update `API.md`
- Changed behavior → Update relevant docs
- New patterns → Update `DEVELOPER_GUIDE.md`

### Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | Project overview for developers |
| `docs/DEVELOPER_GUIDE.md` | Onboarding and workflows |
| `docs/API.md` | Command reference |
| `docs/ARCHITECTURE.md` | System design |
| `docs/CONTRIBUTING.md` | This file |

### Code Comments

```typescript
// Good: Explains WHY
// Skip validation for internal calls where input is already validated
if (skipValidation) return data;

// Bad: Explains WHAT (obvious from code)
// Loop through items
for (const item of items) {}
```

---

## Questions?

- **Issues**: Open a GitHub issue
- **Discussions**: Use GitHub Discussions for questions

Thank you for contributing!
