// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

const FIELDS = [
  { key: 'store_name', label: 'Nom de la boutique', placeholder: 'Chez Ama — épicerie fine', kind: 'input' },
  { key: 'store_city', label: 'Ville', placeholder: 'Lomé', kind: 'input' },
  { key: 'phone', label: 'Téléphone', placeholder: '+228 90 00 00 00', kind: 'input' },
  { key: 'store_description', label: 'Présentation', placeholder: 'Ce que vous vendez, votre savoir-faire…', kind: 'textarea' },
];

export default function SellerSettings() {
  const { user, checkUserAuth } = useAuth();
  const { toast } = useToast();
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setValues({
      store_name: user.store_name || '',
      store_city: user.store_city || '',
      phone: user.phone || '',
      store_description: user.store_description || '',
    });
  }, [user?.id]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await base44.auth.updateMe({
        store_name: values.store_name?.trim() || '',
        store_city: values.store_city?.trim() || '',
        phone: values.phone?.trim() || '',
        store_description: values.store_description?.trim() || '',
      });
      await checkUserAuth();
      toast({ title: 'Paramètres enregistrés', description: 'Vos informations de boutique sont à jour.' });
    } catch (e) {
      toast({ title: "Enregistrement impossible", description: 'Réessayez dans un instant.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        eyebrow="Compte"
        title="Paramètres"
        description="Ces informations identifient votre boutique auprès de vos clients."
      />

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-border bg-card p-6">
        {FIELDS.map((field) => (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>{field.label}</Label>
            {field.kind === 'textarea' ? (
              <Textarea
                id={field.key}
                rows={4}
                value={values[field.key] || ''}
                placeholder={field.placeholder}
                onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
              />
            ) : (
              <Input
                id={field.key}
                value={values[field.key] || ''}
                placeholder={field.placeholder}
                onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
              />
            )}
          </div>
        ))}

        <div className="rounded-xl bg-secondary/60 px-4 py-3 text-xs text-secondary-foreground">
          Connecté en tant que <span className="font-semibold">{user?.email}</span>
          {user?.role === 'admin' ? ' · administrateur' : ' · vendeur'}
        </div>

        <div className="flex justify-end">
          <Button type="submit" className="rounded-full" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </div>
      </form>
    </div>
  );
}