// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Loader2, MapPin, Phone, Mail, Package } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { formatDate, formatPrice } from '@/lib/format';
import { STATUS_ACTIONS, nextStatuses } from '@/lib/orders';
import StatusBadge from '@/components/orders/StatusBadge';

export default function OrderDetailSheet({ order, open, onOpenChange, onUpdated }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !order?.id) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    setItems([]);
    base44.entities.OrderItem
      .filter({ order_id: order.id }, { limit: 50 })
      .then((page) => {
        if (!cancelled) setItems(Array.isArray(page) ? page : page?.items || []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, order?.id]);

  async function changeStatus(statut) {
    setUpdating(statut);
    setError('');
    try {
      const response = await base44.functions.invoke('updateOrderStatus', {
        order_id: order.id,
        statut,
      });
      onUpdated?.(response.data.order);
    } catch (e) {
      setError(e?.response?.data?.error || 'Le changement de statut a échoué.');
    } finally {
      setUpdating(null);
    }
  }

  if (!order) return null;

  const subtotal = items.reduce((sum, item) => sum + Number(item.prix_unitaire) * Number(item.quantite), 0);
  const transitions = nextStatuses(order.statut);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader className="space-y-2">
          <span className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
            {order.reference}
          </span>
          <SheetTitle className="font-heading text-2xl">{formatPrice(order.total)}</SheetTitle>
          <SheetDescription className="flex items-center gap-2">
            <StatusBadge statut={order.statut} />
            <span className="text-xs text-muted-foreground">Créée le {formatDate(order.created_date)}</span>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Client
            </p>
            <p className="mt-2 text-sm font-semibold">{order.client_nom || 'Client'}</p>
            <div className="mt-2 space-y-1.5 text-xs text-muted-foreground">
              {order.client_telephone && (
                <p className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5" /> {order.client_telephone}
                </p>
              )}
              {order.client_email && (
                <p className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" /> {order.client_email}
                </p>
              )}
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {order.adresse_livraison || 'Adresse non renseignée'}
              </p>
            </div>
          </div>

          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Articles
            </p>
            <div className="rounded-2xl border border-border bg-card">
              {loading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-xs text-muted-foreground">
                  <Package className="h-4 w-4" />
                  Aucun article enregistré
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 text-sm last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{item.product_nom}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantite} × {formatPrice(item.prix_unitaire)}
                      </p>
                    </div>
                    <p className="shrink-0 font-heading">
                      {formatPrice(Number(item.prix_unitaire) * Number(item.quantite))}
                    </p>
                  </div>
                ))
              )}
            </div>
            {items.length > 0 && (
              <div className="mt-2 flex items-center justify-between px-1 text-sm">
                <span className="text-muted-foreground">Sous-total</span>
                <span className="font-heading text-base">{formatPrice(subtotal)}</span>
              </div>
            )}
          </div>

          {order.notes && (
            <div className="rounded-2xl bg-secondary/60 p-4 text-xs leading-relaxed text-secondary-foreground">
              <p className="mb-1 font-semibold">Note du client</p>
              {order.notes}
            </div>
          )}

          {transitions.length > 0 && (
            <div className="space-y-2 border-t border-border pt-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Faire avancer la commande
              </p>
              {transitions.map((statut) => {
                const action = STATUS_ACTIONS[statut];
                if (!action) return null;
                return (
                  <Button
                    key={statut}
                    className="w-full rounded-full"
                    variant={action.variant === 'outline' ? 'outline' : 'default'}
                    disabled={!!updating}
                    onClick={() => changeStatus(statut)}
                  >
                    {updating === statut && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {action.label}
                  </Button>
                );
              })}
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </SheetContent>
    </Sheet>
  );
}