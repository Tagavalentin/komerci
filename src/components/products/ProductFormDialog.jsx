// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Loader2, ImagePlus, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const EMPTY = { nom: '', description: '', prix: '', stock: '', category_id: '', image: '' };

export default function ProductFormDialog({ open, onOpenChange, product, categories, onSaved }) {
  const { user } = useAuth();
  const [values, setValues] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setValues(
      product
        ? {
            nom: product.nom || '',
            description: product.description || '',
            prix: product.prix ?? '',
            stock: product.stock ?? '',
            category_id: product.category_id || '',
            image: product.image || '',
          }
        : EMPTY,
    );
  }, [open, product?.id]);

  const set = (field, value) => setValues((prev) => ({ ...prev, [field]: value }));

  async function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      set('image', file_url);
    } catch (e) {
      setError("L'envoi de la photo a échoué. Réessayez.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const prix = Number(values.prix);
    const stock = Number(values.stock);

    if (!values.nom.trim()) {
      setError('Le nom du produit est obligatoire.');
      return;
    }
    if (!Number.isFinite(prix) || prix <= 0) {
      setError('Le prix doit être supérieur à 0.');
      return;
    }
    if (!Number.isFinite(stock) || stock < 0) {
      setError('Le stock ne peut pas être négatif.');
      return;
    }

    const category = categories.find((c) => c.id === values.category_id);
    const payload = {
      nom: values.nom.trim(),
      description: values.description.trim(),
      prix,
      stock,
      image: values.image,
      category_id: values.category_id || '',
      category_nom: category?.nom || '',
      vendeur_nom: user?.store_name || user?.full_name || user?.email || '',
    };

    setSaving(true);
    setError('');
    try {
      if (product) {
        await base44.entities.Product.update(product.id, payload);
      } else {
        await base44.entities.Product.create(payload);
      }
      onSaved?.();
      onOpenChange(false);
    } catch (e) {
      setError(e?.message || "L'enregistrement a échoué. Réessayez.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">
            {product ? 'Modifier le produit' : 'Nouveau produit'}
          </DialogTitle>
          <DialogDescription>
            Une photo nette et un prix juste font toute la différence sur un marché.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nom">Nom du produit</Label>
            <Input
              id="nom"
              value={values.nom}
              onChange={(e) => set('nom', e.target.value)}
              placeholder="Attiéké frais, panier en osier…"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="prix">Prix (FCFA)</Label>
              <Input
                id="prix"
                type="number"
                min="0"
                step="25"
                value={values.prix}
                onChange={(e) => set('prix', e.target.value)}
                placeholder="2500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Stock disponible</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                step="1"
                value={values.stock}
                onChange={(e) => set('stock', e.target.value)}
                placeholder="20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="categorie">Catégorie</Label>
            <Select value={values.category_id} onValueChange={(value) => set('category_id', value)}>
              <SelectTrigger id="categorie">
                <SelectValue placeholder="Choisir une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={3}
              value={values.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Origine, poids, conditions de conservation…"
            />
          </div>

          <div className="space-y-2">
            <Label>Photo du produit</Label>
            <div className="flex items-center gap-3">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-dashed border-border bg-secondary">
                {values.image ? (
                  <img src={values.image} alt="Aperçu du produit" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <ImagePlus className="h-5 w-5" strokeWidth={1.6} />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold hover:bg-muted">
                  {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
                  {uploading ? 'Envoi…' : values.image ? 'Changer la photo' : 'Ajouter une photo'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
                </label>
                {values.image && (
                  <button
                    type="button"
                    onClick={() => set('image', '')}
                    className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" /> Retirer
                  </button>
                )}
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" className="rounded-full" disabled={saving || uploading}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {product ? 'Enregistrer' : 'Publier le produit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}