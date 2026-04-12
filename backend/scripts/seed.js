/**
 * Database Seed Script - Infini-Stock
 * Usage: node scripts/seed.js
 *
 * Seeds all tables with realistic sample data and connected relationships.
 */

require('dotenv').config()
require('reflect-metadata')

const { AppDataSource } = require('../src/config/dataSource')
const Profile = require('../src/models/Profile')
const Location = require('../src/models/Location')
const Unit = require('../src/models/Unit')
const Monitor = require('../src/models/Monitor')
const Asset = require('../src/models/Asset')
const MonitorAssignment = require('../src/models/MonitorAssignment')
const AssetMovement = require('../src/models/AssetMovement')
const AssetStatusHistory = require('../src/models/AssetStatusHistory')
const ActivityLog = require('../src/models/ActivityLog')
const { hashPassword } = require('../src/utils/password')

const seedUsers = [
    {
        id: '550e8400-e29b-41d4-a716-446655440001',
        full_name: 'Amara Santos',
        email: 'amara.santos@infini-stock.com',
        password: 'admin123',
        role: 'admin',
        is_active: true,
    },
    {
        id: '550e8400-e29b-41d4-a716-446655440002',
        full_name: 'James Carter',
        email: 'james.carter@infini-stock.com',
        password: 'manager123',
        role: 'manager',
        is_active: true,
    },
    {
        id: '550e8400-e29b-41d4-a716-446655440003',
        full_name: 'Sarah Nguyen',
        email: 'sarah.nguyen@infini-stock.com',
        password: 'manager123',
        role: 'manager',
        is_active: true,
    },
    {
        id: '550e8400-e29b-41d4-a716-446655440004',
        full_name: 'Miguel Torres',
        email: 'miguel.torres@infini-stock.com',
        password: 'tech123',
        role: 'technician',
        is_active: true,
    },
    {
        id: '550e8400-e29b-41d4-a716-446655440005',
        full_name: 'Emma Patel',
        email: 'emma.patel@infini-stock.com',
        password: 'tech123',
        role: 'technician',
        is_active: true,
    },
    {
        id: '550e8400-e29b-41d4-a716-446655440006',
        full_name: 'John Reyes',
        email: 'john.reyes@infini-stock.com',
        password: 'staff123',
        role: 'staff',
        is_active: true,
    },
    {
        id: '550e8400-e29b-41d4-a716-446655440007',
        full_name: 'Lisa Chen',
        email: 'lisa.chen@infini-stock.com',
        password: 'staff123',
        role: 'staff',
        is_active: true,
    },
    {
        id: '550e8400-e29b-41d4-a716-446655440008',
        full_name: 'David Brooks',
        email: 'david.brooks@infini-stock.com',
        password: 'viewer123',
        role: 'viewer',
        is_active: true,
    },
    {
        id: '550e8400-e29b-41d4-a716-446655440009',
        full_name: 'Rachel Gomez',
        email: 'rachel.gomez@infini-stock.com',
        password: 'viewer123',
        role: 'viewer',
        is_active: true,
    },
]

const seedLocations = [
    {
        id: '660e8400-e29b-41d4-a716-446655440001',
        qr_code: 'LOC-HQ-NOC-01',
        code: 'HQ-NOC-01',
        name: 'Head Office NOC',
        site: 'Quezon City HQ',
        building: 'Main Tower',
        floor: '4F',
        room: 'NOC-401',
        notes: 'Primary operations floor for live monitoring screens.',
        is_active: true,
    },
    {
        id: '660e8400-e29b-41d4-a716-446655440002',
        qr_code: 'LOC-HQ-IT-02',
        code: 'HQ-IT-02',
        name: 'Head Office IT Support',
        site: 'Quezon City HQ',
        building: 'Main Tower',
        floor: '2F',
        room: 'IT-212',
        notes: 'Staging area for repairs and device handoff.',
        is_active: true,
    },
    {
        id: '660e8400-e29b-41d4-a716-446655440003',
        qr_code: 'LOC-WH-REC-03',
        code: 'WH-REC-03',
        name: 'Warehouse A Receiving',
        site: 'North Logistics Park',
        building: 'Warehouse A',
        floor: 'Ground',
        room: 'Receiving Bay',
        notes: 'Receiving point for newly deployed system units.',
        is_active: true,
    },
    {
        id: '660e8400-e29b-41d4-a716-446655440004',
        qr_code: 'LOC-BR-SUP-04',
        code: 'BR-SUP-04',
        name: 'Branch Support Lab',
        site: 'Cebu Branch',
        building: 'Annex B',
        floor: '3F',
        room: 'Lab 3B',
        notes: 'Secondary support area for QA and user acceptance checks.',
        is_active: true,
    },
]

const seedUnits = [
    {
        id: '770e8400-e29b-41d4-a716-446655440001',
        device_name: 'Operations Control Unit A',
        qr_code: 'UNIT-HQ-001',
        status: 'active',
        location: 'Head Office NOC',
        description: 'Primary control unit used by the operations team.',
        created_by: '550e8400-e29b-41d4-a716-446655440001',
        model_type: 'Dell OptiPlex 7090',
        serial_number: 'DELL-OP7090-001-HQ',
        condition: 'good',
        notes: 'Recently maintained. All systems operational. Last service 2024-11-15.',
    },
    {
        id: '770e8400-e29b-41d4-a716-446655440002',
        device_name: 'Help Desk Unit B',
        qr_code: 'UNIT-HQ-002',
        status: 'maintenance',
        location: 'Head Office IT Support',
        description: 'Support desk unit scheduled for panel replacement.',
        created_by: '550e8400-e29b-41d4-a716-446655440002',
        model_type: 'HP Elitedesk 800 G6',
        serial_number: 'HP-ED800G6-002-IT',
        condition: 'fair',
        notes: 'Power supply showing signs of wear. Scheduled for replacement Q1 2025.',
    },
    {
        id: '770e8400-e29b-41d4-a716-446655440003',
        device_name: 'Warehouse Receiving Unit',
        qr_code: 'UNIT-WH-003',
        status: 'active',
        location: 'Warehouse A Receiving',
        description: 'Receiving bay unit used for intake verification.',
        created_by: '550e8400-e29b-41d4-a716-446655440004',
        model_type: 'Lenovo ThinkCentre M90',
        serial_number: 'LEN-TCM90-003-WH',
        condition: 'good',
        notes: 'GPU upgraded in 2024. Running smoothly. Next service due 2025-06.',
    },
]

const seedMonitors = [
    {
        id: '880e8400-e29b-41d4-a716-446655440001',
        device_name: 'NOC Dashboard Monitor 24in',
        qr_code: 'MON-HQ-001',
        status: 'active',
        description: 'Main display for live status dashboards.',
        created_by: '550e8400-e29b-41d4-a716-446655440001',
        linked_unit_id: '770e8400-e29b-41d4-a716-446655440001',
        model_type: 'Dell U2723DE 27in',
        serial_number: 'DELL-U2723DE-001',
        condition: 'good',
        notes: 'Primary dashboard display. Color calibrated monthly. HDMI and DP working.',
    },
    {
        id: '880e8400-e29b-41d4-a716-446655440002',
        device_name: 'NOC Backup Monitor 24in',
        qr_code: 'MON-HQ-002',
        status: 'active',
        description: 'Backup display for operations floor failover.',
        created_by: '550e8400-e29b-41d4-a716-446655440002',
        linked_unit_id: '770e8400-e29b-41d4-a716-446655440001',
        model_type: 'Dell U2720Q 27in',
        serial_number: 'DELL-U2720Q-002',
        condition: 'good',
        notes: 'Backup failover monitor. Tested weekly. Ready for immediate deployment.',
    },
    {
        id: '880e8400-e29b-41d4-a716-446655440003',
        device_name: 'Help Desk Monitor 27in',
        qr_code: 'MON-HQ-003',
        status: 'maintenance',
        description: 'Help desk display awaiting replacement panel.',
        created_by: '550e8400-e29b-41d4-a716-446655440005',
        linked_unit_id: '770e8400-e29b-41d4-a716-446655440002',
        model_type: 'BenQ EW2880U 28in',
        serial_number: 'BENQ-EW2880-003',
        condition: 'poor',
        notes: 'LCD panel flickering intermittently. Replacement panel ordered. ETA: 2025-01-20.',
    },
    {
        id: '880e8400-e29b-41d4-a716-446655440004',
        device_name: 'Receiving Bay Monitor 24in',
        qr_code: 'MON-WH-004',
        status: 'active',
        description: 'Logistics display mounted at the receiving bay.',
        created_by: '550e8400-e29b-41d4-a716-446655440004',
        linked_unit_id: '770e8400-e29b-41d4-a716-446655440003',
        model_type: 'LG 24UP550 24in',
        serial_number: 'LG-24UP550-004',
        condition: 'good',
        notes: 'Recently installed. USB-C connectivity working. Brightness sensor active.',
    },
]

const seedAssets = [
    {
        id: '990e8400-e29b-41d4-a716-446655440001',
        qr_code: 'AST-UNIT-001',
        type: 'unit',
        status: 'active',
        location: 'Head Office NOC',
        created_by: '550e8400-e29b-41d4-a716-446655440001',
        parent_id: null,
        model_type: 'Dell OptiPlex 7090',
        serial_number: 'DELL-OP7090-001-HQ',
        condition: 'good',
        notes: 'Primary NOC control system. All components verified.',
    },
    {
        id: '990e8400-e29b-41d4-a716-446655440002',
        qr_code: 'AST-UNIT-002',
        type: 'unit',
        status: 'active',
        location: 'Head Office IT Support',
        created_by: '550e8400-e29b-41d4-a716-446655440002',
        parent_id: null,
        model_type: 'HP Elitedesk 800 G6',
        serial_number: 'HP-ED800G6-002-IT',
        condition: 'fair',
        notes: 'Help desk support unit. Minor thermal issues detected.',
    },
    {
        id: '990e8400-e29b-41d4-a716-446655440003',
        qr_code: 'AST-UNIT-003',
        type: 'unit',
        status: 'active',
        location: 'Warehouse A Receiving',
        created_by: '550e8400-e29b-41d4-a716-446655440004',
        parent_id: null,
        model_type: 'Lenovo ThinkCentre M90',
        serial_number: 'LEN-TCM90-003-WH',
        condition: 'good',
        notes: 'Warehouse receiving verification system. Fully operational.',
    },
    {
        id: '990e8400-e29b-41d4-a716-446655440004',
        qr_code: 'AST-MON-001',
        type: 'monitor',
        status: 'active',
        location: 'Head Office NOC',
        created_by: '550e8400-e29b-41d4-a716-446655440005',
        parent_id: '990e8400-e29b-41d4-a716-446655440001',
        model_type: 'Dell U2723DE 27in',
        serial_number: 'DELL-U2723DE-001',
        condition: 'good',
        notes: 'Primary display. Connected via DP. Color accurate.',
    },
    {
        id: '990e8400-e29b-41d4-a716-446655440005',
        qr_code: 'AST-MON-002',
        type: 'monitor',
        status: 'repair',
        location: 'Head Office IT Support',
        created_by: '550e8400-e29b-41d4-a716-446655440004',
        parent_id: '990e8400-e29b-41d4-a716-446655440002',
        model_type: 'BenQ EW2880U 28in',
        serial_number: 'BENQ-EW2880-003',
        condition: 'poor',
        notes: 'Panel repair in progress. Expected back in service by 2025-01-20.',
    },
    {
        id: '990e8400-e29b-41d4-a716-446655440006',
        qr_code: 'AST-MON-003',
        type: 'monitor',
        status: 'active',
        location: 'Warehouse A Receiving',
        created_by: '550e8400-e29b-41d4-a716-446655440002',
        parent_id: '990e8400-e29b-41d4-a716-446655440003',
        model_type: 'LG 24UP550 24in',
        serial_number: 'LG-24UP550-004',
        condition: 'good',
        notes: 'Recently installed. All sensors and connectivity working.',
    },
]

const seedMonitorAssignments = [
    {
        id: 'aa0e8400-e29b-41d4-a716-446655440001',
        monitor_id: '990e8400-e29b-41d4-a716-446655440004',
        unit_id: '990e8400-e29b-41d4-a716-446655440001',
        assigned_by: '550e8400-e29b-41d4-a716-446655440002',
        is_current: true,
        reason: 'Initial deployment at the operations floor.',
    },
    {
        id: 'aa0e8400-e29b-41d4-a716-446655440002',
        monitor_id: '990e8400-e29b-41d4-a716-446655440005',
        unit_id: '990e8400-e29b-41d4-a716-446655440002',
        assigned_by: '550e8400-e29b-41d4-a716-446655440004',
        is_current: false,
        unassigned_at: '2025-03-18T08:30:00.000Z',
        reason: 'Panel replacement and refresh cycle.',
    },
    {
        id: 'aa0e8400-e29b-41d4-a716-446655440003',
        monitor_id: '990e8400-e29b-41d4-a716-446655440006',
        unit_id: '990e8400-e29b-41d4-a716-446655440003',
        assigned_by: '550e8400-e29b-41d4-a716-446655440002',
        is_current: true,
        reason: 'Warehouse deployment completed.',
    },
]

const seedAssetMovements = [
    {
        id: 'bb0e8400-e29b-41d4-a716-446655440001',
        asset_id: '990e8400-e29b-41d4-a716-446655440002',
        from_location_id: '660e8400-e29b-41d4-a716-446655440001',
        to_location_id: '660e8400-e29b-41d4-a716-446655440002',
        moved_by: '550e8400-e29b-41d4-a716-446655440005',
        source: 'web',
        notes: 'Moved help desk unit to support lab for scheduled service.',
    },
    {
        id: 'bb0e8400-e29b-41d4-a716-446655440002',
        asset_id: '990e8400-e29b-41d4-a716-446655440004',
        from_location_id: '660e8400-e29b-41d4-a716-446655440002',
        to_location_id: '660e8400-e29b-41d4-a716-446655440001',
        moved_by: '550e8400-e29b-41d4-a716-446655440004',
        source: 'web',
        notes: 'Relocated operations monitor back to the NOC desk.',
    },
    {
        id: 'bb0e8400-e29b-41d4-a716-446655440003',
        asset_id: '990e8400-e29b-41d4-a716-446655440006',
        from_location_id: null,
        to_location_id: '660e8400-e29b-41d4-a716-446655440003',
        moved_by: '550e8400-e29b-41d4-a716-446655440002',
        source: 'web',
        notes: 'Initial deployment to the warehouse receiving bay.',
    },
]

const seedAssetStatusHistory = [
    {
        id: 'cc0e8400-e29b-41d4-a716-446655440001',
        asset_id: '990e8400-e29b-41d4-a716-446655440005',
        old_status: 'active',
        new_status: 'repair',
        changed_by: '550e8400-e29b-41d4-a716-446655440004',
        source: 'web',
        reason: 'Panel flicker reported during morning checks.',
    },
    {
        id: 'cc0e8400-e29b-41d4-a716-446655440002',
        asset_id: '990e8400-e29b-41d4-a716-446655440002',
        old_status: 'active',
        new_status: 'active',
        changed_by: '550e8400-e29b-41d4-a716-446655440005',
        source: 'web',
        reason: 'Verification after relocation and cable management.',
    },
    {
        id: 'cc0e8400-e29b-41d4-a716-446655440003',
        asset_id: '990e8400-e29b-41d4-a716-446655440006',
        old_status: 'inactive',
        new_status: 'active',
        changed_by: '550e8400-e29b-41d4-a716-446655440002',
        source: 'iot',
        reason: 'Warehouse unit brought online after staging.',
    },
]

const seedActivityLogs = [
    {
        id: 'dd0e8400-e29b-41d4-a716-446655440001',
        asset_id: '990e8400-e29b-41d4-a716-446655440004',
        action: 'swap',
        old_location: 'Head Office IT Support',
        new_location: 'Head Office NOC',
        old_status: 'active',
        new_status: 'active',
        user_id: '550e8400-e29b-41d4-a716-446655440002',
    },
    {
        id: 'dd0e8400-e29b-41d4-a716-446655440002',
        asset_id: '990e8400-e29b-41d4-a716-446655440002',
        action: 'move',
        old_location: 'Head Office NOC',
        new_location: 'Head Office IT Support',
        old_status: 'active',
        new_status: 'active',
        user_id: '550e8400-e29b-41d4-a716-446655440005',
    },
    {
        id: 'dd0e8400-e29b-41d4-a716-446655440003',
        asset_id: '990e8400-e29b-41d4-a716-446655440005',
        action: 'repair',
        old_location: 'Head Office IT Support',
        new_location: 'Head Office IT Support',
        old_status: 'active',
        new_status: 'repair',
        user_id: '550e8400-e29b-41d4-a716-446655440004',
    },
    {
        id: 'dd0e8400-e29b-41d4-a716-446655440004',
        asset_id: '990e8400-e29b-41d4-a716-446655440006',
        action: 'update',
        old_location: 'Warehouse A Receiving',
        new_location: 'Warehouse A Receiving',
        old_status: 'inactive',
        new_status: 'active',
        user_id: '550e8400-e29b-41d4-a716-446655440002',
    },
    {
        id: 'dd0e8400-e29b-41d4-a716-446655440005',
        asset_id: '990e8400-e29b-41d4-a716-446655440001',
        action: 'move',
        old_location: 'Head Office NOC',
        new_location: 'Head Office NOC',
        old_status: 'active',
        new_status: 'active',
        user_id: '550e8400-e29b-41d4-a716-446655440001',
    },
]

function mapById(items) {
    return new Map(items.map((item) => [item.id, item]))
}

async function seed() {
    try {
        console.log('Starting database seed...')

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize()
            console.log('Database connected')
        }

        await AppDataSource.synchronize()

        const profileRepo = AppDataSource.getRepository(Profile)
        const locationRepo = AppDataSource.getRepository(Location)
        const unitRepo = AppDataSource.getRepository(Unit)
        const monitorRepo = AppDataSource.getRepository(Monitor)
        const assetRepo = AppDataSource.getRepository(Asset)
        const monitorAssignmentRepo = AppDataSource.getRepository(MonitorAssignment)
        const assetMovementRepo = AppDataSource.getRepository(AssetMovement)
        const assetStatusHistoryRepo = AppDataSource.getRepository(AssetStatusHistory)
        const activityLogRepo = AppDataSource.getRepository(ActivityLog)

        await AppDataSource.transaction(async (manager) => {
            await manager.query(
                'TRUNCATE TABLE activity_logs, asset_status_history, asset_movements, monitor_assignments, monitors, assets, units, locations, profiles RESTART IDENTITY CASCADE',
            )

            const profilesWithHashes = []
            for (const user of seedUsers) {
                profilesWithHashes.push({
                    id: user.id,
                    full_name: user.full_name,
                    email: user.email,
                    password_hash: await hashPassword(user.password),
                    role: user.role,
                    is_active: user.is_active,
                })
            }

            await manager.getRepository(Profile).save(profilesWithHashes)

            const profileMap = mapById(profilesWithHashes)
            const savedLocations = await manager.getRepository(Location).save(seedLocations)

            const savedUnits = await manager.getRepository(Unit).save(
                seedUnits.map((unit) => ({
                    ...unit,
                    creator: profileMap.get(unit.created_by),
                })),
            )
            const unitMap = mapById(savedUnits)

            const savedMonitors = await manager.getRepository(Monitor).save(
                seedMonitors.map((monitor) => ({
                    ...monitor,
                    creator: profileMap.get(monitor.created_by),
                    linkedUnit: unitMap.get(monitor.linked_unit_id),
                })),
            )

            const savedUnitAssets = await manager.getRepository(Asset).save(
                seedAssets
                    .filter((asset) => asset.type === 'unit')
                    .map((asset) => ({
                        ...asset,
                        creator: profileMap.get(asset.created_by),
                    })),
            )
            const unitAssetMap = mapById(savedUnitAssets)

            const savedMonitorAssets = await manager.getRepository(Asset).save(
                seedAssets
                    .filter((asset) => asset.type === 'monitor')
                    .map((asset) => ({
                        ...asset,
                        creator: profileMap.get(asset.created_by),
                        parent: asset.parent_id ? unitAssetMap.get(asset.parent_id) : null,
                    })),
            )

            const assetMap = mapById([...savedUnitAssets, ...savedMonitorAssets])

            await manager.getRepository(MonitorAssignment).save(
                seedMonitorAssignments.map((assignment) => ({
                    id: assignment.id,
                    assigned_by: assignment.assigned_by,
                    unassigned_at: assignment.unassigned_at || null,
                    reason: assignment.reason,
                    is_current: assignment.is_current,
                    monitor: assetMap.get(assignment.monitor_id),
                    unit: assetMap.get(assignment.unit_id),
                })),
            )

            await manager.getRepository(AssetMovement).save(
                seedAssetMovements.map((movement) => ({
                    id: movement.id,
                    asset: assetMap.get(movement.asset_id),
                    from_location_id: movement.from_location_id,
                    to_location_id: movement.to_location_id,
                    moved_by: movement.moved_by,
                    source: movement.source,
                    notes: movement.notes,
                    user: profileMap.get(movement.moved_by),
                })),
            )

            await manager.getRepository(AssetStatusHistory).save(
                seedAssetStatusHistory.map((history) => ({
                    id: history.id,
                    asset: assetMap.get(history.asset_id),
                    old_status: history.old_status,
                    new_status: history.new_status,
                    changed_by: history.changed_by,
                    source: history.source,
                    reason: history.reason,
                    user: profileMap.get(history.changed_by),
                })),
            )

            await manager.getRepository(ActivityLog).save(
                seedActivityLogs.map((log) => ({
                    id: log.id,
                    asset: assetMap.get(log.asset_id),
                    action: log.action,
                    old_location: log.old_location,
                    new_location: log.new_location,
                    old_status: log.old_status,
                    new_status: log.new_status,
                    user_id: log.user_id,
                    user: profileMap.get(log.user_id),
                })),
            )

            console.log(`Seeded ${profilesWithHashes.length} profiles`)
            console.log(`Seeded ${savedLocations.length} locations`)
            console.log(`Seeded ${savedUnits.length} units`)
            console.log(`Seeded ${savedMonitors.length} monitors`)
            console.log(`Seeded ${savedUnitAssets.length + savedMonitorAssets.length} assets`)
            console.log(`Seeded ${seedMonitorAssignments.length} monitor assignments`)
            console.log(`Seeded ${seedAssetMovements.length} asset movements`)
            console.log(`Seeded ${seedAssetStatusHistory.length} asset status history rows`)
            console.log(`Seeded ${seedActivityLogs.length} activity logs`)

            console.log('Sample credentials:')
            console.log('  amara.santos@infini-stock.com / admin123')
            console.log('  james.carter@infini-stock.com / manager123')
            console.log('  miguel.torres@infini-stock.com / tech123')
            console.log('  john.reyes@infini-stock.com / staff123')
            console.log('  david.brooks@infini-stock.com / viewer123')

            console.log('Primary sample locations:')
            savedLocations.forEach((location) => {
                console.log(`  ${location.code}: ${location.name}`)
            })

            console.log('Seeded asset QR codes:')
                ;[...savedUnitAssets, ...savedMonitorAssets].forEach((asset) => {
                    console.log(`  ${asset.qr_code} (${asset.type})`)
                })
        })

        process.exit(0)
    } catch (error) {
        console.error('Seed failed:', error)
        process.exit(1)
    }
}

seed()
