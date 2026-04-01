# Model Updates for RBAC Implementation

## Summary
Updated 4 existing models and created 2 new models to support role-based access control (RBAC) with complete audit trails.

---

## Updated Models

### 1. **Asset.js** ✅
**New Field:**
- `created_by` (uuid) - Tracks which user created each asset

**New Relation:**
- `creator` → Profile (many-to-one) - Links to user who created the asset

**Impact:** Every asset now has an audit trail of who created it.

### 2. **ActivityLog.js** ✅
**New Relation:**
- `user` → Profile (many-to-one) - Links to user who performed the action

**Database Column:** 
- Uses existing `user_id` field

**Impact:** Activity logs can now populate user details (email, name, role) automatically.

### 3. **AssetMovement.js** ✅
**New Relation:**
- `user` → Profile (many-to-one) - Links to user who moved the asset

**Database Column:**
- Uses existing `moved_by` field

**Impact:** Can query movements by user, track technician activity.

### 4. **AssetStatusHistory.js** ✅
**New Relation:**
- `user` → Profile (many-to-one) - Links to user who changed status

**Database Column:**
- Uses existing `changed_by` field

**Impact:** Complete audit trail of who changed asset status and when.

---

## New Models

### 5. **Unit.js** (NEW) ✨
Explicit model for System Units (replaces Asset type='unit')

**Columns:**
- `id` (uuid, primary)
- `device_name` (varchar 255)
- `qr_code` (varchar 100, unique)
- `status` (varchar 20, default 'active')
- `location` (text, nullable)
- `description` (text, nullable)
- `created_by` (uuid)
- `created_at`, `updated_at` (timestamps)

**Relations:**
- `creator` → Profile (many-to-one)
- `monitors` → Monitor (one-to-many) - Lists all monitors linked to this unit

**Use Cases:**
- Cleaner queries: `SELECT * FROM units WHERE status = 'active'`
- Better type safety
- Can add unit-specific fields later (asset_count, serial_number, etc.)

### 6. **Monitor.js** (NEW) ✨
Explicit model for Monitor Devices (replaces Asset type='monitor')

**Columns:**
- `id` (uuid, primary)
- `device_name` (varchar 255)
- `qr_code` (varchar 100, unique)
- `status` (varchar 20, default 'active')
- `description` (text, nullable)
- `created_by` (uuid)
- `created_at`, `updated_at` (timestamps)

**Relations:**
- `linkedUnit` → Unit (many-to-one, nullable) - The unit this monitor is paired with
- `creator` → Profile (many-to-one)

**Use Cases:**
- Cleaner queries: `SELECT * FROM monitors WHERE status = 'inactive'`
- Query monitors by linked unit: `SELECT * FROM monitors WHERE linked_unit_id = $1`
- Better type safety
- Can add monitor-specific fields later (resolution, model, warranty_date, etc.)

---

## Database Migration Plan

When you run `npm run dev` on the backend, TypeORM will auto-sync the schema:

1. **Add `created_by` column to `assets` table**
2. **Create new `units` table** with all columns and indexes
3. **Create new `monitors` table** with all columns and indexes
4. **Add foreign key constraints** linking back to `profiles` table

---

## API Benefits

### Before (Asset-based)
```javascript
// Get all units - mix with other asset types
GET /api/assets?type=unit

// Get all monitors - harder to query
GET /api/assets?type=monitor
```

### After (Dedicated models)
```javascript
// Get all units - clear API endpoint
GET /api/units

// Filter by status
GET /api/units?status=active

// Get unit with its monitors
GET /api/units/:id?include=monitors

// Get all monitors
GET /api/monitors

// Get monitors for a specific unit
GET /api/units/:id/monitors
```

---

## Audit Trail Example

### Complete Asset lifecycle now shows:
```javascript
{
  asset: {
    id: "asset-123",
    qr_code: "QR-2024-001",
    created_by: "user-abc",          // ← Now trackable
    created_at: "2024-01-15T10:00:00Z",
    creator: {
      full_name: "John Manager",
      email: "john@infocom.com",
      role: "manager"
    }
  },
  movements: [
    {
      id: "movement-1",
      from_location: "Warehouse A",
      to_location: "Building B",
      moved_by: "user-xyz",
      user: {
        full_name: "Sarah Technician",
        email: "sarah@infocom.com",
        role: "technician"
      },
      moved_at: "2024-01-16T14:30:00Z"
    }
  ],
  status_changes: [
    {
      id: "status-1",
      old_status: "active",
      new_status: "maintenance",
      changed_by: "user-xyz",
      user: {
        full_name: "Sarah Technician",
        email: "sarah@infocom.com",
        role: "technician"
      },
      changed_at: "2024-01-17T09:15:00Z"
    }
  ]
}
```

---

## Next Steps

1. ✅ Models updated
2. Run backend to auto-sync schema:
   ```bash
   cd backend
   npm run dev
   ```
3. Create API endpoints for Unit and Monitor operations:
   - `GET /api/units`
   - `POST /api/units`
   - `PATCH /api/units/:id`
   - `GET /api/monitors`
   - `POST /api/monitors`
   - `PATCH /api/monitors/:id`
4. Update frontend forms to use new endpoints
5. Update Activity Log queries to include user relationships

---

## Files Modified

```
backend/src/models/
  Asset.js                    ← Added created_by + creator relation
  ActivityLog.js              ← Added user relation
  AssetMovement.js            ← Added user relation
  AssetStatusHistory.js       ← Added user relation
  Unit.js                     ← NEW
  Monitor.js                  ← NEW
```

---

## Notes

- **Referential Integrity**: All user relationships use `RESTRICT` on delete, meaning you can't delete a user who created/moved/changed assets
- **Cascade Deletes**: Asset deletions cascade to movements and status history
- **Automatic Timestamps**: All new/updated records get timestamps automatically
- **UUID Generation**: All IDs are auto-generated UUIDs
