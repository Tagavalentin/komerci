import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { sendOrderStatusEmail } from '../../shared/orderEmails.ts';

const TRANSITIONS = {
  en_attente: ['en_preparation', 'annulee'],
  payee: ['en_preparation', 'annulee'],
  en_preparation: ['expediee', 'annulee'],
  expediee: ['livree'],
  livree: [],
  annulee: [],
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) {
      return Response.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const orderId = body.order_id;
    const statut = body.statut;

    if (!orderId || !statut) {
      return Response.json({ error: 'order_id et statut sont requis' }, { status: 400 });
    }
    if (!Object.prototype.hasOwnProperty.call(TRANSITIONS, statut)) {
      return Response.json({ error: 'Statut inconnu' }, { status: 400 });
    }

    const order = await base44.asServiceRole.entities.Order.get(orderId).catch((e) =>
      e.status === 404 ? null : Promise.reject(e),
    );
    if (!order) {
      return Response.json({ error: 'Commande introuvable' }, { status: 404 });
    }

    if (user.role !== 'admin' && order.vendor_id !== user.id) {
      return Response.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const allowed = TRANSITIONS[order.statut] || [];
    if (!allowed.includes(statut)) {
      return Response.json(
        { error: `Transition non autorisée depuis le statut « ${order.statut} »` },
        { status: 422 },
      );
    }

    const updated = await base44.asServiceRole.entities.Order.update(orderId, { statut });

    // Une annulation rend les quantités au stock : le checkout les avait décrémentées.
    if (statut === 'annulee') {
      const items = await base44.asServiceRole.entities.OrderItem.filter({ order_id: orderId });
      await Promise.allSettled(
        items.map(async (item) => {
          const product = await base44.asServiceRole.entities.Product.get(item.product_id).catch(() => null);
          if (!product) return;
          await base44.asServiceRole.entities.Product.update(product.id, {
            stock: (Number(product.stock) || 0) + (Number(item.quantite) || 0),
          });
        }),
      );
    }

    const email = await sendOrderStatusEmail(base44, updated, statut);
    return Response.json({ order: updated, email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}