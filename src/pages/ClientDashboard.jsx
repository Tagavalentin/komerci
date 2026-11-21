// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useFavorites } from '@/lib/favorites';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import ClientStats from '@/components/client/ClientStats';
import ProductMiniCard from '@/components/client/ProductMiniCard';
import ClientHistory from '@/components/client/ClientHistory';

const EN_COURS = ['en_attente', 'payee', 'en_preparation', 'expediee'];

export default function ClientDashboard() {
  const { user } = useAuth();
  const { favorites } = useFavorites();
  const [orders, setOrders] = useState([]);
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let stopped = false;
    (async () => {
      const [ordersPage, productsPage, me] = await Promise.all([
        base44.entities.Order.list({ sort: '-created_date', limit: 100 }),
        base44.entities.Product.filter({}, { sort: '-created_date', limit: 100 }),
        base44.auth.me().catch(() => null),
      ]);
      let commandeItems = [];
      if (me?.id) {
        const itemsPage = await base44.entities.OrderItem.filter({ client_id: me.id }, { limit: 200 });
        commandeItems = itemsPage.items || [];
      }
      if (stopped) return;
      setOrders(ordersPage.items || []);
      setProducts(productsPage.items || []);
      setItems(commandeItems);
      setLoading(false);
    })();
    return () => {
      stopped = true;
    };
  }, []);

  const valides = orders.filter((order) => order.statut !== 'annulee');
  const depense = valides.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
  const enCours = orders.filter((order) => EN_COURS.includes(order.statut)).length;

  const achetes = new Set(items.map((item) => item.product_id));
  const parId = new Map(products.map((product) => [product.id, product]));
  const poidsCategories = new Map();
  items.forEach((item) => {
    const categorie = parId.get(item.product_id)?.category_nom;
    if (!categorie) return;
    poidsCategories.set(categorie, (poidsCategories.get(categorie) || 0) + (Number(item.quantite) || 1));
  });
  const categories = [...poidsCategories.entries()].sort((a, b) => b[1] - a[1]).map(([nom]) => nom);
  const disponibles = products.filter((product) => !achetes.has(product.id) && (Number(product.stock) || 0) > 0);
  const cibles = disponibles
    .filter((product) => categories.length === 0 || categories.includes(product.category_nom))
    .sort((a, b) => (poidsCategories.get(b.category_nom) || 0) - (poidsCategories.get(a.category_nom) || 0));
  const recommandations = (cibles.length ? cibles : disponibles).slice(0, 4);
  const favoris = products.filter((product) => favorites.includes(product.id));

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
            Mon espace
          </p>
          <h1 className="font-heading text-3xl leading-tight sm:text-4xl">
            Bonjour {user?.full_name?.split(' ')[0] || 'et bienvenue'}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Vos achats, vos favoris et des produits choisis pour vous.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/mes-commandes">Mes commandes</Link>
          </Button>
          <Button asChild className="rounded-full">
            <Link to="/espace-client">Le marché</Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <ClientStats
            commandes={valides.length}
            depense={depense}
            enCours={enCours}
            favoris={favoris.length}
          />
        </div>
      )}

      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <h2 className="font-heading text-xl">Recommandé pour vous</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            {categories.length ? `D'après vos achats en ${categories.slice(0, 2).join(' et ')}` : 'Les nouveautés du quartier'}
          </p>
        </div>

        {loading ? (
          <div className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-64 w-full rounded-2xl" />
            ))}
          </div>
        ) : recommandations.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            Aucune nouvelle recommandation pour le moment — le marché s'enrichit chaque jour.
          </p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {recommandations.map((product) => (
              <ProductMiniCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      <ClientHistory orders={orders} loading={loading} />

      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-accent" />
            <h2 className="font-heading text-xl">Vos favoris</h2>
          </div>
          <p className="text-xs text-muted-foreground">Touchez le cœur d'un produit pour le garder ici</p>
        </div>

        {loading ? (
          <Skeleton className="mt-3 h-40 w-full rounded-2xl" />
        ) : favoris.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-border bg-card px-5 py-10 text-center">
            <p className="font-heading text-lg">Aucun favori enregistré</p>
            <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
              Ajoutez des produits à vos favoris depuis le marché pour les retrouver en un clic.
            </p>
            <Button asChild className="mt-4 rounded-full">
              <Link to="/espace-client">Parcourir le marché</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {favoris.map((product) => (
              <ProductMiniCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}