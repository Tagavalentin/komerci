import React from 'react';
import { cn } from '@/lib/utils';

export default function StatCard({ label, value, hint, icon: Icon, emphasis = false }) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-5 transition-colors',
        emphasis
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card text-card-foreground',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p
          className={cn(
            'text-[11px] font-semibold uppercase tracking-[0.14em]',
            emphasis ? 'text-primary-foreground/70' : 'text-muted-foreground',
          )}
        >
          {label}
        </p>
        {Icon && (
          <Icon
            className={cn('h-4 w-4', emphasis ? 'text-primary-foreground/70' : 'text-accent')}
            strokeWidth={1.8}
          />
        )}
      </div>
      <p className="mt-4 font-heading text-3xl leading-none">{value}</p>
      {hint && (
        <p className={cn('mt-2 text-xs', emphasis ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
          {hint}
        </p>
      )}
    </div>
  );
}