/**
 * Database Seed Script - Infini-Stock
 * Usage: node scripts/seed.js
 *
 * Creates test users for all 5 roles:
 * - 1 Admin
 * - 2 Managers
 * - 2 Technicians
 * - 2 Staff
 * - 2 Viewers
 */

require('dotenv').config()
require('reflect-metadata')

const { AppDataSource } = require('../src/config/dataSource')
const Profile = require('../src/models/Profile')
const { hashPassword } = require('../src/utils/password')

const seedUsers = [
    // Admin (1)
    {
        id: '550e8400-e29b-41d4-a716-446655440001',
        full_name: 'Admin User',
        email: 'admin@infocom.com',
        password: 'admin123',
        role: 'admin',
        is_active: true,
    },

    // Manager (2)
    {
        id: '550e8400-e29b-41d4-a716-446655440002',
        full_name: 'James Manager',
        email: 'james.manager@infocom.com',
        password: 'manager123',
        role: 'manager',
        is_active: true,
    },
    {
        id: '550e8400-e29b-41d4-a716-446655440003',
        full_name: 'Sarah Manager',
        email: 'sarah.manager@infocom.com',
        password: 'manager123',
        role: 'manager',
        is_active: true,
    },

    // Technician (2)
    {
        id: '550e8400-e29b-41d4-a716-446655440004',
        full_name: 'Mike Technician',
        email: 'mike.tech@infocom.com',
        password: 'tech123',
        role: 'technician',
        is_active: true,
    },
    {
        id: '550e8400-e29b-41d4-a716-446655440005',
        full_name: 'Emma Technician',
        email: 'emma.tech@infocom.com',
        password: 'tech123',
        role: 'technician',
        is_active: true,
    },

    // Staff (2)
    {
        id: '550e8400-e29b-41d4-a716-446655440006',
        full_name: 'John Staff',
        email: 'john.staff@infocom.com',
        password: 'staff123',
        role: 'staff',
        is_active: true,
    },
    {
        id: '550e8400-e29b-41d4-a716-446655440007',
        full_name: 'Lisa Staff',
        email: 'lisa.staff@infocom.com',
        password: 'staff123',
        role: 'staff',
        is_active: true,
    },

    // Viewer (2)
    {
        id: '550e8400-e29b-41d4-a716-446655440008',
        full_name: 'David Viewer',
        email: 'david.viewer@infocom.com',
        password: 'viewer123',
        role: 'viewer',
        is_active: true,
    },
    {
        id: '550e8400-e29b-41d4-a716-446655440009',
        full_name: 'Rachel Viewer',
        email: 'rachel.viewer@infocom.com',
        password: 'viewer123',
        role: 'viewer',
        is_active: true,
    },
]

async function seed() {
    try {
        console.log('🌱 Starting database seed...')

        // Initialize database connection
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize()
            console.log('✅ Database connected')
        }

        const profileRepo = AppDataSource.getRepository(Profile)

        // Check for existing users
        const existingCount = await profileRepo.count()
        if (existingCount > 0) {
            console.log(`\n⚠️  Found ${existingCount} existing users`)
            console.log('   Clearing old data before reseeding...\n')
            // Delete all profiles by querying then removing
            const allUsers = await profileRepo.find()
            if (allUsers.length > 0) {
                await profileRepo.remove(allUsers)
            }
        }

        // Insert seed users
        let successCount = 0
        for (const user of seedUsers) {
            try {
                // Hash password
                const password_hash = await hashPassword(user.password)

                const profile = profileRepo.create({
                    id: user.id,
                    full_name: user.full_name,
                    email: user.email,
                    password_hash,
                    role: user.role,
                    is_active: user.is_active,
                })
                await profileRepo.save(profile)
                console.log(
                    `✅ Created ${user.role}: ${user.full_name} (${user.email})`
                )
                successCount++
            } catch (err) {
                if (err.code === '23505') {
                    console.log(`⚠️  Skipped ${user.email} (already exists)`)
                } else {
                    console.error(`❌ Error creating ${user.email}:`, err.message)
                }
            }
        }

        console.log(`\n📊 Seeding complete: ${successCount} users created`)

        // Display summary
        const roles = ['admin', 'manager', 'technician', 'staff', 'viewer']
        console.log('\n📋 Summary by role:')
        for (const role of roles) {
            const count = await profileRepo.count({ where: { role } })
            console.log(`   ${role}: ${count} user${count !== 1 ? 's' : ''}`)
        }

        console.log('\n🎯 Test Credentials:')
        console.log('   admin@infocom.com / admin123 (Admin)')
        console.log('   james.manager@infocom.com / manager123 (Manager)')
        console.log('   mike.tech@infocom.com / tech123 (Technician)')
        console.log('   john.staff@infocom.com / staff123 (Staff)')
        console.log('   david.viewer@infocom.com / viewer123 (Viewer)')

        process.exit(0)
    } catch (error) {
        console.error('❌ Seed failed:', error)
        process.exit(1)
    }
}

seed()
