// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Archive } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatPrice } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import ClientOrderCard from '@/components/client/ClientOrderCard';
import { cn } from '@/lib/utils';

const TABS = [
  { value: 'all', label: 'Toutes' },
  { value: 'livree', label: 'Terminées' },
  { value: 'annulee', label: 'Annulées' },
];

export default function HistoriqueCommandes() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

  useEffect(() => {
    let stopped = false;
    base44.entities.Order
      .filter({ statut: { $in: ['livree', 'annulee'] } }, { sort: '-created_date', limit: 60 })
      .then((page) => {
        if (!stopped) setOrders(page.items || []);
      })
      .finally(() => {
        if (!stopped) setLoading(false);
      });
    return () => {
      stopped = true;
    };
  }, []);

  const livrees = orders.filter((order) => order.statut === 'livree');
  const annulees = orders.filter((order) => order.statut === 'annulee');
  const totalAchats = livrees.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
  const filtered = tab === 'all' ? orders : orders.filter((order) => order.statut === tab);

  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">Historique</p>
      <h1 className="font-heading text-3xl leading-tight sm:text-4xl">Mes achats passés</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
        Retrouvez toutes vos commandes terminées ou annulées, avec le détail des articles et
        l'adresse de livraison.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Commandes terminées
          </p>
          <p className="mt-2 font-heading text-2xl leading-none">{livrees.length}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Total dépensé
          </p>
          <p className="mt-2 font-heading text-2xl leading-none">{formatPrice(totalAchats)}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Commandes annulées
          </p>
          <p className="mt-2 font-heading text-2xl leading-none">{annulees.length}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((item) => (
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
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-5 space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-border bg-card px-5 py-14 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
            <Archive className="h-6 w-6" strokeWidth={1.6} />
          </span>
          <p className="mt-4 font-heading text-xl">Aucun achat dans cet historique</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Vos commandes terminées ou annulées s'afficheront ici.
          </p>
          <Button asChild className="mt-5 rounded-full">
            <Link to="/espace-client">Parcourir le marché</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {filtered.map((order) => (
            <ClientOrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}