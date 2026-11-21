import crypto from 'crypto';
import {
  getRecord, createRecord, updateRecord, deleteRecord,
  listRecords, queryRecords,
} from './entities.js';
import { sendOrderStatusEmail } from './orderEmails.js';

const MAX_LINES = 40;
const MAX_QTY = 99;
const MAX_ORDERS = 10;

function jsonError(res, status, message) {
  return res.status(status).json({ error: message });
}

async function getUserOr401(req, res) {
  if (!req.user) {
    jsonError(res, 401, 'Connectez-vous pour finaliser votre commande');
    return null;
  }
  return req.user;
}

// ---------------------------------------------------------------------------
// checkoutCart : crée une commande par vendeur, réserve le stock.
// ---------------------------------------------------------------------------
export async function checkoutCart(req, res) {
  try {
    const user = await getUserOr401(req, res);
    if (!user) return;

    const body = req.body || {};
    const rawItems = Array.isArray(body.items) ? body.items : [];
    if (rawItems.length === 0) return jsonError(res, 400, 'Votre panier est vide');
    if (rawItems.length > MAX_LINES) return jsonError(res, 400, 'Trop d’articles différents dans le panier');

    const adresse = String(body.adresse || '').trim();
    const telephone = String(body.telephone || '').trim();
    const nom = String(body.nom || '').trim() || user.full_name || user.email || 'Client';
    const notes = String(body.notes || '').trim().slice(0, 500);

    if (adresse.length < 5) return jsonError(res, 400, 'Adresse de livraison incomplète');
    if (telephone.length < 6) return jsonError(res, 400, 'Numéro de téléphone invalide');

    const wanted = new Map();
    for (const line of rawItems) {
      const produitId = typeof line?.product_id === 'string' ? line.product_id : '';
      const quantite = Math.floor(Number(line?.quantite));
      if (!produitId) return jsonError(res, 400, 'Article invalide dans le panier');
      if (!Number.isFinite(quantite) || quantite < 1) return jsonError(res, 400, 'Quantité invalide dans le panier');
      if (quantite > MAX_QTY) return jsonError(res, 400, 'Quantité trop élevée pour un article');
      wanted.set(produitId, (wanted.get(produitId) || 0) + quantite);
    }

    const ids = [...wanted.keys()];
    const products = (await listRecords('Product')).filter((p) => ids.includes(p.id));
    const byId = new Map(products.map((p) => [p.id, p]));

    for (const [produitId, quantite] of wanted) {
      const product = byId.get(produitId);
      if (!product) return jsonError(res, 409, 'Un article du panier n’est plus disponible.');
      const stock = Number(product.stock) || 0;
      if (stock < quantite) {
        return jsonError(res, 409, `Stock insuffisant pour « ${product.nom} » : il en reste ${stock}.`);
      }
    }

    const groups = new Map();
    for (const [produitId, quantite] of wanted) {
      const product = byId.get(produitId);
      const key = product.created_by_id || product.vendeur_nom || 'boutique';
      if (!groups.has(key)) {
        groups.set(key, {
          vendorId: product.created_by_id || '',
          vendeurNom: product.vendeur_nom || 'Boutique locale',
          lines: [],
        });
      }
      groups.get(key).lines.push({ product, quantite });
    }

    const suffix = String(Date.now()).slice(-6);
    const created = [];
    const createdOrders = [];
    const decremented = [];
    let index = 0;

    const cleanup = async () => {
      await Promise.allSettled(
        createdOrders.map(async (order) => {
          const items = (await listRecords('OrderItem')).filter((i) => i.order_id === order.id);
          await Promise.allSettled(items.map((item) => deleteRecord('OrderItem', item.id)));
          await deleteRecord('Order', order.id).catch(() => {});
        }),
      );
      await Promise.allSettled(
        decremented.map(async ({ id, quantite }) => {
          const product = await getRecord('Product', id).catch(() => null);
          if (product) {
            await updateRecord('Product', id, { stock: (Number(product.stock) || 0) + quantite }).catch(() => {});
          }
        }),
      );
    };

    for (const group of groups.values()) {
      index += 1;
      const total = group.lines.reduce((sum, line) => sum + (Number(line.product.prix) || 0) * line.quantite, 0);
      const itemsCount = group.lines.reduce((sum, line) => sum + line.quantite, 0);
      const reference = groups.size > 1 ? `ML-${suffix}-${index}` : `ML-${suffix}`;

      const order = await createRecord('Order', {
        reference,
        vendor_id: group.vendorId,
        vendeur_nom: group.vendeurNom,
        client_id: user.id,
        client_nom: nom,
        client_email: user.email || '',
        client_telephone: telephone,
        adresse_livraison: adresse,
        notes,
        total,
        items_count: itemsCount,
        statut: 'en_attente',
      });
      createdOrders.push(order);

      for (const line of group.lines) {
        await createRecord('OrderItem', {
          order_id: order.id,
          vendor_id: group.vendorId,
          client_id: user.id,
          product_id: line.product.id,
          product_nom: line.product.nom,
          image: line.product.image || '',
          quantite: line.quantite,
          prix_unitaire: Number(line.product.prix) || 0,
        });
      }

      created.push({ reference: order.reference, vendeur_nom: order.vendeur_nom, total, items_count: itemsCount });
    }

    // Réserve le stock avec une relecture fraîche.
    for (const [produitId, quantite] of wanted) {
      const product = await getRecord('Product', produitId);
      const stock = Number(product.stock) || 0;
      if (stock < quantite) {
        await cleanup();
        return jsonError(res, 409, `Stock insuffisant pour « ${product.nom} » : il en reste ${stock}.`);
      }
      await updateRecord('Product', produitId, { stock: stock - quantite });
      decremented.push({ id: produitId, quantite });
    }

    res.json({
      orders: created,
      total: created.reduce((sum, order) => sum + order.total, 0),
    });
  } catch (error) {
    jsonError(res, 500, error.message);
  }
}

// ---------------------------------------------------------------------------
// FedaPay
// ---------------------------------------------------------------------------
function fedapayConfig() {
  const secret = process.env.FEDAPAY_SECRET_KEY;
  if (!secret) return null;
  const live = process.env.FEDAPAY_ENV === 'live';
  return {
    secret,
    webhookSecret: process.env.FEDAPAY_WEBHOOK_SECRET,
    base: live ? 'https://api.fedapay.com/v1' : 'https://sandbox-api.fedapay.com/v1',
    appUrl: (process.env.PUBLIC_APP_URL || '').replace(/\/+$/, ''),
  };
}

async function fedapayFetch(config, path, body) {
  const response = await fetch(`${config.base}${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      Authorization: `Bearer ${config.secret}`,
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = result.message || result.error || `FedaPay a répondu ${response.status}`;
    throw new Error(message);
  }
  return result;
}

// Commandes en attente appartenant au user, par références.
async function pendingOrdersForUser(user, references) {
  const orders = await listRecords('Order');
  const wanted = orders.filter(
    (o) => references.includes(o.reference) && o.client_id === user.id,
  );
  return wanted;
}

// POST /api/functions/initiatePayment
export async function initiatePayment(req, res) {
  try {
    const config = fedapayConfig();
    if (!config) return jsonError(res, 503, 'Le paiement en ligne n’est pas encore configuré.');
    if (!config.appUrl) return jsonError(res, 503, 'L’URL publique de l’application n’est pas configurée (PUBLIC_APP_URL).');

    const user = await getUserOr401(req, res);
    if (!user) return;

    const body = req.body || {};
    const references = Array.isArray(body.references)
      ? body.references.filter((ref) => typeof ref === 'string' && ref.trim()).slice(0, MAX_ORDERS)
      : [];
    if (references.length === 0) return jsonError(res, 400, 'Commande introuvable');

    const orders = await pendingOrdersForUser(user, references);
    if (orders.length !== references.length) return jsonError(res, 404, 'Commande introuvable');
    if (orders.some((order) => order.statut !== 'en_attente')) {
      return jsonError(res, 409, 'Cette commande a déjà été traitée');
    }

    const total = orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
    const amount = Math.round(total);
    if (!Number.isFinite(amount) || amount <= 0) return jsonError(res, 400, 'Montant de commande invalide');

    const fullName = String(user.full_name || orders[0].client_nom || user.email || 'Client').trim();
    const [firstname, ...rest] = fullName.split(/\s+/);

    const transaction = await fedapayFetch(config, '/transactions', {
      description: `Commande Komerci ${references.join(', ')}`.slice(0, 250),
      amount,
      currency: { iso: 'XOF' },
      callback_url: `${config.appUrl}/paiement/retour`,
      custom_metadata: { references, client_id: user.id },
      customer: {
        firstname: firstname || 'Client',
        lastname: rest.join(' ') || '-',
        email: user.email || orders[0].client_email || undefined,
      },
    });

    const token = await fedapayFetch(config, `/transactions/${transaction.id}/token`);
    if (!token?.url) return jsonError(res, 502, 'Lien de paiement indisponible');

    res.json({
      payment_url: token.url,
      transaction_id: transaction.id,
      references,
      total: amount,
      sandbox: process.env.FEDAPAY_ENV !== 'live',
    });
  } catch (error) {
    jsonError(res, 500, error.message);
  }
}

// POST /api/functions/simulatePayment (sandbox, cartes de test)
const SANDBOX_CARDS = {
  '4242424242424242': { issue: 'success', label: 'paiement accepté' },
  '4000000000000002': { issue: 'refusee', label: 'carte refusée' },
  '4000000000009995': { issue: 'fonds', label: 'fonds insuffisants' },
};

export async function simulatePayment(req, res) {
  try {
    const user = await getUserOr401(req, res);
    if (!user) return;

    const body = req.body || {};
    const references = Array.isArray(body.references)
      ? body.references.filter((ref) => typeof ref === 'string' && ref.trim()).slice(0, MAX_ORDERS)
      : [];
    if (references.length === 0) return jsonError(res, 400, 'Commande introuvable');

    const numero = String(body.numero || '').replace(/\D/g, '');
    const titulaire = String(body.titulaire || '').trim();
    const expiration = String(body.expiration || '').trim();
    const cvc = String(body.cvc || '').replace(/\D/g, '');

    if (numero.length < 12 || numero.length > 19) return jsonError(res, 400, 'Numéro de carte invalide');
    if (titulaire.length < 2) return jsonError(res, 400, 'Indiquez le nom du titulaire de la carte');
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiration)) return jsonError(res, 400, "Date d'expiration au format MM/AA");
    if (cvc.length < 3) return jsonError(res, 400, 'Cryptogramme invalide');

    const card = SANDBOX_CARDS[numero];
    if (!card) {
      return jsonError(res, 400, 'Carte de test inconnue. Utilisez 4242 4242 4242 4242 (acceptée) ou 4000 0000 0000 0002 (refusée).');
    }
    if (card.issue !== 'success') {
      return jsonError(res, 402, `Paiement refusé : ${card.label}. Aucun montant n'a été débité.`);
    }

    const orders = await pendingOrdersForUser(user, references);
    if (orders.length !== references.length) return jsonError(res, 404, 'Commande introuvable');
    if (orders.some((order) => order.statut !== 'en_attente')) {
      return jsonError(res, 409, 'Cette commande a déjà été traitée');
    }

    const transaction = `SBX-${Date.now().toString().slice(-8)}`;
    const updated = [];
    for (const order of orders) {
      const u = await updateRecord('Order', order.id, { statut: 'payee' });
      updated.push(u);
    }
    await Promise.allSettled(updated.map((order) => sendOrderStatusEmail(order, 'payee')));

    res.json({
      statut: 'payee',
      sandbox: true,
      transaction,
      last4: numero.slice(-4),
      references,
      total: updated.reduce((sum, order) => sum + (Number(order.total) || 0), 0),
    });
  } catch (error) {
    jsonError(res, 500, error.message);
  }
}

// POST /api/functions/fedapayWebhook (pas d'auth : signature HMAC)
const TOLERANCE_SECONDS = 300;

function parseSignatureHeader(header) {
  const result = { t: null, v1: [] };
  for (const part of String(header || '').split(',')) {
    const [key, value] = part.split('=', 2);
    if (key === 't' && /^\d+$/.test(value || '')) result.t = Number(value);
    if (key === 'v1' && value) result.v1.push(value);
  }
  return result;
}

function verifySignature(rawBody, header, secret) {
  const { t, v1 } = parseSignatureHeader(header);
  if (!t || v1.length === 0) return false;
  if (Math.abs(Date.now() / 1000 - t) > TOLERANCE_SECONDS) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${t}.${rawBody}`).digest('hex');
  return v1.some((sig) => sig.length === expected.length && sig === expected);
}

async function fetchTransaction(config, id) {
  const response = await fetch(`${config.base}/transactions/${id}`, {
    headers: { Authorization: `Bearer ${config.secret}` },
  });
  if (!response.ok) return null;
  return response.json().catch(() => null);
}

export async function fedapayWebhook(req, res) {
  try {
    const config = fedapayConfig();
    if (!config?.webhookSecret) return jsonError(res, 503, 'Webhook non configuré');

    const rawBody = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body || {});
    const signature = req.headers['x-fedapay-signature'] || '';
    if (!verifySignature(rawBody, signature, config.webhookSecret)) {
      return jsonError(res, 400, 'Signature invalide');
    }

    const event = typeof req.body === 'object' && req.body !== null
      ? req.body
      : JSON.parse(rawBody);
    if (event?.name !== 'transaction.approved') {
      return res.json({ received: true });
    }

    const transaction = event.entity || event.data || {};
    const meta = transaction.custom_metadata || {};
    const references = Array.isArray(meta.references)
      ? meta.references.filter((ref) => typeof ref === 'string' && ref.trim())
      : [];
    if (!transaction.id || references.length === 0) return res.json({ received: true });

    const fresh = await fetchTransaction(config, transaction.id);
    if (fresh?.status !== 'approved') {
      return res.json({ received: true, status: fresh?.status || 'unknown' });
    }

    const orders = (await listRecords('Order')).filter(
      (o) => references.includes(o.reference) && o.statut === 'en_attente',
    );

    const updated = [];
    for (const order of orders) {
      updated.push(await updateRecord('Order', order.id, {
        statut: 'payee',
        paiement_ref: String(transaction.id),
      }));
    }
    await Promise.allSettled(updated.map((order) => sendOrderStatusEmail(order, 'payee')));

    res.json({ received: true, paid: updated.length });
  } catch (error) {
    // 500 pour que FedaPay réessaie la livraison.
    jsonError(res, 500, error.message);
  }
}

// ---------------------------------------------------------------------------
// updateOrderStatus : transitions de statut vendeur/admin + restauration stock.
// ---------------------------------------------------------------------------
const TRANSITIONS = {
  en_attente: ['en_preparation', 'annulee'],
  payee: ['en_preparation', 'annulee'],
  en_preparation: ['expediee', 'annulee'],
  expediee: ['livree'],
  livree: [],
  annulee: [],
};

export async function updateOrderStatus(req, res) {
  try {
    const user = await getUserOr401(req, res);
    if (!user) return;

    const body = req.body || {};
    const { order_id: orderId, statut } = body;
    if (!orderId || !statut) return jsonError(res, 400, 'order_id et statut sont requis');
    if (!Object.prototype.hasOwnProperty.call(TRANSITIONS, statut)) {
      return jsonError(res, 400, 'Statut inconnu');
    }

    const order = await getRecord('Order', orderId);
    if (!order) return jsonError(res, 404, 'Commande introuvable');

    if (user.role !== 'admin' && order.vendor_id !== user.id) {
      return jsonError(res, 403, 'Accès refusé');
    }

    const allowed = TRANSITIONS[order.statut] || [];
    if (!allowed.includes(statut)) {
      return jsonError(res, 422, `Transition non autorisée depuis le statut « ${order.statut} »`);
    }

    const updated = await updateRecord('Order', orderId, { statut });

    if (statut === 'annulee') {
      const items = (await listRecords('OrderItem')).filter((i) => i.order_id === orderId);
      await Promise.allSettled(
        items.map(async (item) => {
          const product = await getRecord('Product', item.product_id).catch(() => null);
          if (!product) return;
          await updateRecord('Product', product.id, {
            stock: (Number(product.stock) || 0) + (Number(item.quantite) || 0),
          });
        }),
      );
    }

    const email = await sendOrderStatusEmail(updated, statut);
    res.json({ order: updated, email });
  } catch (error) {
    jsonError(res, 500, error.message);
  }
}

export { queryRecords };
