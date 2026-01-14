# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal blog application with brutalist design aesthetic. Full-stack TypeScript monorepo using React frontend, Express backend, tRPC for type-safe APIs, and Drizzle ORM with MySQL.

## Development Commands

```bash
# Development (starts tsx watch server on port 3000+)
pnpm dev

# Build (Vite for client, esbuild for server)
pnpm build

# Production
pnpm start

# Type checking
pnpm check

# Format code
pnpm format

# Run tests
pnpm test

# Database migrations (generate + migrate)
pnpm db:push
```

## Architecture

### Monorepo Structure

- **client/**: React 19 frontend with Vite
  - `src/pages/`: Route components (Home, Articles, ArticleDetail, WriteArticle, Archive, About)
  - `src/components/`: Reusable components including shadcn/ui components
  - `src/lib/`: Utilities and tRPC client setup
  - Routing: Wouter (lightweight React router)
  - State: TanStack Query with tRPC integration

- **server/**: Express backend with tRPC
  - `_core/`: Core server infrastructure (index.ts, trpc.ts, oauth.ts, context.ts)
  - `routers.ts`: Main tRPC router with all API endpoints
  - `db.ts`: Database operations using Drizzle ORM
  - Entry point: `server/_core/index.ts`

- **shared/**: Code shared between client and server
  - `const.ts`: Shared constants (COOKIE_NAME, error messages)
  - `types.ts`: Shared TypeScript types
  - `_core/errors.ts`: Error handling utilities

- **drizzle/**: Database schema and migrations
  - `schema.ts`: Drizzle schema definitions (users, articles, categories)
  - `meta/`: Migration metadata

### Authentication Flow

Uses Manus OAuth with JWT tokens stored in HTTP-only cookies:

1. OAuth callback handled at `/api/oauth/callback` (server/_core/oauth.ts)
2. JWT token stored in cookie named `app_session_id` (shared/const.ts)
3. Three permission levels:
   - `publicProcedure`: No authentication required
   - `protectedProcedure`: Requires logged-in user
   - `adminProcedure`: Requires user.role === "admin"

The first user with `openId` matching `OWNER_OPEN_ID` env var is automatically set as admin.

### tRPC API Structure

All API routes defined in [server/routers.ts](server/routers.ts):

- `auth.me`: Get current user
- `auth.logout`: Clear session cookie
- `article.*`: CRUD operations for articles (list, bySlug, byId, create, update, delete)
- `category.*`: CRUD operations for categories
- `system.*`: System routes from systemRouter (Manus SDK integration)

Public routes allow unauthenticated access. Admin routes require admin role.

### Database Schema

Three main tables in [drizzle/schema.ts](drizzle/schema.ts):

**users**: Authentication and user profiles
- `openId`: Unique identifier from OAuth provider
- `role`: "user" or "admin" enum
- Tracks login method, timestamps, last sign-in

**categories**: Article classification
- Predefined categories: 嵌入式, ROS, 深度学习, DIY, 其他
- `slug`: URL-friendly identifier
- `sortOrder`: Display ordering

**articles**: Blog posts
- `status`: "draft", "published", or "archived"
- `slug`: URL-friendly identifier (must be unique)
- `categoryId`: Optional foreign key to categories
- No view count tracking (removed for simplicity)

### Client-Server Communication

1. tRPC client configured in `client/src/lib/trpc.ts`
2. Uses `@trpc/react-query` for React integration
3. SuperJSON for serialization (handles Date objects, etc.)
4. All API calls go through `/api/trpc/*` endpoint

### Development vs Production

**Development** (`NODE_ENV=development`):
- Vite dev server integrated into Express
- Hot module replacement enabled
- Server watches for changes with tsx

**Production** (`NODE_ENV=production`):
- Static files served from `dist/public/`
- Server bundle in `dist/index.js`
- Managed by PM2 process manager

## Environment Variables

Required in `.env` file:

```env
# Database
DATABASE_URL="mysql://user:password@host:port/database"

# Authentication
JWT_SECRET="random_secret_key"  # Generate with: openssl rand -base64 32

# Application
NODE_ENV="development" | "production"
PORT=3000

# Manus OAuth
VITE_APP_ID="your_app_id"
OAUTH_SERVER_URL="https://api.manus.im"
VITE_OAUTH_PORTAL_URL="https://manus.im/login"

# Owner (first user with this openId becomes admin)
OWNER_OPEN_ID="your_owner_open_id"
OWNER_NAME="Your Name"
```

## Deployment

Detailed deployment guide available in [云服务器部署教程.md](云服务器部署教程.md) (Chinese).

Key deployment steps:
1. Install Node.js 20.x, pnpm, MySQL
2. Create database and user
3. Configure environment variables
4. Run `pnpm install && pnpm db:push && pnpm build`
5. Use PM2 to manage process: `pm2 start dist/index.js --name blog`
6. Configure Nginx reverse proxy (port 3000 → 80/443)
7. Setup SSL with Certbot

PM2 commands:
```bash
pm2 status          # Check status
pm2 logs blog       # View logs
pm2 restart blog    # Restart app
pm2 startup         # Enable auto-start on boot
pm2 save            # Save process list
```

## Key Design Patterns

### Path Aliases

Configured in [vite.config.ts](vite.config.ts) and [tsconfig.json](tsconfig.json):
- `@/`: Points to `client/src/`
- `@shared/`: Points to `shared/`
- `@assets/`: Points to `attached_assets/`

### Error Handling

- tRPC errors use standard codes: `NOT_FOUND`, `FORBIDDEN`, `UNAUTHORIZED`
- Shared error messages in `shared/const.ts`
- Client-side error boundary in `client/src/components/ErrorBoundary.tsx`

### Styling

- Tailwind CSS v4 with `@tailwindcss/vite` plugin
- shadcn/ui components (Radix UI primitives)
- Theme provider supports light/dark modes
- Brutalist design: large typography, high contrast, geometric layouts

## Testing

- Vitest configured in [vitest.config.ts](vitest.config.ts)
- Test files: `*.test.ts` pattern
- Example tests: [server/article.test.ts](server/article.test.ts), [server/auth.logout.test.ts](server/auth.logout.test.ts)

## Package Manager

Uses pnpm with specific version pinned in `packageManager` field. Has patch for wouter package in `patches/wouter@3.7.1.patch`.
