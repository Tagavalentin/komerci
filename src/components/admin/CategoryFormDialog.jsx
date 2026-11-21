// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function CategoryFormDialog({ open, onOpenChange, category, onSaved }) {
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setNom(category?.nom || '');
    setDescription(category?.description || '');
  }, [open, category?.id]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!nom.trim()) {
      setError('Le nom de la catégorie est obligatoire.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = { nom: nom.trim(), description: description.trim() };
      if (category) {
        await base44.entities.Category.update(category.id, payload);
      } else {
        await base44.entities.Category.create(payload);
      }
      onSaved?.();
      onOpenChange(false);
    } catch (e) {
      setError(e?.message || "L'enregistrement a échoué.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">
            {category ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
          </DialogTitle>
          <DialogDescription>Une catégorie claire aide les clients à trouver vos produits.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category-nom">Nom</Label>
            <Input
              id="category-nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Alimentation, Artisanat, Mode…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category-description">Description</Label>
            <Textarea
              id="category-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ce que regroupe cette catégorie"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" className="rounded-full" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {category ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}