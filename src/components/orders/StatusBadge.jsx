import React from 'react';
import { cn } from '@/lib/utils';
import { statusBadge, statusLabel } from '@/lib/orders';

export default function StatusBadge({ statut, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide',
        statusBadge(statut),
        className,
      )}
    >
      {statusLabel(statut)}
    </span>
  );
}