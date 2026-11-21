// @ts-nocheck
import React from 'react';
import { ChevronRight } from 'lucide-react';
import { formatDate, formatPrice } from '@/lib/format';
import StatusBadge from '@/components/orders/StatusBadge';

export default function OrderRow({ order, onOpen, showVendor }) {
  return (
    <button
      type="button"
      onClick={() => onOpen?.(order)}
      className="flex w-full items-center gap-4 border-b border-border px-4 py-4 text-left transition-colors last:border-0 hover:bg-muted/40"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
            {order.reference}
          </span>
          <StatusBadge statut={order.statut} />
        </div>
        <p className="mt-1.5 truncate text-sm font-semibold">{order.client_nom || 'Client'}</p>
        <p className="truncate text-xs text-muted-foreground">
          {order.items_count || 0} article{(order.items_count || 0) > 1 ? 's' : ''} ·{' '}
          {formatDate(order.created_date)}
          {showVendor && order.vendeur_nom ? ` · ${order.vendeur_nom}` : ''}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-heading text-lg leading-none">{formatPrice(order.total)}</p>
        <ChevronRight className="ml-auto mt-1.5 h-4 w-4 text-muted-foreground" />
      </div>
    </button>
  );
}