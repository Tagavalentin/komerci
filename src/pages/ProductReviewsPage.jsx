// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Package, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCart } from '@/lib/cart';
import { formatPrice } from '@/lib/format';
import { Image } from '@/components/ui/image';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import RatingSummary from '@/components/reviews/RatingSummary';
import ReviewItem from '@/components/reviews/ReviewItem';
import ReviewForm from '@/components/reviews/ReviewForm';
import useProductReviews from '@/hooks/useProductReviews';

export default function ProductReviewsPage() {
  const { productId } = useParams();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const { reviews, loading: reviewsLoading, me, reload } = useProductReviews(productId);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    base44.entities.Product.get(productId)
      .then((result) => {
        if (!cancelled) setProduct(result || null);
      })
      .catch(() => {
        if (!cancelled) setProduct(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const notFound = !loading && !product;

  useEffect(() => {
    if (!notFound) return undefined;
    const meta = document.createElement('meta');
    meta.name = 'prerender-status-code';
    meta.content = '404';
    document.head.appendChild(meta);
    return () => document.head.removeChild(meta);
  }, [notFound]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-16 text-center">
        <p className="font-heading text-xl">Produit introuvable</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Ce produit n'est plus disponible sur le marché.
        </p>
        <Button asChild className="mt-5 rounded-full">
          <Link to="/espace-client">Retour au marché</Link>
        </Button>
      </div>
    );
  }

  const stock = Number(product.stock) || 0;
  const mine = me ? reviews.find((review) => review.created_by_id === me.id) : null;

  return (
    <div>
      <Link
        to="/espace-client"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Retour au marché
      </Link>

      <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-secondary">
          {product.image ? (
            <Image src={product.image} alt={product.nom} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <Package className="h-7 w-7" strokeWidth={1.5} />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
            Avis et notes
          </p>
          <h1 className="mt-1 font-heading text-2xl leading-tight">{product.nom}</h1>
          <p className="text-xs text-muted-foreground">{product.vendeur_nom || 'Boutique locale'}</p>
          <p className="mt-2 font-heading text-lg leading-none">{formatPrice(product.prix)}</p>
        </div>

        <Button
          type="button"
          className="shrink-0 rounded-full"
          disabled={stock <= 0}
          onClick={() => addItem(product)}
        >
          <Plus className="h-4 w-4" />
          {stock <= 0 ? 'Rupture de stock' : 'Ajouter au panier'}
        </Button>
      </div>

      <div className="mt-5">
        {reviewsLoading ? (
          <Skeleton className="h-32 w-full rounded-2xl" />
        ) : (
          <RatingSummary reviews={reviews} />
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section>
          <h2 className="font-heading text-lg">Tous les avis</h2>
          {reviewsLoading ? (
            <p className="mt-3 text-sm text-muted-foreground">Chargement des avis...</p>
          ) : reviews.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              Aucun avis pour l'instant. Soyez le premier à partager votre expérience.
            </p>
          ) : (
            <div className="mt-3 space-y-2.5">
              {reviews.map((review) => (
                <ReviewItem key={review.id} review={review} />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="font-heading text-lg">Votre avis</h2>
          {me ? (
            <ReviewForm
              key={`${product.id}-${mine?.id || 'nouveau'}`}
              product={product}
              user={me}
              existing={mine}
              onSaved={reload}
            />
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Connectez-vous pour noter ce produit.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}