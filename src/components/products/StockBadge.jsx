import React from 'react';
import { cn } from '@/lib/utils';

export default function StockBadge({ stock }) {
  const value = Number(stock) || 0;
  const label = value === 0 ? 'Rupture' : value <= 5 ? 'Stock faible' : `${value} en stock`;
  const tone =
    value === 0
      ? 'bg-destructive/10 text-destructive border-destructive/25'
      : value <= 5
        ? 'bg-amber-50 text-amber-800 border-amber-200'
        : 'bg-secondary text-secondary-foreground border-border';

  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold', tone)}>
      {label}
    </span>
  );
}