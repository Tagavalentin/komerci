// @ts-nocheck
import React, { useState } from 'react';
import { Loader2, Star } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export default function ReviewForm({ product, user, existing, onSaved }) {
  const [note, setNote] = useState(Number(existing?.note) || 0);
  const [commentaire, setCommentaire] = useState(existing?.commentaire || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    if (!note) {
      setError('Choisissez une note de 1 à 5 étoiles.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (existing) {
        await base44.entities.ProductReview.update(existing.id, { note, commentaire: commentaire.trim() });
      } else {
        await base44.entities.ProductReview.create({
          product_id: product.id,
          product_nom: product.nom,
          note,
          commentaire: commentaire.trim(),
          client_nom: user.full_name || 'Client',
        });
      }
      await onSaved();
    } catch (e) {
      setError("Votre avis n'a pas pu être enregistré.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 rounded-xl border border-border bg-card px-3 py-3">
      <p className="text-xs font-semibold">{existing ? 'Modifier votre avis' : 'Laisser un avis'}</p>

      <div className="mt-2 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((position) => (
          <button
            key={position}
            type="button"
            onClick={() => setNote(position)}
            aria-label={`${position} étoile${position > 1 ? 's' : ''}`}
            className="p-0.5"
          >
            <Star
              strokeWidth={1.5}
              className={cn('h-6 w-6', position <= note ? 'fill-accent text-accent' : 'text-border')}
            />
          </button>
        ))}
      </div>

      <div className="mt-2 space-y-1.5">
        <Label htmlFor={`avis-${product.id}`}>Votre commentaire</Label>
        <Textarea
          id={`avis-${product.id}`}
          value={commentaire}
          onChange={(event) => setCommentaire(event.target.value)}
          placeholder="Qualité, fraîcheur, livraison..."
          rows={3}
        />
      </div>

      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

      <Button type="submit" size="sm" className="mt-2 w-full rounded-full" disabled={saving}>
        {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
        {existing ? 'Mettre à jour' : 'Publier mon avis'}
      </Button>
    </form>
  );
}