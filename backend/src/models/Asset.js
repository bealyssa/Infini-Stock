const { EntitySchema } = require('typeorm')

module.exports = new EntitySchema({
    name: 'Asset',
    tableName: 'assets',
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
        type: {
            type: 'varchar',
            length: 20,
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
        created_by: {
            type: 'uuid',
            nullable: false,
        },
    },
    relations: {
        parent: {
            type: 'many-to-one',
            target: 'Asset',
            joinColumn: { name: 'parent_id' },
            nullable: true,
            onDelete: 'SET NULL',
            inverseSide: 'children',
        },
        children: {
            type: 'one-to-many',
            target: 'Asset',
            inverseSide: 'parent',
        },
        creator: {
            type: 'many-to-one',
            target: 'Profile',
            joinColumn: { name: 'created_by' },
            nullable: false,
            onDelete: 'RESTRICT',
        },
    },
})
