const jwt = require('jsonwebtoken');

const secret = process.env.JWT_SECRET || 'super secr3t'
//TODO use identity name from exam description

function createToken(userData) {
    const payload = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        _id: userData._id
    }

    const token = jwt.sign(payload, secret, {
        expiresIn: '1d'
    });

    return token;
};

function verifyToken(token) {
    const data = jwt.verify(token, secret);

    return data;
};

module.exports = {
    createToken,
    verifyToken
};