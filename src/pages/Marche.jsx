// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Search, ShoppingBasket } from 'lucide-react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCart } from '@/lib/cart';
import { formatPrice } from '@/lib/format';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import ProductCard from '@/components/client/ProductCard';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 48;

export default function Marche() {
  const { count, subtotal } = useCart();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState('');
  const [categorie, setCategorie] = useState('all');
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState({});

  useEffect(() => {
    let cancelled = false;
    base44.entities.Product.list({ distinct: 'category_nom' }).then((result) => {
      if (cancelled) return;
      setCategories((result.items || []).filter(Boolean));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(() => {
      const filter = {};
      const search = query.trim();
      if (search) filter.nom = { $regex: search, $options: 'i' };
      if (categorie !== 'all') filter.category_nom = categorie;
      base44.entities.Product
        .filter(filter, { sort: '-created_date', limit: PAGE_SIZE })
        .then((page) => {
          if (!cancelled) setProducts(page.items || []);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, categorie]);

  useEffect(() => {
    const ids = products.map((product) => product.id);
    if (!ids.length) {
      setRatings({});
      return undefined;
    }
    let cancelled = false;
    base44.entities.ProductReview.filter({ product_id: { $in: ids } }, { limit: 300 }).then((page) => {
      if (cancelled) return;
      const map = {};
      (page.items || []).forEach((review) => {
        const current = map[review.product_id] || { somme: 0, count: 0 };
        map[review.product_id] = {
          somme: current.somme + (Number(review.note) || 0),
          count: current.count + 1,
        };
      });
      setRatings(map);
    });
    return () => {
      cancelled = true;
    };
  }, [products]);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
            Le marché
          </p>
          <h1 className="font-heading text-3xl leading-tight sm:text-4xl">
            Les produits de votre quartier
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Ajoutez plusieurs articles au panier — d'une ou de plusieurs boutiques — puis validez
            une seule fois.
          </p>
        </div>

        {count > 0 && (
          <Button asChild className="shrink-0 rounded-full">
            <Link to="/panier">
              <ShoppingBasket className="h-4 w-4" />
              Voir le panier · {formatPrice(subtotal)}
            </Link>
          </Button>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un produit..."
            className="rounded-full pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategorie('all')}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
              categorie === 'all'
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:text-foreground',
            )}
          >
            Toutes
          </button>
          {categories.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setCategorie(value)}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
                categorie === value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground hover:text-foreground',
              )}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-72 w-full rounded-2xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-card px-5 py-16 text-center">
          <p className="font-heading text-xl">Aucun produit ne correspond</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Essayez un autre mot-clé ou une autre catégorie.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} rating={ratings[product.id]} />
          ))}
        </div>
      )}
    </div>
  );
}