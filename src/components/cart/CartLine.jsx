// @ts-nocheck
import React from 'react';
import { Minus, Plus, Trash2, Package } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/format';
import { useCart } from '@/lib/cart';

export default function CartLine({ item }) {
  const { setQuantite, removeItem } = useCart();
  const limit = Math.max(1, Number(item.stock) || 1);

  return (
    <div className="flex gap-3 border-b border-border px-4 py-3 last:border-0">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border bg-secondary">
        {item.image ? (
          <Image src={item.image} alt={item.nom} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Package className="h-5 w-5" strokeWidth={1.5} />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{item.nom}</p>
        <p className="text-xs text-muted-foreground">{formatPrice(item.prix)} l'unité</p>

        <div className="mt-2 flex items-center gap-2">
          <div className="flex items-center rounded-full border border-border">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full"
              aria-label="Diminuer la quantité"
              disabled={item.quantite <= 1}
              onClick={() => setQuantite(item.product_id, item.quantite - 1)}
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <span className="min-w-6 text-center text-sm font-semibold">{item.quantite}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full"
              aria-label="Augmenter la quantité"
              disabled={item.quantite >= limit}
              onClick={() => setQuantite(item.product_id, item.quantite + 1)}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            aria-label="Retirer du panier"
            onClick={() => removeItem(item.product_id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <p className="shrink-0 text-right font-heading text-sm">{formatPrice(item.prix * item.quantite)}</p>
    </div>
  );
}