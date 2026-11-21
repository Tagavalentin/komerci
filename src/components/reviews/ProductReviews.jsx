// @ts-nocheck
import React from 'react';
import StarRating from './StarRating';
import ReviewItem from './ReviewItem';
import ReviewForm from './ReviewForm';
import useProductReviews from '@/hooks/useProductReviews';

export default function ProductReviews({ product, onStats }) {
  const { reviews, loading, me, reload } = useProductReviews(product.id, onStats);

  const total = reviews.reduce((sum, review) => sum + (Number(review.note) || 0), 0);
  const moyenne = reviews.length ? total / reviews.length : 0;
  const mine = me ? reviews.find((review) => review.created_by_id === me.id) : null;

  return (
    <div className="mt-1 border-t border-border pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-heading text-lg leading-none">Avis clients</h3>
        <div className="flex items-center gap-2">
          <StarRating value={moyenne} starClassName="h-3.5 w-3.5" />
          <span className="text-xs text-muted-foreground">
            {reviews.length ? `${moyenne.toFixed(1)}/5 · ${reviews.length} avis` : 'Aucun avis'}
          </span>
        </div>
      </div>

      {loading ? (
        <p className="mt-3 text-sm text-muted-foreground">Chargement des avis...</p>
      ) : reviews.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
          Soyez le premier à donner votre avis sur ce produit.
        </p>
      ) : (
        <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
          {reviews.map((review) => (
            <ReviewItem key={review.id} review={review} />
          ))}
        </div>
      )}

      {me && (
        <ReviewForm
          key={`${product.id}-${mine?.id || 'nouveau'}`}
          product={product}
          user={me}
          existing={mine}
          onSaved={reload}
        />
      )}
    </div>
  );
}