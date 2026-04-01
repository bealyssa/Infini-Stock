# Role-Based Access Control (RBAC) System

## Overview
Infini-Stock implements a comprehensive role-based access control system with **5 roles** and **20+ permissions**.

---

## Available Roles

| Role | Level | Description | Use Case |
|------|-------|-------------|----------|
| **admin** | 5 | Full system access | System administrators, super users |
| **manager** | 4 | Asset management, monitoring, reports | Team leads, supervisors |
| **technician** | 3 | Scan assets, update status, swap monitors | Field technicians, service staff |
| **staff** | 2 | Read-only access (default) | General staff, data viewers |
| **viewer** | 1 | Audit/minimal access | External auditors, compliance |

---

## Role Hierarchy

```
admin
  ↓
manager → technician → staff → viewer
```

**Inheritance**: A role inherits permissions from roles below it in the hierarchy.

---

## Permissions Matrix

### Dashboard & Monitoring
- `dashboard:view` - View dashboard (all roles except viewer)
- `dashboard:edit` - Edit dashboard settings (admin, manager)
- `activity:view` - View activity logs (all roles)
- `activity:export` - Export activity logs (admin, manager)

### Asset Management
- `asset:create` - Create new assets (admin, manager)
- `asset:read` - View assets (all roles)
- `asset:update` - Edit asset details (admin, manager, technician)
- `asset:delete` - Delete assets (admin only)
- `asset:scan` - Scan assets with QR code (admin, manager, technician)
- `asset:move` - Update asset location (admin, manager, technician)
- `asset:swap` - Swap monitors on units (admin, manager, technician)

### System Units
- `unit:create` - Create units (admin, manager)
- `unit:read` - View units (all roles)
- `unit:update` - Edit units (admin, manager)
- `unit:delete` - Delete units (admin only)

### Monitors
- `monitor:create` - Create monitors (admin, manager)
- `monitor:read` - View monitors (all roles)
- `monitor:update` - Edit monitors (admin, manager)
- `monitor:delete` - Delete monitors (admin only)

### QR Codes
- `qr:generate` - Generate QR codes (admin, manager, technician)
- `qr:view` - View QR codes (all roles)

### User Management
- `user:create` - Create users (admin only)
- `user:read` - View users (admin only)
- `user:update` - Edit users (admin only)
- `user:delete` - Delete users (admin only)
- `user:assign_role` - Change user roles (admin only)

### Reports
- `report:view` - View reports (admin, manager)
- `report:generate` - Generate reports (admin, manager)
- `report:export` - Export reports (admin, manager)

### Settings
- `settings:view` - View settings (admin only)
- `settings:update` - Update settings (admin only)

---

## API Endpoints

### Authentication

#### Register User
```bash
POST /api/auth/register
Content-Type: application/json

{
  "full_name": "John Technician",
  "email": "john@example.com",
  "password": "secure-password",
  "role": "technician"  // optional, defaults to 'staff'
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "full_name": "John Technician",
    "role": "technician"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "secure-password"
}
```

**Response:** Same as register

#### Get Current User
```bash
GET /api/auth/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "full_name": "John Technician",
    "role": "technician",
    "is_active": true,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

---

## Usage Examples

### Test Authentication

**1. Register a technician:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Sarah Tech",
    "email": "sarah@infocom.com",
    "password": "tech-pass-123",
    "role": "technician"
  }'
```

**2. Get the token from response and use it:**
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

### Test Asset Endpoints

**Scan Asset (requires `asset:scan` permission):**
```bash
curl -X POST http://localhost:5000/api/assets/scan \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "qrCode": "QR-2024-001",
    "locationId": "location-uuid",
    "notes": "Scanned at warehouse"
  }'
```

---

## Error Responses

### Unauthorized (No Token)
```json
{
  "message": "Missing bearer token"
}
```

### Forbidden (Insufficient Role)
```json
{
  "message": "Forbidden: Insufficient role"
}
```

### Forbidden (Missing Permission)
```json
{
  "message": "Forbidden: Missing permission 'asset:delete'"
}
```

---

## Adding New Roles/Permissions

### To add a new role:

1. Add to `backend/src/config/roles.js`:
```javascript
const ROLES = {
    // ...existing roles
    supervisor: 'supervisor',
}

const ROLE_HIERARCHY = {
    // ...existing
    supervisor: ['manager'],
}
```

2. Add permissions for the role:
```javascript
const PERMISSIONS = {
    'asset:create': ['admin', 'manager', 'supervisor'],
    // ...
}
```

### To add a new permission:

1. Define in `backend/src/config/roles.js`:
```javascript
const PERMISSIONS = {
    'custom:action': ['admin', 'manager', 'technician'],
    // ...
}
```

2. Use in routes:
```javascript
router.post('/endpoint', 
    requireAuth, 
    requirePermission('custom:action'), 
    controller.handler
)
```

---

## Security Notes

- **Token Expiration**: JWT tokens expire after 7 days
- **Password Hashing**: Current implementation is for demo. Use bcrypt for production
- **JWT Secret**: Change `JWT_SECRET` in `.env` for production
- **Role Assignment**: Only admins can assign roles

---

## Database Schema

The `profiles` table stores user information:
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'staff',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## Next Steps

1. Test authentication endpoints
2. Create test users with different roles
3. Verify permissions work as expected
4. Integrate with frontend Login/Register pages
5. Implement admin panel for user role management
