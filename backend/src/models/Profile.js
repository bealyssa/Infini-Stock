const { EntitySchema } = require('typeorm')

module.exports = new EntitySchema({
    name: 'Profile',
    tableName: 'profiles',
    columns: {
        id: {
            type: 'uuid',
            primary: true,
            generated: 'uuid',
        },
        full_name: {
            type: 'varchar',
            length: 150,
            nullable: false,
        },
        email: {
            type: 'varchar',
            length: 255,
            unique: true,
            nullable: false,
        },
        password_hash: {
            type: 'varchar',
            length: 255,
            nullable: false,
            default: '',
        },
        role: {
            type: 'varchar',
            length: 20,
            nullable: false,
            default: 'staff',
        },
        is_active: {
            type: 'boolean',
            nullable: false,
            default: true,
        },
        email_verification_token_hash: {
            type: 'varchar',
            length: 64,
            nullable: true,
        },
        email_verification_expires_at: {
            type: 'timestamp',
            nullable: true,
        },
        email_verified_at: {
            type: 'timestamp',
            nullable: true,
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
            updateDate: false,
        },
    },
})
