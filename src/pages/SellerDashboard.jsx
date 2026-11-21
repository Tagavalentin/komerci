// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ReceiptText, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { isAdmin } from '@/lib/homeRoute';
import { formatPrice } from '@/lib/format';
import PageHeader from '@/components/layout/PageHeader';
import StatCard from '@/components/dashboard/StatCard';
import OrderRow from '@/components/orders/OrderRow';
import OrderDetailSheet from '@/components/orders/OrderDetailSheet';
import StockBadge from '@/components/products/StockBadge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const PAID = ['payee', 'en_preparation', 'expediee', 'livree'];

export default function SellerDashboard() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    setLoading(true);
    const admin = isAdmin(user);

    Promise.all([
      base44.entities.Product.filter(admin ? {} : { created_by_id: user.id }, {
        sort: '-created_date',
        limit: 100,
      }),
      base44.entities.Order.filter(admin ? {} : { vendor_id: user.id }, {
        sort: '-created_date',
        limit: 100,
      }),
    ])
      .then(([productPage, orderPage]) => {
        if (cancelled) return;
        setProducts(productPage.items || []);
        setOrders(orderPage.items || []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const revenue = orders
    .filter((order) => PAID.includes(order.statut))
    .reduce((sum, order) => sum + (Number(order.total) || 0), 0);
  const toPrepare = orders.filter((order) =>
    ['en_attente', 'payee', 'en_preparation'].includes(order.statut),
  ).length;
  const lowStock = products
    .filter((product) => Number(product.stock) <= 5)
    .sort((a, b) => Number(a.stock) - Number(b.stock))
    .slice(0, 4);
  const recentOrders = orders.slice(0, 5);
  const firstName = (user?.full_name || '').split(' ')[0];

  const handleUpdated = (updated) => {
    setOrders((prev) => prev.map((order) => (order.id === updated.id ? updated : order)));
    setSelected(updated);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Espace vendeur"
        title={firstName ? `Bonjour ${firstName}` : 'Votre boutique'}
        description={
          isAdmin(user)
            ? "Vue administrateur : vous voyez l'ensemble des boutiques et des commandes."
            : "Voici l'état de votre boutique aujourd'hui."
        }
        action={
          <Button asChild className="rounded-full">
            <Link to="/vendeur/produits">
              Nouveau produit
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Chiffre d'affaires"
          value={loading ? '—' : formatPrice(revenue)}
          hint="Commandes payées et livrées"
          icon={TrendingUp}
          emphasis
        />
        <StatCard
          label="À traiter"
          value={loading ? '—' : toPrepare}
          hint="Commandes à préparer ou expédier"
          icon={ReceiptText}
        />
        <StatCard
          label="Produits"
          value={loading ? '—' : products.length}
          hint="Références dans le catalogue"
          icon={Package}
        />
        <StatCard
          label="Alertes stock"
          value={loading ? '—' : products.filter((p) => Number(p.stock) <= 5).length}
          hint="Produits à réapprovisionner"
          icon={AlertTriangle}
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-heading text-xl">Commandes récentes</h2>
            <Link to="/vendeur/commandes" className="text-xs font-semibold text-accent hover:underline">
              Tout voir
            </Link>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            {loading ? (
              <div className="space-y-3 p-4">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <p className="font-heading text-lg">Aucune commande pour l'instant</p>
                <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
                  Dès qu'un client passera commande, elle apparaîtra ici avec son adresse de livraison.
                </p>
              </div>
            ) : (
              recentOrders.map((order) => (
                <OrderRow
                  key={order.id}
                  order={order}
                  onOpen={setSelected}
                  showVendor={isAdmin(user)}
                />
              ))
            )}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-heading text-xl">Stock à surveiller</h2>
            <Link to="/vendeur/produits" className="text-xs font-semibold text-accent hover:underline">
              Gérer
            </Link>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : lowStock.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Tout votre stock est confortable.
              </p>
            ) : (
              <div className="space-y-3">
                {lowStock.map((product) => (
                  <div key={product.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{product.nom}</p>
                      <p className="text-xs text-muted-foreground">{formatPrice(product.prix)}</p>
                    </div>
                    <StockBadge stock={product.stock} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {!loading && products.length === 0 && (
            <div className="mt-4 rounded-2xl border border-dashed border-border bg-card p-5">
              <p className="font-heading text-lg">Publiez votre premier produit</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Une photo, un prix, un stock : c'est tout ce qu'il faut pour ouvrir votre vitrine.
              </p>
              <Button asChild size="sm" className="mt-4 rounded-full">
                <Link to="/vendeur/produits">Ajouter un produit</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      <OrderDetailSheet
        order={selected}
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
        onUpdated={handleUpdated}
      />
    </div>
  );
}