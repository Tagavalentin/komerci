// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/layout/PageHeader';
import CategoryFormDialog from '@/components/admin/CategoryFormDialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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

export default function AdminCategories() {
  const { toast } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    setLoading(true);
    const list = await base44.entities.Category.list();
    const items = Array.isArray(list) ? list : list?.items || [];
    setCategories(items.sort((a, b) => (a.nom || '').localeCompare(b.nom || '')));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  async function confirmDelete() {
    if (!deleting) return;
    const target = deleting;
    setDeleting(null);
    try {
      await base44.entities.Category.delete(target.id);
      setCategories((prev) => prev.filter((item) => item.id !== target.id));
      toast({ title: 'Catégorie supprimée', description: `« ${target.nom} » a été retirée du catalogue.` });
    } catch (e) {
      toast({ title: 'Suppression impossible', description: 'Réessayez dans un instant.', variant: 'destructive' });
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Catégories"
        description="Structurez le marché : chaque produit est rattaché à une catégorie."
        action={
          <Button
            className="rounded-full"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle catégorie
          </Button>
        }
      />

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {loading ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : categories.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <p className="font-heading text-xl">Aucune catégorie</p>
            <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
              Créez la première catégorie pour que les vendeurs puissent classer leurs produits.
            </p>
          </div>
        ) : (
          categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center gap-3 border-b border-border px-4 py-3.5 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{category.nom}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {category.description || 'Sans description'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Modifier"
                onClick={() => {
                  setEditing(category);
                  setFormOpen(true);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" aria-label="Supprimer" onClick={() => setDeleting(category)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))
        )}
      </div>

      <CategoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        category={editing}
        onSaved={load}
      />

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette catégorie ?</AlertDialogTitle>
            <AlertDialogDescription>
              « {deleting?.nom} » ne sera plus proposée aux vendeurs. Les produits déjà classés restent en
              ligne, mais sans catégorie.
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