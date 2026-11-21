// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Store } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ProductCard from '@/components/client/ProductCard';
import ShopHero from '@/components/shop/ShopHero';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function Boutique() {
  const { vendorId } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    base44.entities.Product.filter(
      { created_by_id: vendorId },
      { sort: '-created_date', limit: 60 },
    )
      .then((page) => {
        if (!active) return;
        setProducts(page.items || []);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setProducts([]);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [vendorId]);

  const shopName = products[0]?.vendeur_nom || 'Boutique locale';
  const banner = products.find((product) => product.image)?.image || '';

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Skeleton className="h-72 w-full rounded-2xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card px-5 py-16 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          <Store className="h-5 w-5" strokeWidth={1.7} />
        </span>
        <p className="mt-4 font-heading text-xl">Cette boutique n'est pas encore ouverte</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Le vendeur n'a pas encore publié de produit.
        </p>
        <Button asChild variant="outline" className="mt-5 rounded-full">
          <Link to="/espace-client">Retour au marché</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ShopHero name={shopName} banner={banner} productCount={products.length} />

      <div>
        <h2 className="font-heading text-xl">Ses produits</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ajoutez directement au panier, chaque commande est préparée par {shopName}.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}