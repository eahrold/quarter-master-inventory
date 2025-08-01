# Quarter Master Inventory App - Technical Specification

## Overview
A web-based inventory management system for scout troops to track equipment stored in trailers, with QR code-based check-in/out functionality and location-based organization.

## Phase 1 - POC Requirements

### 1. User Management & RBAC

#### User Roles
- **Admin**: Full system access, user management, all inventory operations
- **Leader**: Troop-level management, inventory operations, view reports
- **Scout**: Basic check-in/out operations, view inventory
- **Viewer**: Read-only access to inventory status

#### Authentication & Authorization
- User registration/login system
- Role-based permissions for all operations
- Session management
- Password reset functionality

### 2. Inventory Management System

#### Item Categories
- **Permanent Items**: Long-term equipment (tents, water jugs, rope, saws, spars)
- **Staples**: Consumable supplies (toilet paper, paper plates, etc.)

#### Item Properties
- Unique identifier (auto-generated)
- Name and description
- Category (Permanent/Staples)
- Location in trailer
- Current status (Available/Checked Out/Needs Repair)
- QR code (auto-generated)
- Creation date
- Last updated timestamp

#### Location System
**Trailer Organization Structure:**
- Side: Left/Right
- Shelf Level: Low/Middle/High
- Location Format: `{Side}-{Level}` (e.g., "Left-High", "Right-Low")

### 3. Check-In/Out System

#### Check-Out Process
- Scan QR code or search for item
- Capture minimal information:
  - Who is checking out (auto-complete from user system, but allow manual entry)
  - Checkout timestamp (auto-generated)
  - Optional: Expected return date
- Update item status to "Checked Out"

#### Check-In Process
- Scan QR code or search for item
- Verify item condition
- Update item status to "Available"
- Record check-in timestamp
- Log transaction

#### Transaction Logging
- All check-in/out activities logged
- Transaction history per item
- User activity tracking

### 4. Search & Discovery

#### Search Functionality
- Global search bar
- Search by item name, description, category
- Filter by location, status, category
- Sort by name, location, last updated

#### Inventory Overview
- Dashboard with current inventory status
- Group items by categories
- Location-based views
- Status summaries (Available/Checked Out counts)

### 5. QR Code System

#### QR Code Generation
- Auto-generate unique QR codes for new items
- QR codes contain item ID and basic metadata
- Printable QR code labels
- QR code management (regenerate if needed)

#### QR Code Scanning
- Mobile-friendly QR scanner
- Fallback manual entry option
- Quick access to item check-in/out

### 6. User Interface Design

#### Design Requirements
- Primary colors: Yellow and Orange theme
- Mobile-responsive design
- Intuitive navigation
- Quick action buttons for common tasks
- Clean, scannable layouts

#### Key Views
- Dashboard/Overview
- Inventory listing with filters
- Item detail pages
- Check-in/out interface
- QR code scanner
- User management (Admin/Leader roles)

## Technical Architecture

### Database Schema

#### Users Table
```sql
- id (Primary Key)
- username
- email
- password_hash
- role (Admin/Leader/Scout/Viewer)
- troop_id (for Phase 2)
- created_at
- updated_at
```

#### Items Table
```sql
- id (Primary Key)
- name
- description
- category (Permanent/Staples)
- location_side (Left/Right)
- location_level (Low/Middle/High)
- status (Available/Checked_Out/Needs_Repair)
- qr_code
- created_at
- updated_at
```

#### Transactions Table
```sql
- id (Primary Key)
- item_id (Foreign Key)
- user_id (Foreign Key, nullable)
- action (Check_Out/Check_In)
- checked_out_by (string, for non-users)
- timestamp
- notes
```

### API Endpoints

#### Authentication
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/register`
- `GET /api/auth/me`

#### Items
- `GET /api/items` - List all items with filters
- `GET /api/items/:id` - Get item details
- `POST /api/items` - Create new item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item
- `POST /api/items/:id/checkout` - Check out item
- `POST /api/items/:id/checkin` - Check in item

#### QR Codes
- `GET /api/qr/:item_id` - Generate QR code
- `POST /api/qr/scan` - Process QR scan

#### Users (Admin/Leader only)
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Frontend Components
- Authentication components (Login/Register)
- Dashboard with inventory overview
- Item listing with search/filters
- Item detail/edit forms
- QR code scanner component
- Check-in/out workflow components
- User management interface
- Mobile-responsive navigation

## User Stories

### As an Admin
- I can create, edit, and delete inventory items
- I can manage user accounts and assign roles
- I can view all transactions and generate reports
- I can print QR codes for new items

### As a Leader
- I can check items in and out
- I can add new items to inventory
- I can view inventory status and transaction history
- I can manage scouts in my troop

### As a Scout
- I can check out items using QR codes
- I can check items back in
- I can search for available items
- I can view current inventory status

### As a Viewer
- I can view current inventory status
- I can search items
- I cannot modify inventory or check items in/out

## Acceptance Criteria

### Core Functionality
- [ ] Users can successfully log in with role-based access
- [ ] Items can be added with all required properties
- [ ] QR codes are automatically generated for new items
- [ ] Check-out process captures minimal required information
- [ ] Check-in process updates item status correctly
- [ ] Search functionality returns accurate results
- [ ] Location-based organization is enforced
- [ ] Transaction history is properly logged

### Performance & Usability
- [ ] Mobile-responsive design works on common devices
- [ ] QR code scanning works reliably
- [ ] Search results appear within 2 seconds
- [ ] Interface follows yellow/orange color scheme
- [ ] All forms validate input appropriately

## Phase 2 - Future Enhancements

### Multi-Troop Tenancy
- Troop-level data isolation
- Cross-troop user management
- Troop-specific reporting
- Resource sharing capabilities

### Maintenance Workflow
- Repair status tracking
- Maintenance task assignment
- Repair history logging
- Cost tracking for repairs
- Maintenance scheduling
- Vendor management

### Advanced Features
- Reporting and analytics dashboard
- Export functionality (CSV, PDF reports)
- Email notifications for overdue items
- Bulk operations for inventory management
- Advanced search with saved filters
- Item reservation system

## Security Considerations
- Input validation on all endpoints
- SQL injection prevention
- XSS protection
- CSRF protection
- Secure password hashing
- Rate limiting on API endpoints
- Audit logging for sensitive operations

## Performance Requirements
- Page load times under 3 seconds
- Search results under 2 seconds
- Support for 1000+ items
- Concurrent user support (10+ users)
- Mobile device compatibility
- Offline capability for QR scanning (future consideration)