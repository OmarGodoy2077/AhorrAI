const jwt = require('jsonwebtoken');

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
    throw new Error('Missing JWT_SECRET');
}

module.exports = {
    secret: jwtSecret,
    expiresIn: '7d' // Token expires in 7 days
};