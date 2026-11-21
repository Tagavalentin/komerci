import React from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  ShoppingBasket,
  LogOut,
  Package,
  Store,
  LayoutDashboard,
  ReceiptText,
  History,
  LifeBuoy,
  HelpCircle,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useCart } from '@/lib/cart';
import { Button } from '@/components/ui/button';
import Brand from '@/components/layout/Brand';
import MiniMenu from '@/components/layout/MiniMenu';
import { cn } from '@/lib/utils';

const MENU_ITEMS = [
  { to: '/espace-client', label: 'Le marché', icon: Store },
  { to: '/client-dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/mes-commandes', label: 'Mes commandes', icon: ReceiptText },
  { to: '/historique-commandes', label: 'Historique', icon: History },
  { to: '/support', label: 'Aide et support', icon: LifeBuoy },
  { to: '/faq', label: 'FAQ', icon: HelpCircle },
];

const LINKS = [
  { to: '/espace-client', label: 'Le marché' },
  { to: '/client-dashboard', label: 'Tableau de bord' },
  { to: '/mes-commandes', label: 'Mes commandes' },
  { to: '/historique-commandes', label: 'Historique' },
  { to: '/support', label: 'Aide' },
];

export default function ClientShell() {
  const { user } = useAuth();
  const { count } = useCart();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-6">
            <Brand to="/espace-client" />
            <nav className="hidden items-center gap-1 sm:flex">
              {LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end
                  className={({ isActive }) =>
                    cn(
                      'rounded-full px-3 py-1.5 text-sm transition-colors',
                      isActive ? 'bg-secondary font-semibold text-secondary-foreground' : 'text-muted-foreground hover:text-foreground',
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-1.5">
            <MiniMenu items={MENU_ITEMS} label="Mon espace" />
            <Button asChild variant="ghost" size="icon" className="sm:hidden" aria-label="Mes commandes">
              <Link to="/mes-commandes">
                <Package className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="relative rounded-full">
              <Link to="/panier">
                <ShoppingBasket className="h-4 w-4" />
                <span className="hidden sm:inline">Panier</span>
                {count > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-accent-foreground">
                    {count}
                  </span>
                )}
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Se déconnecter"
              onClick={() => base44.auth.logout(window.location.origin)}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-5">
        <Outlet />
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p>Komerci — le marché local, en ligne.</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Link to="/faq" className="hover:text-foreground">FAQ</Link>
            <Link to="/mentions-legales" className="hover:text-foreground">Mentions légales</Link>
            <Link to="/support" className="hover:text-foreground">Support</Link>
            <Link to="/vendre" className="hover:text-foreground">Vendre mes produits</Link>
            <span className="truncate">Connecté en tant que {user?.email || 'client'}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}