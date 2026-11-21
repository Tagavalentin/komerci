export const ORDER_STATUSES = {
  en_attente: { label: 'En attente', badge: 'bg-amber-50 text-amber-800 border-amber-200' },
  payee: { label: 'Payée', badge: 'bg-primary/10 text-primary border-primary/25' },
  en_preparation: { label: 'En préparation', badge: 'bg-accent/10 text-accent border-accent/30' },
  expediee: { label: 'Expédiée', badge: 'bg-sky-50 text-sky-800 border-sky-200' },
  livree: { label: 'Livrée', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  annulee: { label: 'Annulée', badge: 'bg-muted text-muted-foreground border-border' },
};

export const STATUS_FLOW = {
  en_attente: ['en_preparation', 'annulee'],
  payee: ['en_preparation', 'annulee'],
  en_preparation: ['expediee', 'annulee'],
  expediee: ['livree'],
  livree: [],
  annulee: [],
};

export const STATUS_ACTIONS = {
  en_preparation: { label: 'Passer en préparation', variant: 'default' },
  expediee: { label: 'Marquer comme expédiée', variant: 'default' },
  livree: { label: 'Marquer comme livrée', variant: 'default' },
  annulee: { label: 'Annuler la commande', variant: 'outline' },
};

export const ORDER_TABS = [
  { value: 'all', label: 'Toutes' },
  { value: 'a_preparer', label: 'À préparer' },
  { value: 'expediee', label: 'Expédiées' },
  { value: 'livree', label: 'Livrées' },
  { value: 'annulee', label: 'Annulées' },
];

export function matchesTab(order, tab) {
  if (tab === 'all') return true;
  if (tab === 'a_preparer') {
    return ['en_attente', 'payee', 'en_preparation'].includes(order.statut);
  }
  return order.statut === tab;
}

export function statusLabel(statut) {
  return ORDER_STATUSES[statut]?.label || statut;
}

export function statusBadge(statut) {
  return ORDER_STATUSES[statut]?.badge || 'bg-muted text-muted-foreground border-border';
}

export function nextStatuses(statut) {
  return STATUS_FLOW[statut] || [];
}