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
            type: 'timestamp with time zone',
            default: () => 'CURRENT_TIMESTAMP',
            createDate: false,
            update: false,
        },
        updated_at: {
            type: 'timestamp with time zone',
            default: () => 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            updateDate: true,
        },
        created_by: {
            type: 'uuid',
            nullable: false,
        },
        image_data: {
            type: 'text',
            nullable: true,
        },
        description: {
            type: 'text',
            nullable: true,
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
        linked_unit_id: {
            type: 'uuid',
            nullable: true,
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
        linkedAsset: {
            type: 'many-to-one',
            target: 'Asset',
            joinColumn: { name: 'linked_unit_id' },
            nullable: true,
            onDelete: 'SET NULL',
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
