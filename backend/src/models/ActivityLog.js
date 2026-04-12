const { EntitySchema } = require('typeorm')

module.exports = new EntitySchema({
    name: 'ActivityLog',
    tableName: 'activity_logs',
    columns: {
        id: {
            type: 'uuid',
            primary: true,
            generated: 'uuid',
        },
        action: {
            type: 'varchar',
            length: 30,
            nullable: false,
        },
        old_location: {
            type: 'text',
            nullable: true,
        },
        new_location: {
            type: 'text',
            nullable: true,
        },
        old_status: {
            type: 'varchar',
            length: 20,
            nullable: true,
        },
        new_status: {
            type: 'varchar',
            length: 20,
            nullable: true,
        },
        description: {
            type: 'text',
            nullable: true,
        },
        user_id: {
            type: 'uuid',
            nullable: false,
        },
        asset_id: {
            type: 'uuid',
            nullable: true,
        },
        monitor_id: {
            type: 'uuid',
            nullable: true,
        },
        unit_id: {
            type: 'uuid',
            nullable: true,
        },
        timestamp: {
            type: 'timestamp',
            createDate: true,
            update: false,
        },
    },
    relations: {
        asset: {
            type: 'many-to-one',
            target: 'Asset',
            joinColumn: { name: 'asset_id' },
            nullable: true,
            onDelete: 'CASCADE',
        },
        monitor: {
            type: 'many-to-one',
            target: 'Monitor',
            joinColumn: { name: 'monitor_id' },
            nullable: true,
            onDelete: 'CASCADE',
        },
        unit: {
            type: 'many-to-one',
            target: 'Unit',
            joinColumn: { name: 'unit_id' },
            nullable: true,
            onDelete: 'CASCADE',
        },
        user: {
            type: 'many-to-one',
            target: 'Profile',
            joinColumn: { name: 'user_id' },
            nullable: false,
            onDelete: 'RESTRICT',
        },
    },
})
