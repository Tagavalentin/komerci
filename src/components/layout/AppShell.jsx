import React, { useState } from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ReceiptText,
  Tags,
  Users,
  Settings,
  Store,
  LogOut,
  Menu,
  AlertTriangle,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { canSell, isAdmin } from '@/lib/homeRoute';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Brand from '@/components/layout/Brand';
import MiniMenu from '@/components/layout/MiniMenu';
import { initialsOf } from '@/lib/format';

const SELLER_LINKS = [
  { to: '/vendeur', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  { to: '/vendeur/produits', label: 'Produits', icon: Package },
  { to: '/vendeur/commandes', label: 'Commandes', icon: ReceiptText },
  { to: '/documentation', label: 'Doc. & tests', icon: BookOpen },
];

const ADMIN_LINKS = [
  { to: '/admin/categories', label: 'Catégories', icon: Tags },
  { to: '/admin/utilisateurs', label: 'Utilisateurs', icon: Users },
];

function NavItem({ item, onNavigate }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        )
      }
    >
      <Icon className="h-4 w-4" strokeWidth={1.8} />
      {item.label}
    </NavLink>
  );
}

function SidebarContent({ onNavigate }) {
  const { user, logout } = useAuth();
  const displayName = user?.store_name || user?.full_name || user?.email || 'Mon compte';

  return (
    <div className="flex h-full flex-col px-5 py-6">
      <div className="px-1">
        <Brand />
      </div>

      <div className="mt-8 flex-1 space-y-7 overflow-y-auto">
        <div>
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Boutique
          </p>
          <nav className="space-y-1">
            {SELLER_LINKS.map((item) => (
              <NavItem key={item.to} item={item} onNavigate={onNavigate} />
            ))}
          </nav>
        </div>

        {isAdmin(user) && (
          <div>
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Administration
            </p>
            <nav className="space-y-1">
              {ADMIN_LINKS.map((item) => (
                <NavItem key={item.to} item={item} onNavigate={onNavigate} />
              ))}
            </nav>
          </div>
        )}

        <div>
          <nav className="space-y-1">
            <NavItem
              item={{ to: '/parametres', label: 'Paramètres', icon: Settings }}
              onNavigate={onNavigate}
            />
          </nav>
        </div>
      </div>

      <div className="mt-6 border-t border-sidebar-border pt-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-heading text-sm text-primary">
            {initialsOf(displayName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{displayName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {isAdmin(user) ? 'Administrateur' : 'Vendeur'}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => logout()} title="Se déconnecter">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AppShell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) return null;
  if (!canSell(user)) return <Navigate to="/espace-client" replace />;

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-sidebar-border bg-sidebar lg:block">
        <SidebarContent />
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-background/85 px-5 py-3 backdrop-blur">
          <Brand className="lg:hidden" />
          <div className="ml-auto flex items-center gap-2">
            <MiniMenu
              className="hidden lg:inline-flex"
              items={[
                ...SELLER_LINKS,
                { to: `/boutique/${user.id}`, label: 'Ma boutique', icon: Store },
                { to: '/parametres', label: 'Paramètres', icon: Settings },
                ...(isAdmin(user) ? ADMIN_LINKS : []),
              ]}
            />
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Ouvrir le menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 border-sidebar-border bg-sidebar p-0">
                <SidebarContent onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>
        </header>

        <main className="px-5 pb-20 pt-6 lg:px-10 lg:pt-10">
          <div className="mx-auto w-full max-w-6xl">
            {user.is_active === false && (
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Votre compte est désactivé par l'administration. Vos données restent visibles, mais
                  contactez le support pour le réactiver.
                </p>
              </div>
            )}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}