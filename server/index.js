import express from 'express';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { initDb, query, one } from './db.js';
import {
  requireAuth, optionalAuth, signToken, publicUser, isAdminEmail,
  findUserByEmail, findUserById,
} from './auth.js';
import { sendEmail } from './mailer.js';
import {
  ENTITY_NAMES, ENTITIES, scopedQuery, canCreate, canWrite,
  getRecord, createRecord, updateRecord, deleteRecord, listRecords,
  newId,
} from './entities.js';
import {
  checkoutCart, initiatePayment, simulatePayment, updateOrderStatus, fedapayWebhook,
} from './functions.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const APP_URL = (process.env.APP_URL || 'http://localhost:5173').replace(/\/+$/, '');

app.disable('x-powered-by');
app.set('trust proxy', true);

// Body JSON en conservant le body brut (signature webhook FedaPay).
app.use(express.json({
  limit: '2mb',
  verify: (req, _res, buf) => { req.rawBody = buf; },
}));

const err = (res, status, message) => res.status(status).json({ error: message });

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

const PROFILE_FIELDS = ['full_name', 'account_type', 'phone', 'store_name', 'store_city', 'store_description'];

async function issueSession(res, userRow) {
  const user = publicUser(userRow);
  res.json({ access_token: signToken(userRow), user });
}

app.post('/api/auth/register', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return err(res, 400, 'Adresse email invalide');
    if (password.length < 8) return err(res, 400, 'Le mot de passe doit faire au moins 8 caractères');
    if (await findUserByEmail(email)) return err(res, 409, 'Un compte existe déjà avec cet email');

    const id = newId();
    const passwordHash = await bcrypt.hash(password, 10);
    const fullName = email.split('@')[0];
    await query(
      `INSERT INTO users (id, email, password_hash, full_name, role, email_verified)
       VALUES (?, ?, ?, ?, ?, 0)`,
      [id, email, passwordHash, fullName, isAdminEmail(email) ? 'admin' : 'user'],
    );

    const code = String(crypto.randomInt(100000, 999999));
    await query(
      `INSERT INTO otp_codes (email, code, attempts, expires_at)
       VALUES (?, ?, 0, DATE_ADD(NOW(3), INTERVAL 10 MINUTE))
       ON DUPLICATE KEY UPDATE code = VALUES(code), attempts = 0, expires_at = VALUES(expires_at)`,
      [email, code],
    );
    await sendEmail({
      to: email,
      subject: 'Komerci — votre code de vérification',
      text: `Votre code de vérification Komerci est : ${code} (valable 10 minutes).`,
    });
    res.json({ success: true });
  } catch (e) {
    err(res, 500, e.message);
  }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const otpCode = String(req.body?.otpCode || '').trim();
    const row = await one('SELECT * FROM otp_codes WHERE email = ?', [email]);
    if (!row) return err(res, 400, 'Code invalide ou expiré');
    if (new Date(row.expires_at).getTime() < Date.now()) return err(res, 400, 'Code expiré, demandez-en un nouveau');
    if (row.attempts >= 5) return err(res, 429, 'Trop de tentatives, demandez un nouveau code');
    if (row.code !== otpCode) {
      await query('UPDATE otp_codes SET attempts = attempts + 1 WHERE email = ?', [email]);
      return err(res, 400, 'Code incorrect');
    }
    await query('DELETE FROM otp_codes WHERE email = ?', [email]);
    await query('UPDATE users SET email_verified = 1 WHERE email = ?', [email]);
    const user = await findUserByEmail(email);
    await issueSession(res, user);
  } catch (e) {
    err(res, 500, e.message);
  }
});

app.post('/api/auth/resend-otp', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const user = await findUserByEmail(email);
    if (!user) return err(res, 404, 'Compte introuvable');
    const code = String(crypto.randomInt(100000, 999999));
    await query(
      `INSERT INTO otp_codes (email, code, attempts, expires_at)
       VALUES (?, ?, 0, DATE_ADD(NOW(3), INTERVAL 10 MINUTE))
       ON DUPLICATE KEY UPDATE code = VALUES(code), attempts = 0, expires_at = VALUES(expires_at)`,
      [email, code],
    );
    await sendEmail({
      to: email,
      subject: 'Komerci — votre code de vérification',
      text: `Votre code de vérification Komerci est : ${code} (valable 10 minutes).`,
    });
    res.json({ success: true });
  } catch (e) {
    err(res, 500, e.message);
  }
});

// Login password — chemin utilisé par src/lib/authMfaFlow.js (loginWithPassword),
// via /api/apps/:appId/auth/login. Accepte aussi X-App-Mfa-Action: manage
// (MFA non implémenté → même réponse).
async function passwordLogin(req, res) {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const user = await findUserByEmail(email);
    if (!user || !user.password_hash || !(await bcrypt.compare(password, user.password_hash))) {
      return err(res, 401, 'Email ou mot de passe incorrect');
    }
    if (!user.is_active) return err(res, 403, 'Ce compte a été désactivé par l’administration');
    // Resynchronise le rôle admin si l'email est dans ADMIN_EMAILS.
    if (isAdminEmail(email) && user.role !== 'admin') {
      await query(`UPDATE users SET role = 'admin' WHERE id = ?`, [user.id]);
      user.role = 'admin';
    }
    await issueSession(res, user);
  } catch (e) {
    err(res, 500, e.message);
  }
}
app.post('/api/apps/:appId/auth/login', passwordLogin);
app.post('/api/auth/login', passwordLogin);

// Informations de connexion lues par authMfaFlow.loadSignInOptions.
app.get('/api/apps/public/login-info/by-id/:appId', (_req, res) => {
  res.json({
    app_id: _req.params.appId,
    app_name: 'Komerci',
    auth_config: { mfa_policy: 'none', use_workspace_sso: false },
  });
});

app.get('/api/auth/me', requireAuth, (req, res) => res.json(req.user));

app.patch('/api/auth/me', requireAuth, async (req, res) => {
  try {
    // Le statut vendeur (espace de vente) est attribué par l'administration
    // via l'entité User — un utilisateur ne peut pas se l'auto-accorder.
    if (req.body?.account_type === 'vendeur' && req.user.role !== 'admin') {
      return err(res, 403, 'Le statut vendeur est attribué par l’administration');
    }
    const updates = {};
    for (const field of PROFILE_FIELDS) {
      if (req.body?.[field] !== undefined) updates[field] = req.body[field];
    }
    if (Object.keys(updates).length === 0) return res.json(req.user);
    const sets = Object.keys(updates).map((f) => `${f} = ?`).join(', ');
    await query(`UPDATE users SET ${sets} WHERE id = ?`, [...Object.values(updates), req.user.id]);
    const fresh = await findUserById(req.user.id);
    res.json(publicUser(fresh));
  } catch (e) {
    err(res, 500, e.message);
  }
});

app.post('/api/auth/logout', (_req, res) => res.json({ success: true }));

app.post('/api/auth/reset-password-request', async (req, res) => {
  // Répond toujours 200 pour ne pas révéler quels emails existent.
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const user = await findUserByEmail(email);
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      await query(
        `INSERT INTO password_resets (token_hash, email, expires_at)
         VALUES (?, ?, DATE_ADD(NOW(3), INTERVAL 1 HOUR))`,
        [tokenHash, email],
      );
      const link = `${APP_URL}/reset-password?token=${token}`;
      await sendEmail({
        to: email,
        subject: 'Komerci — réinitialisation de votre mot de passe',
        text: `Réinitialisez votre mot de passe : ${link}\n\nCe lien est valable 1 heure.`,
      });
    }
    res.json({ success: true });
  } catch {
    res.json({ success: true });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const resetToken = String(req.body?.resetToken || '');
    const newPassword = String(req.body?.newPassword || '');
    if (!resetToken || newPassword.length < 8) {
      return err(res, 400, 'Lien ou mot de passe invalide');
    }
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const row = await one('SELECT * FROM password_resets WHERE token_hash = ?', [tokenHash]);
    if (!row || new Date(row.expires_at).getTime() < Date.now()) {
      return err(res, 400, 'Lien de réinitialisation invalide ou expiré');
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password_hash = ? WHERE email = ?', [passwordHash, row.email]);
    await query('DELETE FROM password_resets WHERE token_hash = ?', [tokenHash]);
    res.json({ success: true });
  } catch (e) {
    err(res, 500, e.message);
  }
});

// ---------------------------------------------------------------------------
// Google OAuth
// ---------------------------------------------------------------------------

const googleStates = new Map(); // state -> { returnTo, origin, expires }

app.get('/api/auth/google', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return err(res, 503, 'La connexion Google n’est pas configurée (GOOGLE_CLIENT_ID).');
  const origin = req.headers.origin || req.headers.referer || APP_URL;
  const returnTo = String(req.query.return_to || '/');
  const state = crypto.randomBytes(16).toString('hex');
  googleStates.set(state, { returnTo, origin: new URL(origin).origin, expires: Date.now() + 10 * 60 * 1000 });
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${APP_URL}/api/auth/google/callback`;
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
  });
  res.redirect(url.toString());
});

app.get('/api/auth/google/callback', async (req, res) => {
  const fail = (origin, msg) => res.redirect(`${origin}/login?error=${encodeURIComponent(msg)}`);
  try {
    const stateData = googleStates.get(req.query.state);
    googleStates.delete(req.query.state);
    if (!stateData || stateData.expires < Date.now()) return fail(APP_URL, 'Session OAuth expirée');
    const { returnTo, origin } = stateData;

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${APP_URL}/api/auth/google/callback`;
    if (!clientId || !clientSecret) return fail(origin, 'OAuth non configuré');

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: req.query.code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    const tokens = await tokenRes.json();
    if (!tokens.access_token) return fail(origin, 'Échange de code OAuth échoué');

    const infoRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const info = await infoRes.json();
    if (!info.email) return fail(origin, 'Profil Google incomplet');

    let user = await one('SELECT * FROM users WHERE google_id = ? OR email = ?', [info.sub, info.email.toLowerCase()]);
    if (!user) {
      const id = newId();
      await query(
        `INSERT INTO users (id, email, full_name, role, google_id, email_verified)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [id, info.email.toLowerCase(), info.name || info.email.split('@')[0], isAdminEmail(info.email) ? 'admin' : 'user', info.sub],
      );
      user = await findUserById(id);
    } else {
      await query('UPDATE users SET google_id = ?, email_verified = 1 WHERE id = ?', [info.sub, user.id]);
      user = await findUserById(user.id);
    }
    if (!user.is_active) return fail(origin, 'Ce compte a été désactivé par l’administration');

    const accessToken = signToken(user);
    const sep = returnTo.includes('?') ? '&' : '?';
    res.redirect(`${origin}${returnTo}${sep}access_token=${encodeURIComponent(accessToken)}`);
  } catch (e) {
    fail(APP_URL, e.message);
  }
});

// ---------------------------------------------------------------------------
// Entités
// ---------------------------------------------------------------------------

const entityRouter = express.Router({ mergeParams: true });

entityRouter.post('/:entity/query', optionalAuth, async (req, res) => {
  const { entity } = req.params;
  if (!ENTITY_NAMES.includes(entity)) return err(res, 404, 'Entité inconnue');
  if (entity === 'User') {
    if (req.user?.role !== 'admin') return err(res, 403, 'Accès refusé');
    const rows = await query('SELECT * FROM users ORDER BY created_date DESC');
    return res.json({ items: rows.map(publicUser), total: rows.length });
  }
  const { filter = {}, sort, limit, skip, distinct } = req.body || {};
  const result = await scopedQuery(entity, req.user || null, { filter, sort, limit, skip, distinct });
  res.json(result);
});

entityRouter.get('/:entity/:id', optionalAuth, async (req, res) => {
  const { entity, id } = req.params;
  if (!ENTITY_NAMES.includes(entity)) return err(res, 404, 'Entité inconnue');
  if (entity === 'User') {
    if (req.user?.role !== 'admin') return err(res, 403, 'Accès refusé');
    const row = await findUserById(id);
    return row ? res.json(publicUser(row)) : err(res, 404, 'Introuvable');
  }
  const record = await getRecord(entity, id);
  if (!record) return err(res, 404, 'Introuvable');
  const scope = ENTITIES[entity];
  const allowed = scope.publicRead
    ? true
    : req.user && (req.user.role === 'admin' ||
        (scope.read === 'orderScoped' && (record.vendor_id === req.user.id || record.client_id === req.user.id)) ||
        (scope.read === 'ownOrAdmin' && record.created_by_id === req.user.id));
  if (!allowed) return err(res, 404, 'Introuvable');
  res.json(record);
});

entityRouter.post('/:entity', requireAuth, async (req, res) => {
  const { entity } = req.params;
  if (!ENTITY_NAMES.includes(entity)) return err(res, 404, 'Entité inconnue');
  if (entity === 'User') return err(res, 403, 'Utilisez le endpoint profil');
  if (!canCreate(entity, req.user)) return err(res, 403, 'Accès refusé');
  // Publier un produit nécessite un espace vendeur (ou admin).
  if (entity === 'Product' && req.user.role !== 'admin' && req.user.account_type !== 'vendeur') {
    return err(res, 403, 'Réservé aux vendeurs');
  }
  const record = await createRecord(entity, req.body || {}, req.user.id);
  res.status(201).json(record);
});

entityRouter.post('/:entity/bulk', requireAuth, async (req, res) => {
  const { entity } = req.params;
  if (!ENTITY_NAMES.includes(entity)) return err(res, 404, 'Entité inconnue');
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  const created = [];
  for (const item of items) {
    created.push(await createRecord(entity, item, req.user.id));
  }
  res.status(201).json(created);
});

entityRouter.patch('/:entity/:id', requireAuth, async (req, res) => {
  const { entity, id } = req.params;
  if (!ENTITY_NAMES.includes(entity)) return err(res, 404, 'Entité inconnue');
  if (entity === 'User') {
    if (req.user.role !== 'admin') return err(res, 403, 'Accès refusé');
    const target = await findUserById(id);
    if (!target) return err(res, 404, 'Introuvable');
    const updates = {};
    if (req.body?.is_active !== undefined) updates.is_active = req.body.is_active ? 1 : 0;
    if (req.body?.role !== undefined && ['user', 'admin'].includes(req.body.role)) updates.role = req.body.role;
    for (const f of PROFILE_FIELDS) if (req.body?.[f] !== undefined) updates[f] = req.body[f];
    if (Object.keys(updates).length) {
      const sets = Object.keys(updates).map((f) => `${f} = ?`).join(', ');
      await query(`UPDATE users SET ${sets} WHERE id = ?`, [...Object.values(updates), id]);
    }
    return res.json(publicUser(await findUserById(id)));
  }
  const record = await getRecord(entity, id);
  if (!record) return err(res, 404, 'Introuvable');
  if (entity === 'Product' && req.user.role !== 'admin' && req.user.account_type !== 'vendeur') {
    return err(res, 403, 'Réservé aux vendeurs');
  }
  if (!canWrite(entity, record, req.user, 'update')) return err(res, 403, 'Accès refusé');
  const updated = await updateRecord(entity, id, req.body || {});
  res.json(updated);
});

entityRouter.delete('/:entity/:id', requireAuth, async (req, res) => {
  const { entity, id } = req.params;
  if (!ENTITY_NAMES.includes(entity)) return err(res, 404, 'Entité inconnue');
  if (entity === 'User') return err(res, 403, 'Suppression non supportée');
  const record = await getRecord(entity, id);
  if (!record) return err(res, 404, 'Introuvable');
  if (entity === 'Product' && req.user.role !== 'admin' && req.user.account_type !== 'vendeur') {
    return err(res, 403, 'Réservé aux vendeurs');
  }
  if (!canWrite(entity, record, req.user, 'delete')) return err(res, 403, 'Accès refusé');
  await deleteRecord(entity, id);
  res.json({ success: true });
});

app.use('/api/entities', entityRouter);

// ---------------------------------------------------------------------------
// Fonctions métier
// ---------------------------------------------------------------------------

app.post('/api/functions/checkoutCart', requireAuth, checkoutCart);
app.post('/api/functions/initiatePayment', requireAuth, initiatePayment);
app.post('/api/functions/simulatePayment', requireAuth, simulatePayment);
app.post('/api/functions/updateOrderStatus', requireAuth, updateOrderStatus);
app.post('/api/functions/fedapayWebhook', fedapayWebhook);

// ---------------------------------------------------------------------------
// Uploads + divers
// ---------------------------------------------------------------------------

const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/api/uploads', express.static(uploadsDir));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

app.post('/api/upload', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) return err(res, 400, 'Fichier manquant');
  const ext = path.extname(req.file.originalname || '').toLowerCase() || '.bin';
  const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
  fs.writeFileSync(path.join(uploadsDir, name), req.file.buffer);
  res.json({ file_url: `/api/uploads/${name}` });
});

app.get('/api/app/public-settings', (_req, res) => {
  res.json({ id: 'komerci', public_settings: { app_name: 'Komerci' } });
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// ---------------------------------------------------------------------------

async function main() {
  await initDb();
  app.listen(PORT, () => {
    console.log(`[komerci-api] écoute sur http://localhost:${PORT}`);
  });
}

main().catch((e) => {
  console.error('[komerci-api] échec démarrage :', e.message);
  process.exit(1);
});
