'use strict';
const jwt = require('jsonwebtoken');

/**
 * Middleware: verifica Bearer token no header Authorization.
 * Em caso de sucesso, injeta req.userId (UUID do usuário).
 */
function authMiddleware(req, res, next) {
  const header = req.headers['authorization'];

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticação ausente.' });
  }

  const token = header.slice(7).trim();

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.id;
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError'
      ? 'Sessão expirada. Faça login novamente.'
      : 'Token inválido.';
    return res.status(401).json({ error: msg });
  }
}

module.exports = authMiddleware;
