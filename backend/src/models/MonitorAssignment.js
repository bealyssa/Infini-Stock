const { EntitySchema } = require('typeorm')

module.exports = new EntitySchema({
    name: 'MonitorAssignment',
    tableName: 'monitor_assignments',
    columns: {
        id: {
            type: 'uuid',
            primary: true,
            generated: 'uuid',
        },
        assigned_by: {
            type: 'uuid',
            nullable: false,
        },
        assigned_at: {
            type: 'timestamp',
            nullable: false,
            createDate: true,
            update: false,
        },
        unassigned_at: {
            type: 'timestamp',
            nullable: true,
        },
        reason: {
            type: 'text',
            nullable: true,
        },
        is_current: {
            type: 'boolean',
            nullable: false,
            default: true,
        },
    },
    relations: {
        monitor: {
            type: 'many-to-one',
            target: 'Asset',
            joinColumn: { name: 'monitor_id' },
            nullable: false,
            onDelete: 'CASCADE',
        },
        unit: {
            type: 'many-to-one',
            target: 'Asset',
            joinColumn: { name: 'unit_id' },
            nullable: false,
            onDelete: 'CASCADE',
        },
    },
})
