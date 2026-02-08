# Ozone Studio - Developer Guide

> Complete guide for developers working on Ozone Studio.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Project Structure](#project-structure)
3. [Technology Stack](#technology-stack)
4. [Development Workflow](#development-workflow)
5. [Adding New Features](#adding-new-features)
6. [Testing](#testing)
7. [Error Handling](#error-handling)
8. [State Management](#state-management)
9. [Debugging](#debugging)
10. [Common Tasks](#common-tasks)

---

## Quick Start

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| **Node.js** | 20+ | [nodejs.org](https://nodejs.org) |
| **pnpm** | 8+ | `npm install -g pnpm` |
| **Rust** | 1.75+ | [rustup.rs](https://rustup.rs) |
| **Visual Studio Build Tools** | 2022 | [VS Build Tools](https://visualstudio.microsoft.com/downloads/) (select "Desktop development with C++") |

### Setup

```bash
# Clone the repository
git clone https://github.com/your-org/ozone-virtual-tours.git
cd ozone-virtual-tours

# Install dependencies
pnpm install
cd client && pnpm install
cd ..

# Start development
cargo tauri dev
```

The app will open automatically. Hot reload is enabled for both frontend and backend.

### First Run

On first launch, the app:
1. Creates `Documents/Ozone Studio/` directory
2. Initializes SQLite database (`database.sqlite`)
3. Creates project and material directories

---

## Project Structure

```
ozone-virtual-tours/
├── client/                     # React frontend
│   ├── src/
│   │   ├── pages/              # Route components
│   │   ├── features/           # Feature modules
│   │   ├── stores/             # Zustand stores
│   │   ├── services/           # API wrappers
│   │   │   └── tauri/          # Tauri command wrappers
│   │   ├── engine/             # 3D rendering
│   │   ├── types/              # TypeScript types
│   │   └── test/               # Test setup
│   ├── vitest.config.ts        # Test configuration
│   └── package.json
│
├── src-tauri/                  # Rust backend
│   ├── src/
│   │   ├── commands/           # Tauri command handlers
│   │   ├── db/                 # Database layer
│   │   ├── models/             # Data structures
│   │   ├── utils/              # Utilities
│   │   └── license/            # License system
│   ├── Cargo.toml
│   └── tauri.conf.json
│
├── docs/                       # Documentation
│   ├── phases/                 # Implementation phases
│   ├── ARCHITECTURE.md         # System design
│   ├── DEVELOPER_GUIDE.md      # This file
│   ├── API.md                  # Tauri commands API
│   └── CONTRIBUTING.md         # Contribution guide
│
└── scripts/                    # Build scripts
```

### Key Directories

| Directory | Purpose |
|-----------|---------|
| `client/src/pages/` | Route-level components (ProjectList, SceneEditor, etc.) |
| `client/src/features/` | Feature modules with components, hooks |
| `client/src/stores/` | Zustand state stores |
| `client/src/services/tauri/` | TypeScript wrappers for Tauri commands |
| `src-tauri/src/commands/` | Rust command handlers |
| `src-tauri/src/db/` | SQLite queries and migrations |

---

## Technology Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| TypeScript 5 | Type safety |
| Vite 5 | Build tool with HMR |
| Three.js + R3F | 3D rendering |
| Zustand | State management |
| TailwindCSS | Styling |
| React Router | Routing |
| Vitest | Testing |

### Backend

| Technology | Purpose |
|------------|---------|
| Tauri 2.0 | Desktop framework |
| Rust | Systems programming |
| SQLite (rusqlite) | Local database |
| serde | Serialization |
| tokio | Async runtime |

---

## Development Workflow

### Commands

```bash
# Development (both frontend and Tauri)
cargo tauri dev

# Frontend only
cd client && pnpm dev

# Type checking
cd client && pnpm typecheck

# Linting
cd client && pnpm lint

# Testing
cd client && pnpm test

# Production build
cargo tauri build
```

### Hot Reload

- **Frontend changes**: Instant HMR via Vite
- **Rust changes**: Automatic rebuild (may take 10-30 seconds)

### Database Location

Development database: `C:\Users\{username}\Documents\Ozone Studio\database.sqlite`

You can delete this folder to reset all data.

---

## Adding New Features

### End-to-End Flow

```
User Action → React Component → Zustand Store → invoke()
→ Rust Command → SQLite Query → Response → Store Update → UI
```

### Step-by-Step: Adding a New Command

#### 1. Define the Rust Command

```rust
// src-tauri/src/commands/example.rs
use crate::utils::errors::AppError;

#[tauri::command]
pub fn my_command(input: String) -> Result<String, String> {
    if input.is_empty() {
        return Err(String::from(AppError::ValidationError(
            "Input cannot be empty".to_string()
        )));
    }
    Ok(format!("Hello, {}!", input))
}
```

#### 2. Register in lib.rs

```rust
// src-tauri/src/lib.rs
.invoke_handler(tauri::generate_handler![
    // ... existing commands
    commands::example::my_command,
])
```

#### 3. Add TypeScript Wrapper

```typescript
// client/src/services/tauri/index.ts

/**
 * Example command description
 * @param input - The input string
 * @throws {TauriError} VALIDATION_ERROR if input is empty
 */
export const myCommand = (input: string) =>
  invoke<string>('my_command', { input });
```

#### 4. Use in Component

```tsx
import { myCommand } from '@/services/tauri';
import { parseTauriError } from '@/types/errors';

const handleClick = async () => {
  try {
    const result = await myCommand('World');
    console.log(result); // "Hello, World!"
  } catch (err) {
    const error = parseTauriError(err);
    console.error(error.code, error.message);
  }
};
```

---

## Testing

### Test Structure

```
client/src/
├── types/errors.test.ts              # Unit tests
├── stores/licenseStore.test.ts       # Store tests
└── features/settings/UpdateChecker.test.tsx  # Component tests
```

### Running Tests

```bash
cd client

# Run all tests once
pnpm test

# Watch mode
pnpm test:watch

# With coverage
pnpm test:coverage
```

### Mocking Tauri

Tests automatically mock Tauri APIs. See `client/src/test/setup.ts` for the setup.

```typescript
import { vi } from 'vitest';

// Mock invoke for a specific test
vi.mocked(invoke).mockResolvedValue({ id: '1', name: 'Test' });
```

---

## Error Handling

### Rust Errors

Commands return structured errors as JSON strings:

```rust
use crate::utils::errors::AppError;

// Return a validation error
Err(String::from(AppError::ValidationError("Name required".to_string())))

// Return a not found error
Err(String::from(AppError::NotFound("Project not found".to_string())))
```

### TypeScript Error Handling

```typescript
import { parseTauriError, isErrorCode } from '@/types/errors';

try {
  await createProject({ name: '' });
} catch (err) {
  const error = parseTauriError(err);

  if (isErrorCode(error, 'VALIDATION_ERROR')) {
    // Show validation message to user
  } else if (isErrorCode(error, 'DATABASE_ERROR')) {
    // Show generic error, log details
  }
}
```

### Error Codes

| Code | When Used |
|------|-----------|
| `VALIDATION_ERROR` | Invalid user input |
| `NOT_FOUND` | Resource doesn't exist |
| `DATABASE_ERROR` | SQLite operation failed |
| `IO_ERROR` | File system error |
| `LICENSE_ERROR` | License validation failed |
| `FEATURE_NOT_AVAILABLE` | Feature gated by license |

---

## State Management

### Zustand Stores

```typescript
// Using a store
import { useLicenseStore } from '@/stores/licenseStore';

function MyComponent() {
  const { license, setLicense } = useLicenseStore();
  // or select specific state
  const tier = useLicenseStore(state => state.getTier());
}
```

### Store Patterns

```typescript
// Defining a store
export const useMyStore = create<MyState>()(
  devtools(
    (set, get) => ({
      data: null,

      // Simple setter
      setData: (data) => set({ data }),

      // Computed value
      getComputed: () => {
        const { data } = get();
        return data?.processed;
      },
    }),
    { name: 'my-store' }
  )
);
```

---

## Debugging

### Frontend

- React DevTools: Component tree and state
- Zustand DevTools: Store state history
- Browser console: `console.log` statements

### Backend (Rust)

- `println!()` statements appear in terminal
- `cargo tauri dev` shows all Rust output

### Database

View the SQLite database directly:

```bash
# Using SQLite CLI
sqlite3 "C:\Users\{user}\Documents\Ozone Studio\database.sqlite"
.tables
SELECT * FROM projects;
```

---

## Common Tasks

### Adding a New Page

1. Create component in `client/src/pages/`
2. Add route in `client/src/App.tsx`
3. Export from `client/src/pages/index.ts`

### Adding a New Store

1. Create `client/src/stores/myStore.ts`
2. Follow the pattern in `licenseStore.ts`
3. Add tests in `myStore.test.ts`

### Database Migrations

Migrations auto-run on startup. To add a new migration:

1. Edit `src-tauri/src/db/migrations.rs`
2. Add SQL in the migrations array
3. Increment version check

### Building for Production

```bash
# Build Windows installers
cargo tauri build

# Outputs:
# src-tauri/target/release/bundle/msi/   - MSI installer
# src-tauri/target/release/bundle/nsis/  - NSIS installer
```

---

## Further Reading

- [Architecture Documentation](./ARCHITECTURE.md) - System design decisions
- [API Reference](./API.md) - All Tauri commands
- [Contributing Guide](./CONTRIBUTING.md) - How to contribute
- [Phase Documentation](./phases/) - Implementation details per phase
