// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/layout/PageHeader';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { initialsOf, formatDate } from '@/lib/format';
import { useToast } from '@/components/ui/use-toast';

export default function AdminUsers() {
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    base44.entities.User
      .list()
      .then((list) => {
        if (!cancelled) setUsers(Array.isArray(list) ? list : list?.items || []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function toggleActive(target) {
    const next = target.is_active === false;
    try {
      await base44.entities.User.update(target.id, { is_active: next });
      setUsers((prev) => prev.map((item) => (item.id === target.id ? { ...item, is_active: next } : item)));
      toast({
        title: next ? 'Compte activé' : 'Compte désactivé',
        description: `${target.full_name || target.email} ${next ? 'peut de nouveau vendre' : 'est suspendu'}.`,
      });
    } catch (e) {
      toast({ title: 'Action impossible', description: 'Réessayez dans un instant.', variant: 'destructive' });
    }
  }

  const term = search.trim().toLowerCase();
  const visible = users.filter((item) =>
    !term || `${item.full_name || ''} ${item.email || ''}`.toLowerCase().includes(term),
  );
  const vendors = users.filter((item) => item.account_type === 'vendeur').length;

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Utilisateurs"
        description={`${users.length} compte(s), dont ${vendors} vendeur(s). Activez ou suspendez un compte en un clic.`}
      />

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom ou e-mail…"
          className="pl-9"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {loading ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : visible.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">Aucun utilisateur trouvé.</p>
        ) : (
          visible.map((item) => {
            const active = item.is_active !== false;
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 border-b border-border px-4 py-3.5 last:border-0"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-heading text-sm text-primary">
                  {initialsOf(item.full_name || item.email)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.full_name || item.email}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.email} · inscrit le {formatDate(item.created_date)}
                  </p>
                </div>
                <span className="hidden rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-muted-foreground sm:inline-flex">
                  {item.role === 'admin' ? 'Admin' : item.account_type === 'vendeur' ? 'Vendeur' : 'Client'}
                </span>
                <div className="flex items-center gap-2">
                  <span className={active ? 'text-xs text-muted-foreground' : 'text-xs font-semibold text-destructive'}>
                    {active ? 'Actif' : 'Suspendu'}
                  </span>
                  <Switch checked={active} onCheckedChange={() => toggleActive(item)} aria-label="Activer le compte" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}