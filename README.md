# Quarter Master Inventory App

A web-based inventory management system for scout troops to track equipment stored in trailers, with QR code-based check-in/out functionality and location-based organization.

## Features

- **Multi-Tenant**: Complete data isolation between scout troops
- **Role-Based Access Control**: Admin, Leader, Scout, and Viewer roles
- **QR Code Integration**: Camera-based scanning for quick item access
- **Mobile-Responsive**: Optimized for mobile devices and tablets
- **Location Tracking**: Organize items by trailer location (Left/Right, Low/Middle/High)
- **Transaction Logging**: Complete audit trail of all check-in/out activities

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and builds
- **Tailwind CSS** with yellow/orange theme
- **shadcn/ui** component library
- **React Query** for server state management
- **Zustand** for client state management

### Backend
- **Hono** TypeScript-first web framework
- **Drizzle ORM** with SQLite database
- **JWT** authentication
- **QR Code** generation and parsing

### Shared
- **TypeScript** types and validation schemas
- **Zod** runtime validation

## Project Structure

```
quartermaster-app/
├── packages/
│   ├── frontend/          # React application
│   ├── backend/           # Hono API server
│   └── shared/            # Shared types and utilities
├── docs/                  # Documentation
└── README.md
```

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp packages/backend/.env.example packages/backend/.env
   # Edit .env with your configuration
   ```

3. **Initialize database**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

4. **Start development servers**
   ```bash
   npm run dev
   ```

   This starts both frontend (http://localhost:5173) and backend (http://localhost:3000)

## Development Commands

```bash
# Development
npm run dev                # Start both frontend and backend
npm run dev:frontend      # Start only frontend
npm run dev:backend       # Start only backend

# Building
npm run build             # Build all packages
npm run build:frontend    # Build frontend only
npm run build:backend     # Build backend only

# Testing
npm run test              # Run all tests
npm run test:e2e          # Run E2E tests
npm run test:coverage     # Run tests with coverage

# Database
npm run db:generate       # Generate new migration
npm run db:migrate        # Run migrations
npm run db:seed           # Seed database with sample data
npm run db:reset          # Reset database (dev only)

# Code Quality
npm run lint              # Lint all packages
npm run type-check        # TypeScript type checking
```

## User Roles

- **Admin**: Full system access, user management, all inventory operations
- **Leader**: Troop-level management, inventory operations, view reports
- **Scout**: Basic check-in/out operations, view inventory
- **Viewer**: Read-only access to inventory status

## API Documentation

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Items
- `GET /api/items` - List items with filters
- `POST /api/items` - Create new item (Leader+)
- `PUT /api/items/:id` - Update item (Leader+)
- `POST /api/items/:id/checkout` - Check out item
- `POST /api/items/:id/checkin` - Check in item

### QR Codes
- `GET /api/qr/:item_id` - Generate QR code
- `POST /api/qr/scan` - Process QR scan

## License

MIT License - see LICENSE file for details.