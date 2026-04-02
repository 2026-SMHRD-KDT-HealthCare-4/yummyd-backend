const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'yummy_secret_key_1234';

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: '인증 토큰이 없습니다.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, role, username }
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: '유효하지 않은 토큰입니다.' });
  }
};
