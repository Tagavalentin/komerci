// @ts-nocheck
import React from 'react';
import { Link } from 'react-router-dom';
import { History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import ClientOrderCard from '@/components/client/ClientOrderCard';
import { formatPrice } from '@/lib/format';

export default function ClientHistory({ orders, loading }) {
  const valides = orders.filter((order) => order.statut !== 'annulee');
  const panierMoyen = valides.length
    ? Math.round(valides.reduce((sum, order) => sum + (Number(order.total) || 0), 0) / valides.length)
    : 0;
  const derniers = orders.slice(0, 3);

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-accent" />
          <h2 className="font-heading text-xl">Vos derniers achats</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          {panierMoyen ? `Panier moyen : ${formatPrice(panierMoyen)}` : 'Aucun achat pour le moment'}
        </p>
      </div>

      {loading ? (
        <div className="mt-3 space-y-3">
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : derniers.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-dashed border-border bg-card px-5 py-10 text-center">
          <p className="font-heading text-lg">Aucune commande enregistrée</p>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
            Dès votre première commande, son suivi et son historique apparaîtront ici.
          </p>
          <Button asChild className="mt-4 rounded-full">
            <Link to="/espace-client">Découvrir le marché</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-3 space-y-3">
            {derniers.map((order) => (
              <ClientOrderCard key={order.id} order={order} />
            ))}
          </div>
          <Button asChild variant="outline" className="mt-3 w-full rounded-full">
            <Link to="/historique-commandes">Voir tout mon historique</Link>
          </Button>
        </>
      )}
    </section>
  );
}