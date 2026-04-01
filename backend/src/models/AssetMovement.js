const { EntitySchema } = require('typeorm')

module.exports = new EntitySchema({
    name: 'AssetMovement',
    tableName: 'asset_movements',
    columns: {
        id: {
            type: 'uuid',
            primary: true,
            generated: 'uuid',
        },
        from_location_id: {
            type: 'uuid',
            nullable: true,
        },
        to_location_id: {
            type: 'uuid',
            nullable: false,
        },
        moved_by: {
            type: 'uuid',
            nullable: false,
        },
        source: {
            type: 'varchar',
            length: 20,
            nullable: false,
            default: 'web',
        },
        notes: {
            type: 'text',
            nullable: true,
        },
        moved_at: {
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
            joinColumn: { name: 'moved_by' },
            nullable: false,
            onDelete: 'RESTRICT',
        },
    },
})
