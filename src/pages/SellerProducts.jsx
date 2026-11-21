// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { isAdmin } from '@/lib/homeRoute';
import PageHeader from '@/components/layout/PageHeader';
import ProductRow from '@/components/products/ProductRow';
import ProductFormDialog from '@/components/products/ProductFormDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';

export default function SellerProducts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    const admin = isAdmin(user);
    const [productPage, categoryList] = await Promise.all([
      base44.entities.Product.filter(admin ? {} : { created_by_id: user.id }, {
        sort: '-created_date',
        limit: 200,
      }),
      base44.entities.Category.list(),
    ]);
    setProducts(productPage.items || []);
    setCategories(Array.isArray(categoryList) ? categoryList : []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  const filtered = products.filter((product) => {
    const term = search.trim().toLowerCase();
    const matchTerm =
      !term ||
      `${product.nom || ''} ${product.description || ''}`.toLowerCase().includes(term);
    const matchCategory = categoryId === 'all' || product.category_id === categoryId;
    return matchTerm && matchCategory;
  });

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setFormOpen(true);
  };

  async function confirmDelete() {
    if (!deleting) return;
    const target = deleting;
    setDeleting(null);
    try {
      await base44.entities.Product.delete(target.id);
      setProducts((prev) => prev.filter((product) => product.id !== target.id));
      toast({ title: 'Produit supprimé', description: `« ${target.nom} » a été retiré de votre boutique.` });
    } catch (e) {
      toast({ title: 'Suppression impossible', description: 'Réessayez dans un instant.', variant: 'destructive' });
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Catalogue"
        title="Vos produits"
        description="Publiez, ajustez vos prix et gardez un œil sur votre stock."
        action={
          <Button className="rounded-full" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau produit
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un produit…"
            className="pl-9"
          />
        </div>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger className="sm:w-56">
            <SelectValue placeholder="Toutes les catégories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les catégories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {loading ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="font-heading text-xl">
              {products.length === 0 ? 'Votre vitrine est encore vide' : 'Aucun produit ne correspond'}
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              {products.length === 0
                ? 'Ajoutez votre premier produit avec une photo et un stock pour commencer à vendre.'
                : 'Essayez un autre mot-clé ou changez de catégorie.'}
            </p>
            {products.length === 0 && (
              <Button className="mt-5 rounded-full" onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un produit
              </Button>
            )}
          </div>
        ) : (
          filtered.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              onEdit={openEdit}
              onDelete={setDeleting}
              showVendor={isAdmin(user)}
            />
          ))
        )}
      </div>

      <ProductFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editing}
        categories={categories}
        onSaved={load}
      />

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce produit ?</AlertDialogTitle>
            <AlertDialogDescription>
              « {deleting?.nom} » sera définitivement retiré de votre boutique.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}