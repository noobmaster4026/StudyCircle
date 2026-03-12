// server/middlewares/socketAuth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Socket.IO authentication middleware
module.exports = async (socket, next) => {
  try {
    // token can be sent via `auth` object or query string
    let token = socket.handshake?.auth?.token || socket.handshake?.query?.token;

    if (!token) {
      return next(new Error('Authentication error: token missing'));
    }

    // Allow both "Bearer <token>" and raw token
    if (token.startsWith('Bearer ')) {
      token = token.split(' ')[1];
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return next(new Error('Authentication error: user not found'));
    }

    // Attach user to socket
    socket.user = user;
    next();
  } catch (err) {
    console.error('Socket auth failed:', err.message);
    next(new Error('Authentication error'));
  }
};
