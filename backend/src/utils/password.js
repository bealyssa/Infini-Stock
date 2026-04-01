const bcrypt = require('bcrypt')

const SALT_ROUNDS = 10

/**
 * Hash a password
 */
async function hashPassword(password) {
    return await bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Verify a password against its hash
 */
async function verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash)
}

module.exports = {
    hashPassword,
    verifyPassword,
}
