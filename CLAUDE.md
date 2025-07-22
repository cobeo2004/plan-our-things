# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A full-stack Next.js application with PocketBase backend for planning trips collaboratively. Features group management, trip planning with timeline items, polls for decision making, and real-time chat.

### Core Architecture

- **Frontend**: Next.js 15 (App Router) with TypeScript
- **Backend**: PocketBase (Go-based backend) with TypeScript schema
- **API**: Hono.js for type-safe API routes
- **Database**: SQLite with PocketBase
- **Auth**: PocketBase built-in authentication
- **State**: TanStack Query for client-side state management

### Key Features

1. **Group Management**
   - Groups with unique codes
   - Member roles (admin/member)
   - Group-based permission system

2. **Trip Planning**
   - Create trips with start/end dates
   - Timeline items for activities
   - Cover images support

3. **Collaboration**
   - Polls for group decisions
   - Real-time chat per trip
   - Voting system

### Development Commands

```bash
# Development
npm run dev                 # Run both Next.js and PocketBase in dev mode
npm run dev:web            # Run only Next.js
npm run dev:pb             # Run only PocketBase

# Build
npm run build              # Build Next.js for production
npm start                  # Start Next.js production server

# Code Quality
npm run lint               # Run ESLint
npm run typegen            # Regenerate PocketBase types

# Database
./pocketbase/pocketbase serve --dev    # Start PocketBase in dev mode
```

### Directory Structure

```
src/
├── actions/            # Server actions for auth
├── app/               # Next.js app router
│   ├── (auth)/        # Login/register pages
│   ├── (protected)/   # Protected dashboard/trip pages
│   ├── api/           # API routes (Hono.js)
│   └── _components/   # Shared layout components
├── hono/              # Hono.js backend API
├── lib/               # Core libraries
│   └── pocketbase/    # PocketBase client & schema
├── types/             # TypeScript types
└── utils/             # Utilities & helpers

pocketbase/
├── pb_data/           # Database files
├── pb_hooks/          # Server-side JavaScript hooks
├── pb_migrations/     # Database migrations
└── pocketbase         # PocketBase binary
```

### Database Schema

**Core Collections:**
- **users** - User accounts with avatar support
- **groups** - Trip groups with code-based access
- **group_members** - Many-to-many user-group relationships
- **trips** - Individual trips with dates, images
- **timeline_items** - Activities within trips
- **polls** - Decision polls linked to trips
- **poll_options** - Individual poll choices
- **poll_votes** - User votes on polls
- **chat_messages** - Real-time chat per trip

### Type Safety

The project uses generated TypeScript types from PocketBase schema:
- `src/types/pocketbase-types.ts` - Raw typegen output
- `src/lib/pocketbase/schema/tsSchema.ts` - Enhanced schema types
- `src/lib/pocketbase/schema/zodSchema.ts` - Zod validation schemas

### Authentication Flow

1. Client-side auth via PocketBase JS SDK
2. Server-side session validation using `getSession()` action
3. API routes protected by auth middleware in Hono
4. Permission checking via utility functions

### Key Components

- **PocketBase Integration**: Custom React hooks for auth sync
- **Query Management**: TanStack Query for data fetching/caching
- **Route Protection**: Next.js middleware for auth checks
- **File Uploads**: Image support for avatars, trip covers, timeline items
- **Real-time**: Chat messages use PocketBase real-time features

### Environment Setup

Run `./scripts/init.sh` to set up the development environment with proper permissions and configurations.