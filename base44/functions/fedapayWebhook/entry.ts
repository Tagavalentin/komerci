import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { sendOrderStatusEmail } from '../../shared/orderEmails.ts';

// Webhook FedaPay : vérifie la signature X-FEDAPAY-SIGNATURE (HMAC-SHA256 de
// "<t>.<body brut>", en-tête "t=…,v1=…"), puis confirme le paiement auprès de
// l'API FedaPay avant de passer les commandes à « payee ».

const TOLERANCE_SECONDS = 300;

function fedapayConfig() {
  const secret = Deno.env.get('FEDAPAY_SECRET_KEY');
  const webhookSecret = Deno.env.get('FEDAPAY_WEBHOOK_SECRET');
  if (!secret || !webhookSecret) return null;
  const live = Deno.env.get('FEDAPAY_ENV') === 'live';
  return {
    secret,
    webhookSecret,
    base: live ? 'https://api.fedapay.com/v1' : 'https://sandbox-api.fedapay.com/v1',
  };
}

function parseSignatureHeader(header) {
  const result = { t: null, v1: [] };
  for (const part of String(header || '').split(',')) {
    const [key, value] = part.split('=', 2);
    if (key === 't' && /^\d+$/.test(value || '')) result.t = Number(value);
    if (key === 'v1' && value) result.v1.push(value);
  }
  return result;
}

function hex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function verifySignature(rawBody, header, secret) {
  const { t, v1 } = parseSignatureHeader(header);
  if (!t || v1.length === 0) return false;
  if (Math.abs(Date.now() / 1000 - t) > TOLERANCE_SECONDS) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${t}.${rawBody}`));
  const expected = hex(mac);
  return v1.some((sig) => sig.length === expected.length && sig === expected);
}

async function fetchTransaction(config, id) {
  const response = await fetch(`${config.base}/transactions/${id}`, {
    headers: { Authorization: `Bearer ${config.secret}` },
  });
  if (!response.ok) return null;
  return response.json().catch(() => null);
}

export default async function (req) {
  try {
    const config = fedapayConfig();
    if (!config) {
      return Response.json({ error: 'Webhook non configuré' }, { status: 503 });
    }

    const rawBody = await req.text();
    const signature = req.headers.get('x-fedapay-signature') || '';
    if (!(await verifySignature(rawBody, signature, config.webhookSecret))) {
      return Response.json({ error: 'Signature invalide' }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    // Seul un paiement approuvé change quoi que ce soit ; le reste est acquitté.
    if (event?.name !== 'transaction.approved') {
      return Response.json({ received: true });
    }

    const transaction = event.entity || event.data || {};
    const meta = transaction.custom_metadata || {};
    const references = Array.isArray(meta.references)
      ? meta.references.filter((ref) => typeof ref === 'string' && ref.trim())
      : [];
    if (!transaction.id || references.length === 0) {
      return Response.json({ received: true });
    }

    // La signature prouve l'expéditeur, pas le contenu métier : on revérifie le
    // statut directement auprès de FedaPay avant de créditer les commandes.
    const fresh = await fetchTransaction(config, transaction.id);
    if (fresh?.status !== 'approved') {
      return Response.json({ received: true, status: fresh?.status || 'unknown' });
    }

    const base44 = createClientFromRequest(req);
    const orders = await base44.asServiceRole.entities.Order.filter({
      reference: { $in: references },
      statut: 'en_attente',
    });
    const list = Array.isArray(orders) ? orders : orders?.items || [];

    const updated = await Promise.all(
      list.map((order) =>
        base44.asServiceRole.entities.Order.update(order.id, {
          statut: 'payee',
          paiement_ref: String(transaction.id),
        }),
      ),
    );
    await Promise.allSettled(
      updated.map((order) => sendOrderStatusEmail(base44, order, 'payee')),
    );

    return Response.json({ received: true, paid: updated.length });
  } catch (error) {
    // 500 pour que FedaPay réessaie la livraison.
    return Response.json({ error: error.message }, { status: 500 });
  }
}
