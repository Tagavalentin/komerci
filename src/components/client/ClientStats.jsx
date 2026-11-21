import React from 'react';
import { ShoppingBag, Wallet, Truck, Heart } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import { formatPrice } from '@/lib/format';

export default function ClientStats({ commandes, depense, enCours, favoris }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Commandes" value={commandes} hint="depuis votre inscription" icon={ShoppingBag} emphasis />
      <StatCard label="Total dépensé" value={formatPrice(depense)} hint="hors commandes annulées" icon={Wallet} />
      <StatCard label="En cours" value={enCours} hint="commandes en préparation ou en route" icon={Truck} />
      <StatCard label="Favoris" value={favoris} hint="produits enregistrés" icon={Heart} />
    </div>
  );
}