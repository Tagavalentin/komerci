import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { sendOrderStatusEmail } from '../../shared/orderEmails.ts';

// Mode sandbox : seules ces cartes de test sont acceptées, aucun débit réel.
const SANDBOX_CARDS = {
  '4242424242424242': { issue: 'success', label: 'paiement accepté' },
  '4000000000000002': { issue: 'refusee', label: 'carte refusée' },
  '4000000000009995': { issue: 'fonds', label: 'fonds insuffisants' },
};
const MAX_ORDERS = 10;

export default async function (req) {
  try {
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

    const numero = String(body.numero || '').replace(/\D/g, '');
    const titulaire = String(body.titulaire || '').trim();
    const expiration = String(body.expiration || '').trim();
    const cvc = String(body.cvc || '').replace(/\D/g, '');

    if (numero.length < 12 || numero.length > 19) {
      return Response.json({ error: 'Numéro de carte invalide' }, { status: 400 });
    }
    if (titulaire.length < 2) {
      return Response.json({ error: 'Indiquez le nom du titulaire de la carte' }, { status: 400 });
    }
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiration)) {
      return Response.json({ error: "Date d'expiration au format MM/AA" }, { status: 400 });
    }
    if (cvc.length < 3) {
      return Response.json({ error: 'Cryptogramme invalide' }, { status: 400 });
    }

    const card = SANDBOX_CARDS[numero];
    if (!card) {
      return Response.json(
        {
          error:
            'Carte de test inconnue. Utilisez 4242 4242 4242 4242 (acceptée) ou 4000 0000 0000 0002 (refusée).',
        },
        { status: 400 },
      );
    }
    if (card.issue !== 'success') {
      return Response.json(
        { error: `Paiement refusé : ${card.label}. Aucun montant n'a été débité.` },
        { status: 402 },
      );
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

    const transaction = `SBX-${Date.now().toString().slice(-8)}`;
    const updated = await Promise.all(
      orders.map((order) =>
        base44.asServiceRole.entities.Order.update(order.id, { statut: 'payee' }),
      ),
    );
    await Promise.allSettled(
      updated.map((order) => sendOrderStatusEmail(base44, order, 'payee')),
    );

    return Response.json({
      statut: 'payee',
      sandbox: true,
      transaction,
      last4: numero.slice(-4),
      references,
      total: updated.reduce((sum, order) => sum + (Number(order.total) || 0), 0),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}