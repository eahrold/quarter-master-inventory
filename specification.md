# Quarter Master Inventory App - Technical Specification

## Overview

A web-based inventory management system for scout troops to track equipment stored in trailers, with QR code-based check-in/out functionality and location-based organization.

## Development Strategy: Frontend-Backend Parity

**All features must be implemented as complete pairs - backend API + frontend UI together.**

### Feature Development Requirements

1. **Backend API Complete**: All endpoints implemented, tested, and documented
2. **Frontend UI Complete**: All user interfaces implemented with proper error handling
3. **Integration Tested**: Frontend successfully consumes backend APIs
4. **User Workflow Tested**: Complete user journeys work end-to-end
5. **Documentation Updated**: Both API docs and UI component docs are current

### Feature Pair Status Tracking

- ✅ **Authentication & User Management**: Backend ✅ + Frontend ✅ = **COMPLETE**
- ✅ **Inventory Management**: Backend ✅ + Frontend ✅ = **COMPLETE**
- ⏳ **QR Code System**: Backend + Frontend both needed
- ⏳ **Transaction System**: Backend + Frontend both needed
- ⏳ **Search & Dashboard**: Backend + Frontend both needed

## Phase 1 - POC Requirements

### 1. User Management & RBAC

#### User Roles

- **Super Admin**: System-wide access, can create and manage troops, assign admins to troops
- **Admin**: Full troop access, user management, all inventory operations within assigned troop
- **Leader**: Troop-level management, inventory operations, view reports within troop
- **Scout**: Basic check-in/out operations, view inventory within troop
- **Viewer**: Read-only access to inventory status within troop

#### Authentication & Authorization

- User registration/login system
- Role-based permissions for all operations
- Multi-tenant data isolation between troops
- Super admin troop creation and management
- Session management
- Password reset functionality

### 2. Troop Management System

#### Troop Creation & Administration

- Super admin can create new scout troops
- Each troop has unique identifier (slug) and display name
- Troop-level data isolation enforced at database level
- Automatic admin assignment during troop creation

#### Multi-Tenant Architecture

- Complete data separation between troops
- Troop-scoped user roles and permissions
- Cross-troop access restricted to super admin only
- Tenant identification via troop slug

#### Troop Properties

- Unique identifier (auto-generated UUID)
- Display name (user-friendly)
- URL slug (unique, lowercase, hyphenated)
- Creation timestamp
- Active/inactive status
- User count (calculated)

### 3. Inventory Management System

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

### 4. Check-In/Out System

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

### 5. Search & Discovery

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

### 6. QR Code System

#### QR Code Generation

- Auto-generate unique QR codes for new items
- QR codes contain item ID and basic metadata
- Printable QR code labels
- QR code management (regenerate if needed)

#### QR Code Scanning

- Mobile-friendly QR scanner
- Fallback manual entry option
- Quick access to item check-in/out

### 7. User Interface Design

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
- Troop management (Super Admin only)

## Technical Architecture

### Database Schema

#### Troops Table

```sql
- id (Primary Key)
- name
- slug (unique)
- created_at
- updated_at
```

#### Users Table

```sql
- id (Primary Key)
- username
- email
- password_hash
- role (Super_Admin/Admin/Leader/Scout/Viewer)
- troop_id (Foreign Key to Troops, nullable for super_admin)
- created_at
- updated_at
```

#### Items Table

```sql
- id (Primary Key)
- troop_id (Foreign Key to Troops)
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
- troop_id (Foreign Key to Troops)
- item_id (Foreign Key to Items)
- user_id (Foreign Key to Users, nullable)
- action (Check_Out/Check_In)
- checked_out_by (string, for non-users)
- expected_return_date
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

#### Troops (Super Admin only)

- `GET /api/troops` - List all troops
- `GET /api/troops/:id` - Get troop details
- `POST /api/troops` - Create new troop
- `PUT /api/troops/:id` - Update troop
- `DELETE /api/troops/:id` - Delete troop

### Frontend Components

#### Authentication Components

- **LoginForm**: Email/password login with validation and error handling
- **RegisterForm**: User registration with troop selection and role assignment
- **AuthContext**: React context for authentication state management
- **ProtectedRoute**: Route wrapper for role-based access control
- **AuthLayout**: Shared layout for login/register pages

#### Dashboard Components

- **DashboardOverview**: Main dashboard with inventory summary cards
- **InventoryStats**: Visual statistics (total items, checked out, needs repair)
- **RecentActivity**: Recent transactions and check-in/out activity
- **QuickActions**: Fast access to common operations (scan QR, search)

#### Inventory Management Components

- **ItemList**: Paginated list of inventory items with search/filters
- **ItemCard**: Individual item display with status, location, and actions
- **ItemDetail**: Detailed view of item with transaction history
- **ItemForm**: Create/edit form with validation (name, category, location)
- **LocationSelector**: Dropdown/picker for trailer location (Left/Right-Low/Middle/High)
- **ItemSearch**: Search input with real-time filtering and autocomplete

#### QR Code & Scanning Components

- **QRScanner**: Camera-based QR code scanner with permission handling
- **QRDisplay**: Display generated QR codes for items
- **ScanResult**: Show scanned item details and available actions
- **CameraPermission**: Handle camera permission requests and errors

#### Transaction & Checkout Components

- **CheckoutFlow**: Multi-step checkout process (scan → confirm → complete)
- **CheckinFlow**: Check-in process with condition reporting
- **TransactionHistory**: List of transactions with filtering and pagination
- **TransactionDetail**: Detailed transaction view with timestamps and user info

#### User Management Components (Admin Only)

- **UserList**: List of all users in troop with role indicators
- **UserForm**: Create/edit user form with role assignment
- **UserDetail**: User profile with permissions and activity history
- **RoleSelector**: Dropdown for selecting user roles

#### Troop Management Components (Super Admin Only)

- **SuperAdminDashboard**: Main interface for super admin with troop overview and statistics
- **TroopList**: List of all troops with status indicators and user counts
- **TroopCard**: Individual troop display with key information and actions
- **TroopForm**: Create/edit troop form with validation (name, slug)
- **TroopDetail**: Detailed troop view with user management and statistics
- **TroopSelector**: Dropdown for selecting troops during registration

#### Shared UI Components

- **Header**: Navigation header with user menu and troop info
- **Sidebar**: Main navigation sidebar with role-based menu items
- **LoadingSpinner**: Consistent loading indicators
- **ErrorBoundary**: Error handling and display
- **Modal**: Reusable modal component for forms and confirmations
- **Toast**: Notification system for success/error messages

## User Stories

### As a Super Admin

- I can create new scout troops with unique identifiers
- I can view and manage all troops across the entire system
- I can assign administrators to specific troops
- I can view system-wide statistics and usage metrics
- I can delete inactive or outdated troops (with proper safeguards)
- I can access any troop's data for support and administration purposes

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

### Enhanced Multi-Troop Features

- Cross-troop resource sharing and borrowing
- Advanced troop analytics and comparisons
- Troop-to-troop communication system
- District/council level administration
- Bulk operations across multiple troops

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

## Bug Tracking and Quality Assurance

### Bug Tracking System

The project maintains a centralized bug tracking system in `BUGS.md` to ensure all discovered issues are properly documented, tracked, and resolved.

#### Bug Documentation Process

**1. Bug Discovery and Reporting**

- **Immediate Documentation**: When bugs are discovered, they must be immediately added to `BUGS.md`
- **Clear Description**: Include specific, actionable descriptions of the bug
- **Reproduction Steps**: Document how to reproduce the issue
- **Impact Assessment**: Note severity and affected user workflows
- **Context Information**: Include browser, device, or environment details when relevant

**2. Bug Status Management**

- **Open Bugs**: Use `- [ ]` checkbox format for unresolved issues
- **Fixed Bugs**: Change to `- [x]` checkbox when resolved
- **Commit Reference**: Always include the commit SHA that fixes the bug
- **Verification**: Ensure fix is tested and confirmed working

#### Bug Categories and Examples

**Frontend Bugs**

```markdown
- [ ] Search input loses focus on mobile Safari - Affects search functionality
- [ ] Modal dialog not closing on backdrop click - Z-index issue with overlays
- [ ] Form validation errors not clearing - State management bug in form component
```

**Backend Bugs**

```markdown
- [ ] API returns 500 on empty search query - Missing null check in search endpoint
- [ ] Database connection timeout on large queries - Performance optimization needed
- [ ] JWT token refresh fails after 24 hours - Token validation logic error
```

**Integration Bugs**

```markdown
- [ ] QR scanner fails in low-light conditions - Camera API timeout issues
- [ ] Real-time updates not syncing across tabs - WebSocket connection handling
- [ ] File upload progress not updating - Frontend-backend progress communication
```

#### Bug Tracking Integration with Development

**Feature Development Requirements**

- All new features must include bug prevention measures
- Code reviews must check for potential bug introduction
- Testing must cover both happy path and error scenarios
- Documentation must include known limitations and workarounds

**Bug Fix Process**

1. **Reproduce**: Confirm the bug can be reliably reproduced
2. **Isolate**: Identify the root cause and affected components
3. **Fix**: Implement the minimum necessary fix
4. **Test**: Verify fix works and doesn't introduce regressions
5. **Document**: Update `BUGS.md` with fix reference and commit SHA
6. **Monitor**: Watch for related issues after deployment

#### Quality Assurance Standards

**Pre-Release Bug Review**

- All open bugs must be triaged before releases
- Critical bugs must be fixed before deployment
- Known bugs must be documented in release notes
- User-facing bugs require stakeholder approval to ship

**Bug Prevention Strategies**

- **Static Analysis**: Use TypeScript, ESLint, and automated tools
- **Testing Coverage**: Maintain minimum coverage thresholds
- **Peer Review**: Mandatory code review for all changes
- **User Testing**: Regular testing with actual user workflows

## Security Considerations

- Input validation on all endpoints
- SQL injection prevention
- XSS protection
- CSRF protection
- Secure password hashing
- Rate limiting on API endpoints
- Audit logging for sensitive operations

## Testing Requirements

### Unit Testing Standards

All features must include comprehensive unit tests with minimum coverage thresholds:

- **Authentication & Authorization**: 100% coverage required
- **Business Logic**: 90% coverage required
- **API Endpoints**: 85% coverage required
- **Database Operations**: 85% coverage required
- **Utility Functions**: 90% coverage required

### Test Categories Required

#### Authentication Tests

- JWT token generation and validation
- Password hashing and verification
- Role-based access control
- Session management
- Login/logout functionality
- User registration validation

#### Database Tests

- Multi-tenant data isolation
- Foreign key constraints
- Cascade deletion behavior
- Data validation and constraints
- Transaction rollback scenarios
- Database connection handling

#### API Endpoint Tests

- Request validation
- Response formatting
- Error handling
- Authentication middleware
- Authorization checks
- Rate limiting behavior

#### Integration Tests

- End-to-end user workflows
- QR code generation and scanning
- Check-in/out processes
- Search functionality
- File upload/download operations

#### Security Tests

- Input sanitization
- SQL injection prevention
- XSS attack prevention
- Authentication bypass attempts
- Authorization escalation attempts
- Rate limiting effectiveness

### Testing Tools & Framework

- **Backend**: Vitest with better-sqlite3 for in-memory testing
- **Frontend**: Vitest + Testing Library for component tests
- **E2E**: Playwright for full application testing
- **Coverage**: Minimum 85% overall statement coverage
- **CI/CD**: All tests must pass before deployment

### Test Data Management

- Use in-memory databases for unit tests
- Implement proper test data cleanup
- Create reusable test fixtures
- Maintain test data isolation between tests
- Use factory patterns for test data generation

### Testing Best Practices

- Write tests before implementation (TDD encouraged)
- Test both happy path and error scenarios
- Include edge cases and boundary conditions
- Mock external dependencies appropriately
- Maintain fast test execution times
- Document complex test scenarios

## Performance Requirements

- Page load times under 3 seconds
- Search results under 2 seconds
- Support for 1000+ items
- Concurrent user support (10+ users)
- Mobile device compatibility
- Offline capability for QR scanning (future consideration)
