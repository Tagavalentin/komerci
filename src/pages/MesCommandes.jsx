// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Radio } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import ClientOrderCard from '@/components/client/ClientOrderCard';

export default function MesCommandes() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let stopped = false;

    base44.entities.Order
      .list({ sort: '-created_date', limit: 30 })
      .then((page) => {
        if (!stopped) setOrders(page.items || []);
      })
      .finally(() => {
        if (!stopped) setLoading(false);
      });

    const unsubscribe = base44.entities.Order.subscribe((event) => {
      const record = event.data;
      if (!record?.id) return;
      setOrders((prev) => {
        if (event.type === 'delete') return prev.filter((order) => order.id !== record.id);
        const known = prev.some((order) => order.id === record.id);
        if (!known) return [record, ...prev];
        return prev.map((order) => (order.id === record.id ? { ...order, ...record } : order));
      });
    });

    return () => {
      stopped = true;
      unsubscribe();
    };
  }, []);

  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">Suivi</p>
      <h1 className="font-heading text-3xl leading-tight sm:text-4xl">Mes commandes</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
        L'état de vos commandes se met à jour automatiquement dès que le vendeur les prépare ou les
        expédie.
      </p>

      <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold text-secondary-foreground">
        <Radio className="h-3 w-3 text-primary" />
        Suivi en temps réel
      </p>

      {loading ? (
        <div className="mt-6 space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-36 w-full rounded-2xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card px-5 py-14 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
            <Package className="h-6 w-6" strokeWidth={1.6} />
          </span>
          <p className="mt-4 font-heading text-xl">Aucune commande pour le moment</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Vos commandes apparaîtront ici, avec leur avancement.
          </p>
          <Button asChild className="mt-5 rounded-full">
            <Link to="/espace-client">Découvrir le marché</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((order) => (
            <ClientOrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}