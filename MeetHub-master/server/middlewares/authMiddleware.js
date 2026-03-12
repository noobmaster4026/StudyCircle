// server/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');


module.exports = async function (req, res, next) {
let token;
if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
try {
token = req.headers.authorization.split(' ')[1];
const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.user = { id: decoded.id };
return next();
} catch (err) {
console.error('Auth error:', err.message);
return res.status(401).json({ message: 'Not authorized, token failed' });
}
}
return res.status(401).json({ message: 'Not authorized, no token' });
};