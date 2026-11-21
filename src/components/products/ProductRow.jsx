// @ts-nocheck
import React from 'react';
import { Pencil, Trash2, Package } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/format';
import StockBadge from '@/components/products/StockBadge';

export default function ProductRow({ product, onEdit, onDelete, showVendor }) {
  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-0 sm:gap-4">
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-border bg-secondary">
        {product.image ? (
          <Image src={product.image} alt={product.nom} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Package className="h-5 w-5" strokeWidth={1.6} />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{product.nom}</p>
        <p className="truncate text-xs text-muted-foreground">
          {product.category_nom || 'Sans catégorie'}
          {showVendor && product.vendeur_nom ? ` · ${product.vendeur_nom}` : ''}
        </p>
        <div className="mt-1.5 flex items-center gap-2 sm:hidden">
          <span className="font-heading text-sm">{formatPrice(product.prix)}</span>
          <StockBadge stock={product.stock} />
        </div>
      </div>

      <p className="hidden w-24 shrink-0 text-right font-heading text-base sm:block">
        {formatPrice(product.prix)}
      </p>

      <div className="hidden w-[92px] shrink-0 text-right sm:block">
        <StockBadge stock={product.stock} />
      </div>

      <div className="flex shrink-0 items-center">
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => onEdit(product)} aria-label="Modifier">
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => onDelete(product)} aria-label="Supprimer">
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}