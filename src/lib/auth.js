import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'pepsi';

export function createToken(payload) {
  if (!process.env.JWT_SECRET) throw Error ('JWT_SECRET not defined');
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}
