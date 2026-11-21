// @ts-nocheck
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Package } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { Button } from '@/components/ui/button';
import { initialsOf } from '@/lib/format';

export default function ShopHero({ name, banner, productCount }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="relative h-32 w-full bg-secondary sm:h-44">
        {banner && <Image src={banner} alt={name} className="h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-primary/25 to-transparent" />
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="absolute left-3 top-3 rounded-full bg-card/90 text-foreground hover:bg-card"
        >
          <Link to="/espace-client">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Le marché
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4 px-5 pb-5">
        <div className="flex items-end gap-3">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-border bg-card font-heading text-lg text-primary shadow-sm">
            {initialsOf(name)}
          </span>
          <div className="pb-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
              Boutique
            </p>
            <h1 className="font-heading text-2xl leading-tight sm:text-3xl">{name}</h1>
          </div>
        </div>
        <p className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground">
          <Package className="h-3.5 w-3.5" />
          {productCount} produit{productCount > 1 ? 's' : ''} en ligne
        </p>
      </div>
    </div>
  );
}