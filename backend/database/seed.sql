-- Infini-Stock User Seed Data
-- Insert test users for all 5 roles (1 admin + 2 for each other role = 9 total users)

INSERT INTO profiles (id, full_name, email, role, is_active, created_at, updated_at) VALUES
-- Admin (1)
('550e8400-e29b-41d4-a716-446655440001', 'Admin User', 'admin@infocom.com', 'admin', true, NOW(), NOW()),

-- Manager (2)
('550e8400-e29b-41d4-a716-446655440002', 'James Manager', 'james.manager@infocom.com', 'manager', true, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'Sarah Manager', 'sarah.manager@infocom.com', 'manager', true, NOW(), NOW()),

-- Technician (2)
('550e8400-e29b-41d4-a716-446655440004', 'Mike Technician', 'mike.tech@infocom.com', 'technician', true, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440005', 'Emma Technician', 'emma.tech@infocom.com', 'technician', true, NOW(), NOW()),

-- Staff (2)
('550e8400-e29b-41d4-a716-446655440006', 'John Staff', 'john.staff@infocom.com', 'staff', true, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440007', 'Lisa Staff', 'lisa.staff@infocom.com', 'staff', true, NOW(), NOW()),

-- Viewer (2)
('550e8400-e29b-41d4-a716-446655440008', 'David Viewer', 'david.viewer@infocom.com', 'viewer', true, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440009', 'Rachel Viewer', 'rachel.viewer@infocom.com', 'viewer', true, NOW(), NOW());

-- Verification queries you can run to check:
-- SELECT COUNT(*) as total_users FROM profiles;
-- SELECT role, COUNT(*) FROM profiles GROUP BY role ORDER BY role;
-- SELECT id, full_name, email, role FROM profiles ORDER BY role;
