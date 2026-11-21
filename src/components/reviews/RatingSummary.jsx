import React from 'react';
import StarRating from './StarRating';

export default function RatingSummary({ reviews }) {
  const count = reviews.length;
  const total = reviews.reduce((sum, review) => sum + (Number(review.note) || 0), 0);
  const moyenne = count ? total / count : 0;

  const distribution = [5, 4, 3, 2, 1].map((etoiles) => {
    const nombre = reviews.filter((review) => Number(review.note) === etoiles).length;
    return { etoiles, nombre, part: count ? Math.round((nombre / count) * 100) : 0 };
  });

  return (
    <div className="grid grid-cols-1 gap-5 rounded-2xl border border-border bg-card p-5 sm:grid-cols-[auto_1fr] sm:gap-8">
      <div className="text-center sm:min-w-[9rem]">
        <p className="font-heading text-4xl leading-none">{moyenne.toFixed(1)}</p>
        <StarRating value={moyenne} starClassName="mt-2 h-4 w-4" className="justify-center" />
        <p className="mt-2 text-xs text-muted-foreground">
          {count ? `${count} avis client${count > 1 ? 's' : ''}` : 'Aucun avis pour le moment'}
        </p>
      </div>

      <div className="space-y-1.5">
        {distribution.map((row) => (
          <div key={row.etoiles} className="flex items-center gap-2.5">
            <span className="w-9 shrink-0 text-[11px] text-muted-foreground">{row.etoiles} ★</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-accent" style={{ width: `${row.part}%` }} />
            </div>
            <span className="w-6 shrink-0 text-right text-[11px] text-muted-foreground">
              {row.nombre}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}