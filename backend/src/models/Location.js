const { EntitySchema } = require('typeorm')

module.exports = new EntitySchema({
    name: 'Location',
    tableName: 'locations',
    columns: {
        id: {
            type: 'uuid',
            primary: true,
            generated: 'uuid',
        },
        qr_code: {
            type: 'varchar',
            length: 100,
            unique: true,
            nullable: false,
        },
        code: {
            type: 'varchar',
            length: 100,
            unique: true,
            nullable: false,
        },
        name: {
            type: 'varchar',
            length: 150,
            nullable: false,
        },
        site: {
            type: 'varchar',
            length: 120,
            nullable: true,
        },
        building: {
            type: 'varchar',
            length: 120,
            nullable: true,
        },
        floor: {
            type: 'varchar',
            length: 50,
            nullable: true,
        },
        room: {
            type: 'varchar',
            length: 80,
            nullable: true,
        },
        notes: {
            type: 'text',
            nullable: true,
        },
        is_active: {
            type: 'boolean',
            nullable: false,
            default: true,
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
    },
})
