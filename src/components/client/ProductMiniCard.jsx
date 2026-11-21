// @ts-nocheck
import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageSquare, Package, Plus } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/format';
import { useCart } from '@/lib/cart';
import { useFavorites } from '@/lib/favorites';
import { cn } from '@/lib/utils';

export default function ProductMiniCard({ product }) {
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const favori = isFavorite(product.id);
  const stock = Number(product.stock) || 0;

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className="relative aspect-square w-full overflow-hidden bg-secondary">
        {product.image ? (
          <Image src={product.image} alt={product.nom} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Package className="h-6 w-6" strokeWidth={1.5} />
          </div>
        )}
        <button
          type="button"
          onClick={() => toggleFavorite(product.id)}
          aria-label={favori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card/90 backdrop-blur"
        >
          <Heart className={cn('h-4 w-4', favori ? 'fill-accent text-accent' : 'text-muted-foreground')} />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-3">
        <p className="truncate text-sm font-semibold">{product.nom}</p>
        <p className="truncate text-[11px] text-muted-foreground">
          {product.vendeur_nom || 'Boutique locale'}
        </p>
        <p className="mt-1 font-heading text-base leading-none">{formatPrice(product.prix)}</p>

        <div className="mt-3 flex gap-1.5">
          <Button
            type="button"
            size="sm"
            className="flex-1 rounded-full"
            disabled={stock <= 0}
            onClick={() => addItem(product)}
          >
            <Plus className="h-3.5 w-3.5" />
            {stock <= 0 ? 'Épuisé' : 'Ajouter'}
          </Button>
          <Button asChild variant="outline" size="icon" className="shrink-0 rounded-full">
            <Link to={`/produits/${product.id}/avis`} aria-label={`Voir les avis sur ${product.nom}`}>
              <MessageSquare className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}