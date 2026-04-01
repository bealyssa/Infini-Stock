const { EntitySchema } = require('typeorm')

module.exports = new EntitySchema({
    name: 'AssetStatusHistory',
    tableName: 'asset_status_history',
    columns: {
        id: {
            type: 'uuid',
            primary: true,
            generated: 'uuid',
        },
        old_status: {
            type: 'varchar',
            length: 20,
            nullable: true,
        },
        new_status: {
            type: 'varchar',
            length: 20,
            nullable: false,
        },
        changed_by: {
            type: 'uuid',
            nullable: false,
        },
        source: {
            type: 'varchar',
            length: 20,
            nullable: false,
            default: 'web',
        },
        reason: {
            type: 'text',
            nullable: true,
        },
        changed_at: {
            type: 'timestamp',
            nullable: false,
            createDate: true,
            update: false,
        },
    },
    relations: {
        asset: {
            type: 'many-to-one',
            target: 'Asset',
            joinColumn: { name: 'asset_id' },
            nullable: false,
            onDelete: 'CASCADE',
        },
        user: {
            type: 'many-to-one',
            target: 'Profile',
            joinColumn: { name: 'changed_by' },
            nullable: false,
            onDelete: 'RESTRICT',
        },
    },
})
