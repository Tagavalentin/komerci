// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { isAdmin } from '@/lib/homeRoute';
import PageHeader from '@/components/layout/PageHeader';
import OrderRow from '@/components/orders/OrderRow';
import OrderDetailSheet from '@/components/orders/OrderDetailSheet';
import { ORDER_TABS, matchesTab } from '@/lib/orders';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function SellerOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    setLoading(true);
    base44.entities.Order
      .filter(isAdmin(user) ? {} : { vendor_id: user.id }, { sort: '-created_date', limit: 200 })
      .then((page) => {
        if (!cancelled) setOrders(page.items || []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const visible = orders.filter((order) => matchesTab(order, tab));

  const handleUpdated = (updated) => {
    setOrders((prev) => prev.map((order) => (order.id === updated.id ? updated : order)));
    setSelected(updated);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Logistique"
        title="Commandes"
        description="Préparez, expédiez et clôturez les commandes qui vous concernent."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {ORDER_TABS.map((item) => {
          const count =
            item.value === 'all'
              ? orders.length
              : orders.filter((order) => matchesTab(order, item.value)).length;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setTab(item.value)}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
                tab === item.value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground hover:text-foreground',
              )}
            >
              {item.label}
              <span className={cn('ml-1.5', tab === item.value ? 'text-primary-foreground/70' : 'text-muted-foreground/70')}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {loading ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : visible.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="font-heading text-xl">Aucune commande dans cette vue</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              Les commandes contenant vos produits apparaîtront ici dès leur validation par un client.
            </p>
          </div>
        ) : (
          visible.map((order) => (
            <OrderRow key={order.id} order={order} onOpen={setSelected} showVendor={isAdmin(user)} />
          ))
        )}
      </div>

      <OrderDetailSheet
        order={selected}
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
        onUpdated={handleUpdated}
      />
    </div>
  );
}