# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack application built with **React + Vite + Hono + Cloudflare Workers**. It uses a unique architecture where the React app runs on Cloudflare's edge platform with Hono providing the backend API layer.

- **Frontend**: React 19 with TypeScript, client-side routing (no React Router)
- **Backend**: Hono 4 micro-framework running on Cloudflare Workers
- **Database**: Cloudflare KV (key-value store) + Cloudflare D1 (SQLite)
- **Build**: Vite with Cloudflare plugin
- **Permission System**: RuoYi-style RBAC (User-Role-Menu)

## Development Commands

### Dual Server Mode (Recommended: Hot Reload)

```bash
npm run sync        # Sync remote KV + D1 data to local
npm run dev         # Frontend dev server with HMR (port 5173)
npm run wrangler    # Backend dev server (port 8787)
```

Frontend edits go to `http://localhost:5173`, API calls go to `http://localhost:8787/api/...`

### Single Server Mode

```bash
npm run dev:auto     # Sync data + start Wrangler (port 8787, no HMR)
npm run dev:remote   # Direct remote data development
```

### Build & Deploy

```bash
npm run build        # TypeScript compile + Vite build
npm run deploy       # Deploy to Cloudflare Workers
npm run check        # Type check + build + dry-run deploy
npm run lint         # ESLint code check
npm run preview      # Build and preview
npm run cf-typegen   # Generate Cloudflare type definitions
```

### All NPM Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite frontend dev server (port 5173, HMR enabled) |
| `npm run wrangler` | Wrangler backend dev server (port 8787) |
| `npm run dev:auto` | **Sync KV + D1 then start Wrangler** (commonly used) |
| `npm run dev:remote` | Wrangler with remote data connection |
| `npm run sync` | Sync remote KV + D1 data to local |
| `npm run kv:export` | Export local KV to remote (auto-backup) |
| `npm run kv:import` | Import remote KV to local |
| `npm run d1:migrate` | Apply schema.sql to remote D1 |
| `npm run d1:migrate:local` | Apply schema.sql to local D1 |
| `npm run d1:export` | Export local D1 to remote (auto-backup) |
| `npm run d1:import` | Import remote D1 to local |
| `npm run d1:backup:remote` | Backup remote D1 to `.wrangler/d1-backup/` |
| `npm run d1:backup:local` | Backup local D1 to `.wrangler/d1-backup/` |
| `npm run d1:query "SQL"` | Query remote D1 |
| `npm run d1:query:local "SQL"` | Query local D1 |
| `npm run build` | TypeScript compile + Vite bundle |
| `npm run deploy` | Deploy to Cloudflare Workers |
| `npm run check` | Full check (TS + bundle + dry-run deploy) |
| `npm run preview` | Build and preview |
| `npm run lint` | ESLint code check |
| `npm run cf-typegen` | Generate Cloudflare types |

## Database

### D1 (SQLite) - Permission System

**⚠️ IMPORTANT: Must run schema migration before first use (one-time setup)**
```bash
npm run d1:migrate       # Apply schema.sql to remote D1
npm run d1:migrate:local # Apply schema.sql to local D1
```

**D1 Data Sync (bidirectional with auto-backup):**
```bash
npm run d1:export        # Local -> Remote (exports local data, imports to remote)
npm run d1:import        # Remote -> Local (exports remote data, imports to local)
npm run d1:backup:remote # Backup remote data to .wrangler/d1-backup/
npm run d1:backup:local  # Backup local data to .wrangler/d1-backup/
```

**D1 Query:**
```bash
npm run d1:query "SELECT * FROM sys_user"      # Query remote D1
npm run d1:query:local "SELECT * FROM sys_user" # Query local D1
```

**Schema File:** `schema.sql` - Contains table definitions and initial data

**Tables:**
- `sys_user` - Users
- `sys_role` - Roles
- `sys_menu` - Menus (with routing info)
- `sys_user_role` - User-Role junction (logical foreign key, no physical constraint)
- `sys_role_menu` - Role-Menu junction (logical foreign key, no physical constraint)

**D1 Binding:** Access via `c.env.DB` in Hono routes (configured in `wrangler.json` as `DB`)

**Sync Script:** `scripts/sync-d1.cjs` - Handles bidirectional data sync with automatic backups

**Backup Location:** `.wrangler/d1-backup/` (same as KV backups)

### KV (Key-Value Store)

The project uses Cloudflare KV for simple key-value data storage.

```bash
npm run kv:import    # Pull all remote KV data to local
npm run kv:export    # Push local KV data to remote (auto-backups first)
```

These scripts are in `scripts/sync-kv.cjs` and use `wrangler kv:key list --remote` with bulk operations.

### Combined Sync

```bash
npm run sync         # Sync both KV and D1 from remote to local
```

This runs `scripts/sync.cjs` which calls both sync scripts.

## Code Architecture

### Directory Structure

```
src/
├── react-app/          # Frontend React application
│   ├── App.tsx        # Main app with client-side routing (getPage function)
│   ├── main.tsx       # React entry point
│   └── pages/         # Page components
│       ├── Home.tsx   # Frontend home (/)
│       ├── Page1.tsx  # Frontend page1 (/page1)
│       ├── Page2.tsx  # Frontend page2 (/page2)
│       └── system/    # Backend/management pages (/system/*)
│           ├── Menu.tsx           # Backend homepage (/system)
│           ├── MenuPage1.tsx      # /system/page1
│           ├── MenuPage2.tsx      # /system/page2
│           ├── TestKV.tsx         # KV management UI (/system/testKV)
│           ├── TestSQL.tsx        # SQL execution tool (/system/testSQL)
│           ├── UserManage.tsx     # User management (/system/user)
│           ├── RoleManage.tsx     # Role management (/system/role)
│           └── MenuManage.tsx     # Menu management (/system/menu)
└── worker/            # Cloudflare Worker backend
    ├── index.ts       # Main Hono app with API routes
    ├── index.d.ts     # Worker environment types (Env interface)
    └── d1-api.ts      # D1 permission system API routes

scripts/
├── sync.cjs           # Combined KV + D1 sync
├── sync-kv.cjs        # KV sync
├── sync-d1.cjs        # D1 sync
└── dev-start.cjs      # Auto-sync + dev server
```

### Routing

**Frontend routes** (in `src/react-app/App.tsx`):
- Public: `/`, `/page1`, `/page2`
- Backend: `/system` (backend homepage), `/system/page1`, `/system/page2`, `/system/testKV`, `/system/testSQL`
- Permission Admin: `/system/user`, `/system/role`, `/system/menu`

Uses simple path-based routing without React Router - the `getPage()` function matches `window.location.pathname` directly.

**API routes** (in `src/worker/index.ts` and `src/worker/d1-api.ts`):

*KV Storage:*
- `GET /api/kv` - List all keys
- `GET /api/kv/:key` - Get value by key
- `PUT /api/kv/:key` - Set value (body: `{"value":"xxx"}`)
- `DELETE /api/kv/:key` - Delete value
- `POST /api/kv/sync` - Sync all remote data to local

*User Management:*
- `GET /api/users` - List users
- `GET /api/users/:id` - Get user
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/users/:id/roles` - Get user roles
- `PUT /api/users/:id/roles` - Assign roles to user

*Role Management:*
- `GET /api/roles` - List roles
- `GET /api/roles/:id` - Get role
- `POST /api/roles` - Create role
- `PUT /api/roles/:id` - Update role
- `DELETE /api/roles/:id` - Delete role
- `GET /api/roles/:id/menus` - Get role menus
- `PUT /api/roles/:id/menus` - Assign menus to role

*Menu Management:*
- `GET /api/menus` - List menus (tree structure)
- `GET /api/menus/:id` - Get menu
- `POST /api/menus` - Create menu
- `PUT /api/menus/:id` - Update menu
- `DELETE /api/menus/:id` - Delete menu

*Permission Check:*
- `GET /api/user/:id/menus` - Get user's accessible menus
- `GET /api/user/:id/permissions` - Get user's permissions

*SQL Execution Tool:*
- `POST /api/sql/query` - Execute SQL statements (supports SELECT / INSERT / UPDATE / DELETE / CREATE / DROP)

### Bindings

- **KV Binding:** `KV_BINDING` - Access via `c.env.KV_BINDING` in Hono routes
- **D1 Binding:** `DB` - Access via `c.env.DB` in Hono routes (configured in `wrangler.json`)

### Project References

`tsconfig.json` uses project references for separate compilation contexts:
- `app` - React app compilation
- `node` - Node utilities
- `worker` - Cloudflare Worker code

## Styling

The project uses inline styles in React components, not CSS frameworks or external CSS files.

## Deployment

Build outputs to `dist/client` (assets) and `dist/server` (worker). Cloudflare Workers serves assets from `dist/client` with SPA fallback handling (`not_found_handling: "single-page-application"` in wrangler.json).
