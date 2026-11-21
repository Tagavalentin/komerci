// @ts-nocheck
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Package, MessageSquare, Heart } from 'lucide-react';
import { useFavorites } from '@/lib/favorites';
import { Image } from '@/components/ui/image';
import { Button } from '@/components/ui/button';
import StarRating from '@/components/reviews/StarRating';
import ProductDetailDialog from '@/components/reviews/ProductDetailDialog';
import { formatPrice } from '@/lib/format';
import { useCart } from '@/lib/cart';

export default function ProductCard({ product, rating }) {
  const { items, addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [open, setOpen] = useState(false);
  const [stats, setStats] = useState(rating);
  const inCart = items.find((item) => item.product_id === product.id);
  const stock = Number(product.stock) || 0;
  const soldOut = stock <= 0;
  const maxed = !!inCart && inCart.quantite >= stock;
  const current = stats || rating;
  const moyenne = current?.count ? current.somme / current.count : 0;

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className="relative">
        <button
          type="button"
          onClick={() => toggleFavorite(product.id)}
          aria-label={isFavorite(product.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card/90 backdrop-blur"
        >
          <Heart
            className={
              isFavorite(product.id) ? 'h-4 w-4 fill-accent text-accent' : 'h-4 w-4 text-muted-foreground'
            }
          />
        </button>

        <button type="button" onClick={() => setOpen(true)} className="block w-full text-left">
        <div className="aspect-square w-full overflow-hidden bg-secondary">
          {product.image ? (
            <Image src={product.image} alt={product.nom} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <Package className="h-6 w-6" strokeWidth={1.5} />
            </div>
          )}
        </div>

        <div className="px-3 pt-3">
          <p className="truncate text-sm font-semibold">{product.nom}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {product.vendeur_nom || 'Boutique locale'}
          </p>
          <div className="mt-1.5 flex items-center gap-1.5">
            <StarRating value={moyenne} starClassName="h-3 w-3" />
            <span className="truncate text-[11px] text-muted-foreground">
              {current?.count ? `${moyenne.toFixed(1)} · ${current.count} avis` : 'Aucun avis'}
            </span>
          </div>
        </div>
        </button>
      </div>

      <div className="flex flex-1 flex-col p-3 pt-2">
        <p className="font-heading text-base leading-none">{formatPrice(product.prix)}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {soldOut ? 'Rupture de stock' : `${stock} disponible${stock > 1 ? 's' : ''}`}
        </p>

        <Button
          type="button"
          size="sm"
          className="mt-3 w-full rounded-full"
          disabled={soldOut || maxed}
          onClick={() => addItem(product)}
        >
          {soldOut ? (
            'Indisponible'
          ) : maxed ? (
            'Stock maximum'
          ) : (
            <>
              <Plus className="h-3.5 w-3.5" />
              {inCart ? `Dans le panier (${inCart.quantite})` : 'Ajouter'}
            </>
          )}
        </Button>

        <Button asChild variant="outline" size="sm" className="mt-2 w-full rounded-full">
          <Link to={`/produits/${product.id}/avis`}>
            <MessageSquare className="h-3.5 w-3.5" />
            Voir les avis{current?.count ? ` (${current.count})` : ''}
          </Link>
        </Button>
      </div>

      <ProductDetailDialog
        product={product}
        open={open}
        onOpenChange={setOpen}
        onStats={setStats}
      />
    </div>
  );
}