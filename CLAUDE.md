# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Quick Start
```bash
npm install                    # Install all dependencies
cp packages/backend/.env.example packages/backend/.env  # Set up environment
npm run db:migrate            # Run database migrations
npm run db:seed               # Seed with sample data
npm run dev                   # Start both frontend and backend
```

### Development
```bash
npm run dev                   # Start both frontend (port 5173) and backend (port 3000)
npm run dev:frontend          # Start only React frontend
npm run dev:backend           # Start only Hono API server
```

### Building & Testing
```bash
npm run build                 # Build all packages
npm run test                  # Run all tests
npm run test:e2e              # Run E2E tests
npm run test:coverage         # Run tests with coverage
npm run lint                  # Lint all packages
npm run type-check            # TypeScript type checking
```

### Database Operations
```bash
npm run db:generate           # Generate new Drizzle migration
npm run db:migrate            # Apply migrations to SQLite database
npm run db:seed               # Seed database with sample data
npm run db:reset              # Reset database (development only)
```

## Architecture Overview

This is a **multi-tenant scout troop inventory management system** built as a TypeScript monorepo using Turbo.

### Package Structure
- **`packages/frontend/`** - React 18 + Vite + TypeScript + Tailwind CSS application
- **`packages/backend/`** - Hono API server with JWT authentication and SQLite database
- **`packages/shared/`** - Shared TypeScript types and Zod validation schemas

### Key Technologies
- **Frontend**: React 18, Vite, Tailwind CSS, shadcn/ui components, React Query, Zustand
- **Backend**: Hono web framework, Drizzle ORM, SQLite, JWT authentication, QR code generation
- **Shared**: TypeScript, Zod validation, shared type definitions

### Database Schema
The SQLite database uses **multi-tenant architecture** with complete data isolation:
- **`troops`** - Scout troop organizations (tenants)
- **`users`** - User accounts with role-based access (admin/leader/scout/viewer)
- **`items`** - Inventory items with QR codes and location tracking
- **`transactions`** - Check-in/out audit trail

### Authentication & Authorization
- JWT-based authentication with 7-day expiry
- Role-based permissions: admin (full access), leader (troop management), scout (basic operations), viewer (read-only)
- Tenant isolation enforced at database level

### Key Features
- QR code-based item scanning for mobile devices
- Location-based organization (trailer sections: Left/Right, Low/Middle/High)
- Complete transaction audit trail
- Mobile-responsive design for field use

### Development Notes
- All packages use TypeScript with strict mode
- Shared types are centralized in `packages/shared/`
- Database migrations are managed with Drizzle Kit
- Environment variables required for JWT_SECRET and CORS_ORIGINS
- Frontend runs on port 5173, backend on port 3000