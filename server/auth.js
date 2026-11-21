import jwt from 'jsonwebtoken';
import { one, query } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const ADMIN_EMAILS = new Set(
  (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean),
);

export function isAdminEmail(email) {
  return ADMIN_EMAILS.has(String(email || '').toLowerCase());
}

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role === 'admin' ? 'admin' : 'user' },
    JWT_SECRET,
    { expiresIn: '30d' },
  );
}

export function publicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    full_name: row.full_name || '',
    role: row.role || 'user',
    account_type: row.account_type || null,
    phone: row.phone || '',
    store_name: row.store_name || '',
    store_city: row.store_city || '',
    store_description: row.store_description || '',
    is_active: !!row.is_active,
    email_verified: !!row.email_verified,
    created_date: row.created_date,
  };
}

export async function findUserById(id) {
  return one('SELECT * FROM users WHERE id = ?', [id]);
}

export async function findUserByEmail(email) {
  return one('SELECT * FROM users WHERE email = ?', [String(email || '').toLowerCase()]);
}

// Auth middleware : résout le Bearer JWT et recharge l'utilisateur depuis la base
// pour avoir un rôle et un statut is_active toujours à jour.
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Non authentifié' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await findUserById(payload.sub);
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Compte introuvable ou désactivé' });
    }
    req.user = publicUser(user);
    req.userRow = user;
    next();
  } catch {
    res.status(401).json({ error: 'Session expirée' });
  }
}

export function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();
  jwt.verify(token, JWT_SECRET, async (err, payload) => {
    if (!err && payload?.sub) {
      const user = await findUserById(payload.sub).catch(() => null);
      if (user && user.is_active) {
        req.user = publicUser(user);
        req.userRow = user;
      }
    }
    next();
  });
}

export { query };
