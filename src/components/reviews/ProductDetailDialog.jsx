// @ts-nocheck
import React from 'react';
import { Link } from 'react-router-dom';
import { Package, Store } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { formatPrice } from '@/lib/format';
import ProductReviews from './ProductReviews';

export default function ProductDetailDialog({ product, open, onOpenChange, onStats }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] gap-4 overflow-y-auto sm:max-w-lg">
        <div className="flex gap-3">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-secondary">
            {product.image ? (
              <Image src={product.image} alt={product.nom} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <Package className="h-6 w-6" strokeWidth={1.5} />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <DialogTitle className="font-heading text-xl leading-tight">{product.nom}</DialogTitle>
            <Link
              to={`/boutique/${product.created_by_id}`}
              className="inline-flex max-w-full items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <Store className="h-3 w-3 shrink-0" />
              <span className="truncate">{product.vendeur_nom || 'Boutique locale'}</span>
            </Link>
            <p className="mt-1 font-heading text-lg leading-none">{formatPrice(product.prix)}</p>
          </div>
        </div>

        {product.description && (
          <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>
        )}

        <ProductReviews product={product} onStats={onStats} />
      </DialogContent>
    </Dialog>
  );
}