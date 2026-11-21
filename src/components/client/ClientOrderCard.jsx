// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { ChevronDown, XCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatDate, formatPrice } from '@/lib/format';
import StatusBadge from '@/components/orders/StatusBadge';
import OrderProgress from '@/components/client/OrderProgress';
import { cn } from '@/lib/utils';

export default function ClientOrderCard({ order }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(null);
  const cancelled = order.statut === 'annulee';

  useEffect(() => {
    if (!open || items) return undefined;
    let stopped = false;
    base44.entities.OrderItem.filter({ order_id: order.id }).then((result) => {
      if (stopped) return;
      setItems(Array.isArray(result) ? result : result.items || []);
    });
    return () => {
      stopped = true;
    };
  }, [open, items, order.id]);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="min-w-0">
          <p className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
            {order.reference}
          </p>
          <p className="mt-0.5 truncate font-heading text-base leading-tight">{order.vendeur_nom}</p>
          <p className="text-xs text-muted-foreground">
            {order.items_count} article{order.items_count > 1 ? 's' : ''} · {formatDate(order.created_date)}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <StatusBadge statut={order.statut} />
          <p className="font-heading text-sm leading-none">{formatPrice(order.total)}</p>
        </div>
      </button>

      <div className="border-t border-border px-4 py-3">
        {cancelled ? (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <XCircle className="h-3.5 w-3.5 text-destructive" />
            Cette commande a été annulée par le vendeur.
          </p>
        ) : (
          <OrderProgress statut={order.statut} />
        )}
      </div>

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-2 border-t border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        {open ? 'Masquer le détail' : 'Voir le détail'}
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="border-t border-border bg-secondary/30 px-4 py-3">
          {items === null ? (
            <p className="text-xs text-muted-foreground">Chargement des articles…</p>
          ) : items.length === 0 ? (
            <p className="text-xs text-muted-foreground">Aucun article enregistré.</p>
          ) : (
            <ul className="space-y-2">
              {items.map((item) => (
                <li key={item.id} className="flex items-baseline justify-between gap-3 text-xs">
                  <span className="min-w-0 truncate">
                    {item.product_nom} <span className="text-muted-foreground">× {item.quantite}</span>
                  </span>
                  <span className="shrink-0 font-semibold">
                    {formatPrice(item.prix_unitaire * item.quantite)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {order.adresse_livraison && (
            <p className="mt-3 border-t border-border pt-2 text-xs text-muted-foreground">
              Livraison : {order.adresse_livraison}
            </p>
          )}
          {order.notes && (
            <p className="mt-1 text-xs text-muted-foreground">Note : {order.notes}</p>
          )}
        </div>
      )}
    </div>
  );
}