import bcrypt from 'bcrypt'

async function bcryptHash (password) {
    const saltos = await bcrypt.genSalt(10)
    return await bcrypt.hash(password, saltos)
}

async function bcryptCompare (password, passwordHashed) {
    return await bcrypt.compare(password, passwordHashed)
}

module.exports = { bcryptHash, bcryptCompare }
