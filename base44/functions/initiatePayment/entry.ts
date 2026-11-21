import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const MAX_ORDERS = 10;

// FedaPay v1 : sandbox par défaut, live si FEDAPAY_ENV=live.
// Secrets attendus : FEDAPAY_SECRET_KEY, PUBLIC_APP_URL (URL publique du site).
function fedapayConfig() {
  const secret = Deno.env.get('FEDAPAY_SECRET_KEY');
  if (!secret) return null;
  const live = Deno.env.get('FEDAPAY_ENV') === 'live';
  return {
    secret,
    base: live ? 'https://api.fedapay.com/v1' : 'https://sandbox-api.fedapay.com/v1',
    appUrl: (Deno.env.get('PUBLIC_APP_URL') || '').replace(/\/+$/, ''),
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

export default async function (req) {
  try {
    const config = fedapayConfig();
    if (!config) {
      return Response.json(
        { error: 'Le paiement en ligne n’est pas encore configuré.' },
        { status: 503 },
      );
    }
    if (!config.appUrl) {
      return Response.json(
        { error: 'L’URL publique de l’application n’est pas configurée (PUBLIC_APP_URL).' },
        { status: 503 },
      );
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) {
      return Response.json({ error: 'Connectez-vous pour payer votre commande' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const references = Array.isArray(body.references)
      ? body.references.filter((ref) => typeof ref === 'string' && ref.trim()).slice(0, MAX_ORDERS)
      : [];
    if (references.length === 0) {
      return Response.json({ error: 'Commande introuvable' }, { status: 400 });
    }

    const orders = await base44.asServiceRole.entities.Order.filter({
      reference: { $in: references },
      client_id: user.id,
    });
    if (orders.length !== references.length) {
      return Response.json({ error: 'Commande introuvable' }, { status: 404 });
    }
    if (orders.some((order) => order.statut !== 'en_attente')) {
      return Response.json({ error: 'Cette commande a déjà été traitée' }, { status: 409 });
    }

    const total = orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
    const amount = Math.round(total);
    if (!Number.isFinite(amount) || amount <= 0) {
      return Response.json({ error: 'Montant de commande invalide' }, { status: 400 });
    }

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
    if (!token?.url) {
      return Response.json({ error: 'Lien de paiement indisponible' }, { status: 502 });
    }

    return Response.json({
      payment_url: token.url,
      transaction_id: transaction.id,
      references,
      total: amount,
      sandbox: Deno.env.get('FEDAPAY_ENV') !== 'live',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
