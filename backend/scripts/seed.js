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
const Asset = require('../src/models/Asset')
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

const seedAssets = [
    // Original units and monitors
    {
        id: '990e8400-e29b-41d4-a716-446655440001',
        qr_code: 'UNIT-HQ-001',
        type: 'unit',
        status: 'active',
        location: 'Head Office NOC',
        created_by: '550e8400-e29b-41d4-a716-446655440001',
        description: 'Primary control unit used by the operations team.',
        model_type: 'Dell OptiPlex 7090',
        serial_number: 'DELL-OP7090-001-HQ',
        condition: 'good',
        notes: 'Recently maintained. All systems operational. Last service 2024-11-15.',
    },
    {
        id: '990e8400-e29b-41d4-a716-446655440002',
        qr_code: 'UNIT-HQ-002',
        type: 'unit',
        status: 'maintenance',
        location: 'Head Office IT Support',
        created_by: '550e8400-e29b-41d4-a716-446655440002',
        description: 'Support desk unit scheduled for panel replacement.',
        model_type: 'HP Elitedesk 800 G6',
        serial_number: 'HP-ED800G6-002-IT',
        condition: 'fair',
        notes: 'Power supply showing signs of wear. Scheduled for replacement Q1 2025.',
    },
    {
        id: '990e8400-e29b-41d4-a716-446655440003',
        qr_code: 'UNIT-WH-003',
        type: 'unit',
        status: 'active',
        location: 'Warehouse A Receiving',
        created_by: '550e8400-e29b-41d4-a716-446655440004',
        description: 'Receiving bay unit used for intake verification.',
        model_type: 'Lenovo ThinkCentre M90',
        serial_number: 'LEN-TCM90-003-WH',
        condition: 'good',
        notes: 'GPU upgraded in 2024. Running smoothly. Next service due 2025-06.',
    },
    {
        id: '990e8400-e29b-41d4-a716-446655440004',
        qr_code: 'MON-HQ-001',
        type: 'monitor',
        status: 'active',
        location: 'Head Office NOC',
        created_by: '550e8400-e29b-41d4-a716-446655440001',
        description: 'Main display for live status dashboards.',
        model_type: 'Dell U2723DE 27in',
        serial_number: 'DELL-U2723DE-001',
        condition: 'good',
        notes: 'Primary dashboard display. Color calibrated monthly. HDMI and DP working.',
        linked_unit_id: '990e8400-e29b-41d4-a716-446655440001',
    },
    {
        id: '990e8400-e29b-41d4-a716-446655440005',
        qr_code: 'MON-HQ-002',
        type: 'monitor',
        status: 'active',
        location: 'Head Office NOC',
        created_by: '550e8400-e29b-41d4-a716-446655440002',
        description: 'Backup display for operations floor failover.',
        model_type: 'Dell U2720Q 27in',
        serial_number: 'DELL-U2720Q-002',
        condition: 'good',
        notes: 'Backup failover monitor. Tested weekly. Ready for immediate deployment.',
        linked_unit_id: '990e8400-e29b-41d4-a716-446655440001',
    },
    {
        id: '990e8400-e29b-41d4-a716-446655440006',
        qr_code: 'MON-HQ-003',
        type: 'monitor',
        status: 'maintenance',
        location: 'Head Office IT Support',
        created_by: '550e8400-e29b-41d4-a716-446655440005',
        description: 'Help desk display awaiting replacement panel.',
        model_type: 'BenQ EW2880U 28in',
        serial_number: 'BENQ-EW2880-003',
        condition: 'poor',
        notes: 'LCD panel flickering intermittently. Replacement panel ordered. ETA: 2025-01-20.',
        linked_unit_id: '990e8400-e29b-41d4-a716-446655440002',
    },
    {
        id: '990e8400-e29b-41d4-a716-446655440007',
        qr_code: 'MON-WH-004',
        type: 'monitor',
        status: 'active',
        location: 'Warehouse A Receiving',
        created_by: '550e8400-e29b-41d4-a716-446655440004',
        description: 'Logistics display mounted at the receiving bay.',
        model_type: 'LG 24UP550 24in',
        serial_number: 'LG-24UP550-004',
        condition: 'good',
        notes: 'Recently installed. USB-C connectivity working. Brightness sensor active.',
        linked_unit_id: '990e8400-e29b-41d4-a716-446655440003',
    },
    // Additional units from reseed-devices
    {
        id: '770e8400-e29b-41d4-a716-446655440001',
        qr_code: 'UNIT-SR-CTRL-001',
        type: 'unit',
        status: 'active',
        location: 'Head Office NOC',
        description: 'Primary control unit for server room monitoring and management.',
        created_by: '550e8400-e29b-41d4-a716-446655440001',
        model_type: 'Dell PowerEdge R750',
        serial_number: 'DL-PE750-ALPHA-2024',
        condition: 'good',
        notes: 'Recently deployed in December 2024. All systems operational. GPU accelerated.',
    },
    {
        id: '770e8400-e29b-41d4-a716-446655440002',
        qr_code: 'UNIT-IT-WS-002',
        type: 'unit',
        status: 'active',
        location: 'Head Office IT Support',
        description: 'Workstation for technical support and troubleshooting operations.',
        created_by: '550e8400-e29b-41d4-a716-446655440002',
        model_type: 'HP ZBook Fury 16',
        serial_number: 'HP-ZBF16-BETA-2024',
        condition: 'good',
        notes: 'High-performance workstation. SSD upgraded to 2TB. Thermal management excellent.',
    },
    {
        id: '770e8400-e29b-41d4-a716-446655440003',
        qr_code: 'UNIT-WH-LOG-003',
        type: 'unit',
        status: 'active',
        location: 'Warehouse A Receiving',
        description: 'Terminal unit for inventory tracking and logistics coordination.',
        created_by: '550e8400-e29b-41d4-a716-446655440004',
        model_type: 'Lenovo ThinkCentre M75q',
        serial_number: 'LEN-TCM75Q-GAMMA-24',
        condition: 'excellent',
        notes: 'Recently purchased. Compact form factor. Network adapter upgraded to 10GbE.',
    },
    {
        id: '770e8400-e29b-41d4-a716-446655440004',
        qr_code: 'UNIT-BR-DASH-004',
        type: 'unit',
        status: 'maintenance',
        location: 'Branch Support Lab',
        description: 'Dashboard display unit for branch operations monitoring.',
        created_by: '550e8400-e29b-41d4-a716-446655440003',
        model_type: 'ASUS VivoPC M32CD',
        serial_number: 'ASS-VPC32CD-DELTA-23',
        condition: 'fair',
        notes: 'Undergoing RAM upgrade from 16GB to 32GB. Expected completion Q1 2025.',
    },
    {
        id: '770e8400-e29b-41d4-a716-446655440005',
        qr_code: 'UNIT-CC-WS-005',
        type: 'unit',
        status: 'active',
        location: 'Head Office IT Support',
        description: 'High-performance workstation for content creation and design tasks.',
        created_by: '550e8400-e29b-41d4-a716-446655440005',
        model_type: 'Mac Studio M2 Max',
        serial_number: 'MAC-STD-M2-EPSILON',
        condition: 'excellent',
        notes: '64GB unified memory. GPU accelerated rendering. Recently received security update.',
    },
    // Additional monitors from reseed-devices
    {
        id: '880e8400-e29b-41d4-a716-446655440001',
        qr_code: 'MON-SR-4K-001',
        type: 'monitor',
        status: 'active',
        location: 'Head Office NOC',
        description: 'High-resolution 4K display for detailed system monitoring.',
        created_by: '550e8400-e29b-41d4-a716-446655440001',
        linked_unit_id: '770e8400-e29b-41d4-a716-446655440001',
        model_type: 'LG UltraFine 32UP550 32in 4K',
        serial_number: 'LG-UF32-SR-001',
        condition: 'excellent',
        notes: 'Calibrated for color accuracy. USB-C connectivity with 90W power delivery.',
    },
    {
        id: '880e8400-e29b-41d4-a716-446655440002',
        qr_code: 'MON-SR-2K-002',
        type: 'monitor',
        status: 'active',
        location: 'Head Office NOC',
        description: 'Secondary backup display for failover scenarios.',
        created_by: '550e8400-e29b-41d4-a716-446655440002',
        linked_unit_id: '770e8400-e29b-41d4-a716-446655440001',
        model_type: 'Dell U2723DE 27in 2K',
        serial_number: 'DL-U2723DE-SR-02',
        condition: 'good',
        notes: 'IPS panel. Tested weekly. Ready for immediate failover deployment.',
    },
    {
        id: '880e8400-e29b-41d4-a716-446655440003',
        qr_code: 'MON-IT-WS-003',
        type: 'monitor',
        status: 'active',
        location: 'Head Office IT Support',
        description: 'Support workstation display for diagnostics and troubleshooting.',
        created_by: '550e8400-e29b-41d4-a716-446655440004',
        linked_unit_id: '770e8400-e29b-41d4-a716-446655440002',
        model_type: 'BenQ EW2880U 28in',
        serial_number: 'BQ-EW2880-IT-03',
        condition: 'good',
        notes: 'USB-C dock integrated. 60W power delivery. Dual connectivity via DP and HDMI.',
    },
    {
        id: '880e8400-e29b-41d4-a716-446655440004',
        qr_code: 'MON-WH-LCD-004',
        type: 'monitor',
        status: 'active',
        location: 'Warehouse A Receiving',
        description: 'Rugged display for warehouse logistics tracking.',
        created_by: '550e8400-e29b-41d4-a716-446655440003',
        linked_unit_id: '770e8400-e29b-41d4-a716-446655440003',
        model_type: 'Panasonic BTS ToughVIEW 24in',
        serial_number: 'PN-TV24-WH-04',
        condition: 'excellent',
        notes: 'Industrial grade. IP65 rated for dust/water resistance. Recently installed.',
    },
    {
        id: '880e8400-e29b-41d4-a716-446655440005',
        qr_code: 'MON-BR-OLED-005',
        type: 'monitor',
        status: 'maintenance',
        location: 'Branch Support Lab',
        description: 'Premium OLED display for branch operations dashboard.',
        created_by: '550e8400-e29b-41d4-a716-446655440005',
        linked_unit_id: '770e8400-e29b-41d4-a716-446655440004',
        model_type: 'LG OLED evo 27in',
        serial_number: 'LG-OLED27-BR-05',
        condition: 'good',
        notes: 'Scheduled for color recalibration in February 2025. Picture quality excellent.',
    },
    {
        id: '880e8400-e29b-41d4-a716-446655440006',
        qr_code: 'MON-CC-PRI-006',
        type: 'monitor',
        status: 'active',
        location: 'Head Office IT Support',
        description: 'Color-critical monitor for content creation tasks.',
        created_by: '550e8400-e29b-41d4-a716-446655440006',
        linked_unit_id: '770e8400-e29b-41d4-a716-446655440005',
        model_type: 'Eizo ColorNavigator CG279X 27in',
        serial_number: 'EZ-CG279X-CC-06',
        condition: 'excellent',
        notes: 'Professional color space (Adobe RGB). Hardware calibrated weekly. X-Rite i1 profiled.',
    },
    {
        id: '880e8400-e29b-41d4-a716-446655440007',
        qr_code: 'MON-CC-SEC-007',
        type: 'monitor',
        status: 'active',
        location: 'Head Office IT Support',
        description: 'Secondary reference monitor for color verification.',
        created_by: '550e8400-e29b-41d4-a716-446655440007',
        linked_unit_id: '770e8400-e29b-41d4-a716-446655440005',
        model_type: 'ASUS ProArt PA278QV 27in',
        serial_number: 'AS-PA278-CC-07',
        condition: 'good',
        notes: 'Factory calibrated. DP 1.2 certified. Thunderbolt 3 connectivity available.',
    },
]

const seedActivityLogs = [
    {
        id: 'dd0e8400-e29b-41d4-a716-446655440001',
        asset_id: '990e8400-e29b-41d4-a716-446655440004',
        action: 'created',
        user_id: '550e8400-e29b-41d4-a716-446655440001',
        description: 'Monitor created and linked to Operations Control Unit A',
        item_name: 'MON-HQ-001',
        item_qr: 'MON-HQ-001',
    },
    {
        id: 'dd0e8400-e29b-41d4-a716-446655440002',
        asset_id: '990e8400-e29b-41d4-a716-446655440005',
        action: 'created',
        user_id: '550e8400-e29b-41d4-a716-446655440002',
        description: 'Backup monitor created and linked to Operations Control Unit A',
        item_name: 'MON-HQ-002',
        item_qr: 'MON-HQ-002',
    },
    {
        id: 'dd0e8400-e29b-41d4-a716-446655440003',
        asset_id: '990e8400-e29b-41d4-a716-446655440006',
        action: 'created',
        user_id: '550e8400-e29b-41d4-a716-446655440005',
        description: 'Help desk monitor created (currently in maintenance)',
        item_name: 'MON-HQ-003',
        item_qr: 'MON-HQ-003',
    },
    // Activity logs from reseed-devices.js
    {
        id: 'aa0e8400-e29b-41d4-a716-446655440001',
        action: 'created',
        asset_id: '770e8400-e29b-41d4-a716-446655440001',
        user_id: '550e8400-e29b-41d4-a716-446655440001',
        description: 'Created unit "Server Room Control Unit Alpha" (UNIT-SR-CTRL-001) with status: active at Head Office NOC',
        item_name: 'UNIT-SR-CTRL-001',
        item_qr: 'UNIT-SR-CTRL-001',
    },
    {
        id: 'aa0e8400-e29b-41d4-a716-446655440002',
        action: 'created',
        asset_id: '770e8400-e29b-41d4-a716-446655440002',
        user_id: '550e8400-e29b-41d4-a716-446655440002',
        description: 'Created unit "Workstation Beta - IT Support" (UNIT-IT-WS-002) with status: active at Head Office IT Support',
        item_name: 'UNIT-IT-WS-002',
        item_qr: 'UNIT-IT-WS-002',
    },
    {
        id: 'aa0e8400-e29b-41d4-a716-446655440003',
        action: 'created',
        asset_id: '770e8400-e29b-41d4-a716-446655440003',
        user_id: '550e8400-e29b-41d4-a716-446655440004',
        description: 'Created unit "Warehouse Logistics Terminal Gamma" (UNIT-WH-LOG-003) with status: active at Warehouse A Receiving',
        item_name: 'UNIT-WH-LOG-003',
        item_qr: 'UNIT-WH-LOG-003',
    },
    {
        id: 'aa0e8400-e29b-41d4-a716-446655440004',
        action: 'created',
        asset_id: '770e8400-e29b-41d4-a716-446655440004',
        user_id: '550e8400-e29b-41d4-a716-446655440003',
        description: 'Created unit "Branch Dashboard Unit Delta" (UNIT-BR-DASH-004) with status: maintenance at Branch Support Lab',
        item_name: 'UNIT-BR-DASH-004',
        item_qr: 'UNIT-BR-DASH-004',
    },
    {
        id: 'aa0e8400-e29b-41d4-a716-446655440005',
        action: 'created',
        asset_id: '770e8400-e29b-41d4-a716-446655440005',
        user_id: '550e8400-e29b-41d4-a716-446655440005',
        description: 'Created unit "Content Creation Workstation Epsilon" (UNIT-CC-WS-005) with status: active at Head Office IT Support',
        item_name: 'UNIT-CC-WS-005',
        item_qr: 'UNIT-CC-WS-005',
    },
    {
        id: 'bb0e8400-e29b-41d4-a716-446655440001',
        action: 'created',
        asset_id: '880e8400-e29b-41d4-a716-446655440001',
        user_id: '550e8400-e29b-41d4-a716-446655440001',
        description: 'Created monitor "4K Primary Monitor - Server Room" (MON-SR-4K-001) linked to Server Room Control Unit Alpha',
        item_name: 'MON-SR-4K-001',
        item_qr: 'MON-SR-4K-001',
    },
    {
        id: 'bb0e8400-e29b-41d4-a716-446655440002',
        action: 'created',
        asset_id: '880e8400-e29b-41d4-a716-446655440002',
        user_id: '550e8400-e29b-41d4-a716-446655440002',
        description: 'Created monitor "Secondary Monitor - Server Room Backup" (MON-SR-2K-002) linked to Server Room Control Unit Alpha',
        item_name: 'MON-SR-2K-002',
        item_qr: 'MON-SR-2K-002',
    },
    {
        id: 'bb0e8400-e29b-41d4-a716-446655440003',
        action: 'created',
        asset_id: '880e8400-e29b-41d4-a716-446655440003',
        user_id: '550e8400-e29b-41d4-a716-446655440004',
        description: 'Created monitor "IT Support Monitor - Technical Workstation" (MON-IT-WS-003) linked to Workstation Beta',
        item_name: 'MON-IT-WS-003',
        item_qr: 'MON-IT-WS-003',
    },
    {
        id: 'bb0e8400-e29b-41d4-a716-446655440004',
        action: 'created',
        asset_id: '880e8400-e29b-41d4-a716-446655440004',
        user_id: '550e8400-e29b-41d4-a716-446655440003',
        description: 'Created monitor "Warehouse Display Terminal" (MON-WH-LCD-004) linked to Warehouse Logistics Terminal Gamma',
        item_name: 'MON-WH-LCD-004',
        item_qr: 'MON-WH-LCD-004',
    },
    {
        id: 'bb0e8400-e29b-41d4-a716-446655440005',
        action: 'created',
        asset_id: '880e8400-e29b-41d4-a716-446655440005',
        user_id: '550e8400-e29b-41d4-a716-446655440005',
        description: 'Created monitor "Branch Dashboard Display" (MON-BR-OLED-005) linked to Branch Dashboard Unit Delta',
        item_name: 'MON-BR-OLED-005',
        item_qr: 'MON-BR-OLED-005',
    },
    {
        id: 'bb0e8400-e29b-41d4-a716-446655440006',
        action: 'created',
        asset_id: '880e8400-e29b-41d4-a716-446655440006',
        user_id: '550e8400-e29b-41d4-a716-446655440006',
        description: 'Created monitor "Creative Studio Monitor - Primary" (MON-CC-PRI-006) linked to Content Creation Workstation Epsilon',
        item_name: 'MON-CC-PRI-006',
        item_qr: 'MON-CC-PRI-006',
    },
    {
        id: 'bb0e8400-e29b-41d4-a716-446655440007',
        action: 'created',
        asset_id: '880e8400-e29b-41d4-a716-446655440007',
        user_id: '550e8400-e29b-41d4-a716-446655440007',
        description: 'Created monitor "Creative Studio Monitor - Secondary" (MON-CC-SEC-007) linked to Content Creation Workstation Epsilon',
        item_name: 'MON-CC-SEC-007',
        item_qr: 'MON-CC-SEC-007',
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
        const assetRepo = AppDataSource.getRepository(Asset)
        const activityLogRepo = AppDataSource.getRepository(ActivityLog)

        await AppDataSource.transaction(async (manager) => {
            await manager.query(
                'TRUNCATE TABLE activity_logs, assets, locations, profiles RESTART IDENTITY CASCADE',
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

            const savedAssets = await manager.getRepository(Asset).save(
                seedAssets.map((asset) => ({
                    ...asset,
                    creator: profileMap.get(asset.created_by),
                })),
            )

            await manager.getRepository(ActivityLog).save(
                seedActivityLogs.map((log) => ({
                    ...log,
                    user: profileMap.get(log.user_id),
                })),
            )

            console.log(`✓ Seeded ${profilesWithHashes.length} profiles`)
            console.log(`✓ Seeded ${savedLocations.length} locations`)
            console.log(`✓ Seeded ${savedAssets.length} assets (units + monitors)`)
            console.log(`✓ Seeded ${seedActivityLogs.length} activity logs`)

            console.log('\nSample credentials:')
            console.log('  amara.santos@infini-stock.com / admin123')
            console.log('  james.carter@infini-stock.com / manager123')
            console.log('  miguel.torres@infini-stock.com / tech123')
            console.log('  john.reyes@infini-stock.com / staff123')
            console.log('  david.brooks@infini-stock.com / viewer123')

            console.log('\nPrimary locations:')
            savedLocations.forEach((location) => {
                console.log(`  ${location.code}: ${location.name}`)
            })

            console.log('\nSeeded assets:')
            savedAssets.forEach((asset) => {
                const type = asset.type === 'unit' ? 'UNIT' : 'MONITOR'
                const linked = asset.linked_unit_id ? ` → linked to unit` : ''
                console.log(`  ${asset.qr_code} [${type}] ${asset.status}${linked}`)
            })
        })

        process.exit(0)
    } catch (error) {
        console.error('Seed failed:', error)
        process.exit(1)
    }
}

seed()
