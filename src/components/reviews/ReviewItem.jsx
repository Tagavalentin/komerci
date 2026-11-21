// @ts-nocheck
import React from 'react';
import StarRating from './StarRating';
import { formatDate, initialsOf } from '@/lib/format';

export default function ReviewItem({ review }) {
  return (
    <div className="rounded-xl border border-border bg-background/60 px-3 py-2.5">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-secondary-foreground">
          {initialsOf(review.client_nom)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold">{review.client_nom || 'Client'}</p>
          <p className="text-[11px] text-muted-foreground">{formatDate(review.created_date)}</p>
        </div>
        <StarRating value={review.note} starClassName="h-3 w-3" />
      </div>
      {review.commentaire && (
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{review.commentaire}</p>
      )}
    </div>
  );
}