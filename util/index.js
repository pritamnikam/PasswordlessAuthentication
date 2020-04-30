var jwt = require('jsonwebtoken');

/*
 * header : {
     Content-Type: 'application/json',
     authorization: 'Token zxdfer02.....'
   }
*/
const getTokenFromHeader = (request) => {
    const { headers: {authorization} } = request;

    if (authorization && authorization.split(' ')[0] === 'Token') {
        return authorization.split(' ')[1];
    }

    return null;
}

const generateJWT = () => {
    const today = Date.now();
    const expirationDate = new Date(today);
    expirationDate.setDate(expirationDate.getDate() + 60);

    return jwt.sign({
                    exp: parseInt(expirationDate.getTime() / 1000, 10)
                    }, 'secret');

}

const getAuthJSON = () => {
    return { token: generateJWT() };
}

module.exports = { getAuthJSON, getTokenFromHeader };