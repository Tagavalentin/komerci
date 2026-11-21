import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StarRating({ value = 0, className, starClassName = 'h-4 w-4' }) {
  const filled = Math.round(Number(value) || 0);

  return (
    <span
      className={cn('inline-flex items-center gap-0.5', className)}
      aria-label={`${(Number(value) || 0).toFixed(1)} sur 5`}
    >
      {[1, 2, 3, 4, 5].map((position) => (
        <Star
          key={position}
          strokeWidth={1.5}
          className={cn(starClassName, position <= filled ? 'fill-accent text-accent' : 'text-border')}
        />
      ))}
    </span>
  );
}