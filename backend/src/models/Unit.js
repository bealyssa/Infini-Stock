const { EntitySchema } = require('typeorm')

module.exports = new EntitySchema({
    name: 'Unit',
    tableName: 'units',
    columns: {
        id: {
            type: 'uuid',
            primary: true,
            generated: 'uuid',
        },
        device_name: {
            type: 'varchar',
            length: 255,
            nullable: false,
        },
        qr_code: {
            type: 'varchar',
            length: 100,
            unique: true,
            nullable: false,
        },
        status: {
            type: 'varchar',
            length: 20,
            nullable: false,
            default: 'active',
        },
        location: {
            type: 'text',
            nullable: true,
        },
        description: {
            type: 'text',
            nullable: true,
        },
        created_by: {
            type: 'uuid',
            nullable: false,
        },
        created_at: {
            type: 'timestamp',
            createDate: true,
            update: false,
        },
        updated_at: {
            type: 'timestamp',
            updateDate: true,
        },
        model_type: {
            type: 'varchar',
            length: 100,
            nullable: true,
        },
        serial_number: {
            type: 'varchar',
            length: 100,
            unique: true,
            nullable: true,
        },
        condition: {
            type: 'varchar',
            length: 20,
            nullable: true,
            default: 'good',
        },
        notes: {
            type: 'text',
            nullable: true,
        },
    },
    relations: {
        creator: {
            type: 'many-to-one',
            target: 'Profile',
            joinColumn: { name: 'created_by' },
            nullable: false,
            onDelete: 'RESTRICT',
        },
        monitors: {
            type: 'one-to-many',
            target: 'Monitor',
            inverseSide: 'linkedUnit',
        },
    },
})
