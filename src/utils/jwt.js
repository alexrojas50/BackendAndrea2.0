var jwt = require('jsonwebtoken');

async function jwtGenerator(data) {
    return await jwt.sign({
        userName: data.userName,
        userId: data.userId
    }, 'passwordSuperFuerteSiKSi', {

        expiresIn: 3600

         });
}

async function jwtVerify(token) {
    try {
        var decoded = jwt.verify(token, 'passwordSuperFuerteSiKSi');
        return decoded
    } catch (error) {
        throw "Este no es el token putito"
    }


}

module.exports = { jwtGenerator, jwtVerify }
