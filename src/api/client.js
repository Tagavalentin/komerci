// @ts-nocheck
// Client API local (remplace @base44/sdk) : expose la même surface `base44`
// que le SDK pour minimiser les changements dans les pages existantes.
// Toutes les requêtes passent par le proxy Vite /api → serveur Express + MySQL.

const API = '/api';
const TOKEN_KEY = 'token';

let accessToken = typeof window !== 'undefined' ? window.localStorage.getItem(TOKEN_KEY) : null;

// Récupère un éventuel ?access_token=… (retour du callback OAuth Google).
if (typeof window !== 'undefined') {
  const params = new URLSearchParams(window.location.search);
  const oauthToken = params.get('access_token');
  if (oauthToken) {
    accessToken = oauthToken;
    window.localStorage.setItem(TOKEN_KEY, oauthToken);
    params.delete('access_token');
    const qs = params.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`);
  }
}

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token) {
  accessToken = token || null;
  if (typeof window === 'undefined') return;
  if (accessToken) {
    window.localStorage.setItem(TOKEN_KEY, accessToken);
    window.localStorage.setItem('base44_access_token', accessToken);
  } else {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem('base44_access_token');
  }
}

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function apiFetch(path, { method = 'GET', body, auth = true, raw = false } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const response = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (raw) return response;

  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { error: text }; }

  if (!response.ok) {
    const message = data?.error || data?.message || `Erreur ${response.status}`;
    throw new ApiError(message, response.status, data);
  }
  return data;
}

// ---------------------------------------------------------------------------
// auth
// ---------------------------------------------------------------------------

const auth = {
  me: () => apiFetch('/auth/me'),

  logout: (redirectUrl) => {
    setAccessToken(null);
    apiFetch('/auth/logout', { method: 'POST', auth: false }).catch(() => {});
    if (redirectUrl && typeof window !== 'undefined') {
      window.location.href = redirectUrl;
    }
  },

  redirectToLogin: (returnTo) => {
    const target = returnTo && returnTo !== window.location.href ? returnTo : '/';
    window.location.href = `/login?returnTo=${encodeURIComponent(target)}`;
  },

  isAuthenticated: () => Promise.resolve(!!accessToken),

  setToken: (token) => setAccessToken(token),

  register: ({ email, password }) =>
    apiFetch('/auth/register', { method: 'POST', body: { email, password }, auth: false }),

  verifyOtp: ({ email, otpCode }) =>
    apiFetch('/auth/verify-otp', { method: 'POST', body: { email, otpCode }, auth: false }),

  resendOtp: (email) =>
    apiFetch('/auth/resend-otp', { method: 'POST', body: { email }, auth: false }),

  resetPasswordRequest: (email) =>
    apiFetch('/auth/reset-password-request', { method: 'POST', body: { email }, auth: false }),

  resetPassword: ({ resetToken, newPassword }) =>
    apiFetch('/auth/reset-password', { method: 'POST', body: { resetToken, newPassword }, auth: false }),

  updateMe: (data) => apiFetch('/auth/me', { method: 'PATCH', body: data }),

  loginWithProvider: (provider, returnTo = '/') => {
    if (provider !== 'google') {
      throw new ApiError(`Fournisseur de connexion non supporté : ${provider}`, 400);
    }
    window.location.href = `/api/auth/google?return_to=${encodeURIComponent(returnTo)}`;
  },
};

// ---------------------------------------------------------------------------
// entities
// ---------------------------------------------------------------------------

const ENTITY_NAMES = [
  'Product', 'Order', 'OrderItem', 'ProductReview',
  'Category', 'SupportMessage', 'User',
];

function entityApi(name) {
  const base = `/entities/${name}`;
  return {
    list: (options = {}) => apiFetch(`${base}/query`, { method: 'POST', body: options }),
    filter: (filter = {}, options = {}) => apiFetch(`${base}/query`, { method: 'POST', body: { ...options, filter } }),
    get: (id) => apiFetch(`${base}/${encodeURIComponent(id)}`),
    create: (data) => apiFetch(base, { method: 'POST', body: data }),
    update: (id, data) => apiFetch(`${base}/${encodeURIComponent(id)}`, { method: 'PATCH', body: data }),
    delete: (id) => apiFetch(`${base}/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    bulkCreate: (items) => apiFetch(`${base}/bulk`, { method: 'POST', body: { items } }),
    subscribe: (callback) => subscribeEntity(name, callback),
  };
}

// Pas de websocket : polling toutes les 8 s + diff pour émettre les événements.
const SUBSCRIBERS = new Map(); // entity -> Set<callback>
const POLL_CACHE = new Map(); // entity -> Map(id -> record)
let pollTimer = null;
const POLL_MS = 8000;

async function pollEntity(entity) {
  const cbs = SUBSCRIBERS.get(entity);
  if (!cbs || cbs.size === 0) return;
  let items;
  try {
    const page = await apiFetch(`/entities/${entity}/query`, { method: 'POST', body: {} });
    items = page.items || [];
  } catch {
    return; // session expirée ou backend indisponible : on réessaiera au prochain tick
  }

  const prevMap = POLL_CACHE.get(entity);
  const nextMap = new Map(items.map((i) => [i.id, i]));

  if (!prevMap) {
    // Amorçage : le contenu existant ne doit pas déclencher de 'create' massifs.
    POLL_CACHE.set(entity, nextMap);
    return;
  }

  for (const cb of cbs) {
    for (const item of items) {
      const prev = prevMap.get(item.id);
      if (!prev) cb({ type: 'create', data: item });
      else if (JSON.stringify(prev) !== JSON.stringify(item)) cb({ type: 'update', data: item });
    }
    for (const [id, gone] of prevMap) {
      if (!nextMap.has(id)) cb({ type: 'delete', data: gone });
    }
  }
  POLL_CACHE.set(entity, nextMap);
}

function ensurePolling() {
  if (pollTimer) return;
  pollTimer = setInterval(() => {
    for (const entity of SUBSCRIBERS.keys()) pollEntity(entity);
  }, POLL_MS);
}

function subscribeEntity(entity, callback) {
  if (!SUBSCRIBERS.has(entity)) SUBSCRIBERS.set(entity, new Set());
  SUBSCRIBERS.get(entity).add(callback);
  ensurePolling();
  pollEntity(entity);
  return () => {
    SUBSCRIBERS.get(entity)?.delete(callback);
    if (SUBSCRIBERS.get(entity)?.size === 0) {
      SUBSCRIBERS.delete(entity);
      POLL_CACHE.delete(entity);
    }
  };
}

const entities = Object.fromEntries(ENTITY_NAMES.map((name) => [name, entityApi(name)]));

// ---------------------------------------------------------------------------
// functions / integrations / app
// ---------------------------------------------------------------------------

const functionsApi = {
  invoke: async (name, body) => {
    const data = await apiFetch(`/functions/${encodeURIComponent(name)}`, { method: 'POST', body });
    return data;
  },
};

const integrations = {
  Core: {
    UploadPublicFile: async ({ file }) => {
      const form = new FormData();
      form.append('file', file);
      const response = await fetch(`${API}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new ApiError(data?.error || `Upload échoué (${response.status})`, response.status, data);
      return data;
    },
  },
};

const appApi = {
  getPublicSettings: () => apiFetch('/app/public-settings', { auth: false }),
};

export const base44 = { auth, entities, functions: functionsApi, integrations, app: appApi };
