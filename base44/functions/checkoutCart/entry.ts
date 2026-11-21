import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const MAX_LINES = 40;
const MAX_QTY = 99;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) {
      return Response.json({ error: 'Connectez-vous pour finaliser votre commande' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const rawItems = Array.isArray(body.items) ? body.items : [];
    if (rawItems.length === 0) {
      return Response.json({ error: 'Votre panier est vide' }, { status: 400 });
    }
    if (rawItems.length > MAX_LINES) {
      return Response.json({ error: 'Trop d’articles différents dans le panier' }, { status: 400 });
    }

    const adresse = String(body.adresse || '').trim();
    const telephone = String(body.telephone || '').trim();
    const nom = String(body.nom || '').trim() || user.full_name || user.email || 'Client';
    const notes = String(body.notes || '').trim().slice(0, 500);

    if (adresse.length < 5) {
      return Response.json({ error: 'Adresse de livraison incomplète' }, { status: 400 });
    }
    if (telephone.length < 6) {
      return Response.json({ error: 'Numéro de téléphone invalide' }, { status: 400 });
    }

    // Regroupe les quantités par produit (le panier ne peut pas imposer de prix).
    const wanted = new Map();
    for (const line of rawItems) {
      const produitId = typeof line?.product_id === 'string' ? line.product_id : '';
      const quantite = Math.floor(Number(line?.quantite));
      if (!produitId) {
        return Response.json({ error: 'Article invalide dans le panier' }, { status: 400 });
      }
      if (!Number.isFinite(quantite) || quantite < 1) {
        return Response.json({ error: 'Quantité invalide dans le panier' }, { status: 400 });
      }
      if (quantite > MAX_QTY) {
        return Response.json({ error: 'Quantité trop élevée pour un article' }, { status: 400 });
      }
      wanted.set(produitId, (wanted.get(produitId) || 0) + quantite);
    }

    const ids = Array.from(wanted.keys());
    const products = await base44.asServiceRole.entities.Product.filter({ id: { $in: ids } });
    const byId = new Map(products.map((product) => [product.id, product]));

    for (const [produitId, quantite] of wanted) {
      const product = byId.get(produitId);
      if (!product) {
        return Response.json({ error: 'Un article du panier n’est plus disponible.' }, { status: 409 });
      }
      const stock = Number(product.stock) || 0;
      if (stock < quantite) {
        return Response.json(
          { error: `Stock insuffisant pour « ${product.nom} » : il en reste ${stock}.` },
          { status: 409 },
        );
      }
    }

    // Une commande par vendeur : le panier peut mélanger plusieurs boutiques.
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

    // En cas d'échec après création : supprime les commandes et leurs lignes,
    // puis remet en stock les quantités déjà décrémentées.
    const cleanup = async () => {
      await Promise.allSettled(
        createdOrders.map(async (order) => {
          const page = await base44.asServiceRole.entities.OrderItem.filter({ order_id: order.id }).catch(() => null);
          const lines = Array.isArray(page) ? page : page?.items || [];
          await Promise.allSettled(lines.map((item) => base44.asServiceRole.entities.OrderItem.delete(item.id)));
          await base44.asServiceRole.entities.Order.delete(order.id).catch(() => {});
        }),
      );
      await Promise.allSettled(
        decremented.map(async ({ id, quantite }) => {
          const product = await base44.asServiceRole.entities.Product.get(id).catch(() => null);
          if (product) {
            await base44.asServiceRole.entities.Product.update(id, {
              stock: (Number(product.stock) || 0) + quantite,
            }).catch(() => {});
          }
        }),
      );
    };

    try {
      for (const group of groups.values()) {
        index += 1;
        const total = group.lines.reduce(
          (sum, line) => sum + (Number(line.product.prix) || 0) * line.quantite,
          0,
        );
        const itemsCount = group.lines.reduce((sum, line) => sum + line.quantite, 0);
        const reference = groups.size > 1 ? `ML-${suffix}-${index}` : `ML-${suffix}`;

        const order = await base44.asServiceRole.entities.Order.create({
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

        await base44.asServiceRole.entities.OrderItem.bulkCreate(
          group.lines.map((line) => ({
            order_id: order.id,
            vendor_id: group.vendorId,
            client_id: user.id,
            product_id: line.product.id,
            product_nom: line.product.nom,
            image: line.product.image || '',
            quantite: line.quantite,
            prix_unitaire: Number(line.product.prix) || 0,
          })),
        );

        created.push({
          reference: order.reference,
          vendeur_nom: order.vendeur_nom,
          total,
          items_count: itemsCount,
        });
      }

      // Réserve le stock avec une relecture fraîche : une commande concurrente a pu
      // passer entre le contrôle initial et ici.
      for (const [produitId, quantite] of wanted) {
        const product = await base44.asServiceRole.entities.Product.get(produitId);
        const stock = Number(product.stock) || 0;
        if (stock < quantite) {
          await cleanup();
          return Response.json(
            { error: `Stock insuffisant pour « ${product.nom} » : il en reste ${stock}.` },
            { status: 409 },
          );
        }
        await base44.asServiceRole.entities.Product.update(produitId, { stock: stock - quantite });
        decremented.push({ id: produitId, quantite });
      }
    } catch (error) {
      await cleanup();
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      orders: created,
      total: created.reduce((sum, order) => sum + order.total, 0),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}