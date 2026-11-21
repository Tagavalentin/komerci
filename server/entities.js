import crypto from 'crypto';
import { query, one } from './db.js';

export const newId = () => crypto.randomUUID();

// ---------------------------------------------------------------------------
// Couche "records" : stockage générique des entités (équivalent des entities
// Base44) dans la table `records`, avec le JSON complet dans `data`.
// ---------------------------------------------------------------------------

function parseData(row) {
  if (!row) return null;
  let data = row.data;
  if (typeof data === 'string') {
    try { data = JSON.parse(data); } catch { data = {}; }
  }
  return {
    id: row.id,
    ...data,
    created_by_id: row.created_by_id || data.created_by_id || null,
    created_date: row.created_date,
    updated_date: row.updated_date,
  };
}

export async function listRecords(entity) {
  const rows = await query('SELECT * FROM records WHERE entity = ?', [entity]);
  return rows.map(parseData);
}

export async function getRecord(entity, id) {
  const row = await one('SELECT * FROM records WHERE entity = ? AND id = ?', [entity, id]);
  return parseData(row);
}

export async function createRecord(entity, data, createdById = null) {
  const id = newId();
  const { id: _id, created_by_id: _cb, created_date: _cd, updated_date: _ud, ...rest } = data || {};
  await query('INSERT INTO records (id, entity, data, created_by_id) VALUES (?, ?, ?, ?)', [
    id,
    entity,
    JSON.stringify(rest),
    createdById,
  ]);
  return getRecord(entity, id);
}

export async function updateRecord(entity, id, patch) {
  const existing = await getRecord(entity, id);
  if (!existing) return null;
  const { id: _id, created_by_id: _cb, created_date: _cd, updated_date: _ud, ...rest } = patch || {};
  const merged = { ...existing, ...rest };
  const { id: _i2, created_by_id: _c2, created_date: _c3, updated_date: _u2, ...data } = merged;
  await query('UPDATE records SET data = ? WHERE entity = ? AND id = ?', [
    JSON.stringify(data),
    entity,
    id,
  ]);
  return getRecord(entity, id);
}

export async function deleteRecord(entity, id) {
  await query('DELETE FROM records WHERE entity = ? AND id = ?', [entity, id]);
}

// ---------------------------------------------------------------------------
// Moteur de requête : filter / sort / limit / skip / distinct
// ---------------------------------------------------------------------------

function matchCondition(value, condition) {
  if (condition === null || condition === undefined) return value === condition;
  if (typeof condition === 'object' && !Array.isArray(condition)) {
    return Object.entries(condition).every(([op, operand]) => {
      switch (op) {
        case '$in': return Array.isArray(operand) && operand.includes(value);
        case '$ne': return value !== operand;
        case '$gt': return value > operand;
        case '$gte': return value >= operand;
        case '$lt': return value < operand;
        case '$lte': return value <= operand;
        case '$regex': {
          const flags = condition.$options === 'i' ? 'i' : '';
          try { return new RegExp(operand, flags).test(String(value ?? '')); }
          catch { return false; }
        }
        case '$exists': return (value !== undefined && value !== null) === !!operand;
        default: return false;
      }
    });
  }
  return value === condition;
}

function matches(record, filter) {
  if (!filter || typeof filter !== 'object') return true;
  return Object.entries(filter).every(([key, condition]) => {
    if (key === '$or') return Array.isArray(condition) && condition.some((f) => matches(record, f));
    if (key === '$and') return Array.isArray(condition) && condition.every((f) => matches(record, f));
    return matchCondition(record[key], condition);
  });
}

export function queryRecords(records, { filter = {}, sort, limit, skip = 0, distinct } = {}) {
  let items = records.filter((r) => matches(r, filter));

  if (distinct) {
    const values = [...new Set(items.map((r) => r[distinct]).filter((v) => v !== undefined && v !== null && v !== ''))];
    return { items: values.sort((a, b) => String(a).localeCompare(String(b))) };
  }

  if (sort) {
    const desc = String(sort).startsWith('-');
    const field = desc ? String(sort).slice(1) : String(sort);
    items = [...items].sort((a, b) => {
      const av = a[field];
      const bv = b[field];
      if (av === bv) return 0;
      const cmp = av > bv ? 1 : -1;
      return desc ? -cmp : cmp;
    });
  }

  const total = items.length;
  if (skip) items = items.slice(skip);
  if (limit !== undefined && limit !== null) items = items.slice(0, Number(limit));
  return { items, total };
}

// ---------------------------------------------------------------------------
// Règles d'accès (équivalent des "rls" des entities Base44)
// ---------------------------------------------------------------------------

export const ENTITIES = {
  Product:       { publicRead: true,  create: 'auth',      update: 'ownerOrAdmin', delete: 'ownerOrAdmin' },
  Category:      { publicRead: true,  create: 'admin',     update: 'admin',        delete: 'admin' },
  Order:         { read: 'orderScoped', create: 'admin',   update: 'admin',        delete: 'admin' },
  OrderItem:     { read: 'orderScoped', create: 'admin',   update: 'admin',        delete: 'admin' },
  ProductReview: { publicRead: true,  create: 'auth',      update: 'ownerOrAdmin', delete: 'ownerOrAdmin' },
  SupportMessage:{ read: 'ownOrAdmin', create: 'auth',     update: 'admin',        delete: 'admin' },
};

export const ENTITY_NAMES = [...Object.keys(ENTITIES), 'User'];

function isAdmin(user) {
  return user?.role === 'admin';
}

// Filtre additionnel imposé par la lecture (RLS read).
export function readScope(entity, user) {
  const cfg = ENTITIES[entity];
  if (!cfg) return null;
  if (cfg.publicRead) return {};
  if (!user) return { __deny: true };
  if (isAdmin(user)) return {};
  if (cfg.read === 'orderScoped') {
    return { $or: [{ vendor_id: user.id }, { client_id: user.id }] };
  }
  if (cfg.read === 'ownOrAdmin') {
    return { created_by_id: user.id };
  }
  return { __deny: true };
}

export function canCreate(entity, user) {
  const cfg = ENTITIES[entity];
  if (!cfg) return false;
  if (cfg.create === 'admin') return isAdmin(user);
  return !!user; // 'auth'
}

export function canWrite(entity, record, user, action) {
  const cfg = ENTITIES[entity];
  if (!cfg || !user) return false;
  if (isAdmin(user)) return true;
  if (cfg[action] === 'ownerOrAdmin') {
    return record?.created_by_id === user.id;
  }
  if (cfg[action] === 'admin') return false;
  return false;
}

export async function scopedQuery(entity, user, options) {
  const records = await listRecords(entity);
  const scope = readScope(entity, user);
  if (scope?.__deny) return { items: [], total: 0 };
  const base = scope && Object.keys(scope).length ? scope : {};
  const filter = options.filter || {};
  const merged = Object.keys(base).length
    ? (Object.keys(filter).length ? { $and: [base, filter] } : base)
    : filter;
  return queryRecords(records, { ...options, filter: merged });
}
