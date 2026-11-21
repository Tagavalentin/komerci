// @ts-nocheck
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBasket, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useCart } from '@/lib/cart';
import { formatPrice } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import CartLine from '@/components/cart/CartLine';
import PaymentFedaPay from '@/components/client/PaymentFedaPay';
import PaymentSandbox from '@/components/client/PaymentSandbox';

export default function Panier() {
  const { user } = useAuth();
  const { items, count, subtotal, vendors, clearCart } = useCart();
  const [form, setForm] = useState({
    nom: user?.full_name || '',
    telephone: user?.phone || '',
    adresse: '',
    notes: '',
  });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const [payment, setPayment] = useState(null);

  const groups = useMemo(() => {
    const map = new Map();
    items.forEach((item) => {
      const key = item.vendeur_nom || 'Boutique locale';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    return Array.from(map.entries());
  }, [items]);

  const update = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (form.adresse.trim().length < 5) {
      setError('Indiquez une adresse de livraison complète.');
      return;
    }
    if (form.telephone.trim().length < 6) {
      setError('Indiquez un numéro de téléphone pour vous joindre.');
      return;
    }

    setSending(true);
    try {
      const response = await base44.functions.invoke('checkoutCart', {
        items: items.map((item) => ({ product_id: item.product_id, quantite: item.quantite })),
        nom: form.nom,
        telephone: form.telephone,
        adresse: form.adresse,
        notes: form.notes,
      });
      setConfirmation(response.data);
      clearCart();
    } catch (e) {
      setError(e?.response?.data?.error || "La commande n'a pas pu être envoyée.");
    } finally {
      setSending(false);
    }
  }

  if (confirmation) {
    return (
      <div className="mx-auto max-w-xl py-6 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="h-7 w-7" strokeWidth={1.7} />
        </span>
        <h1 className="mt-5 font-heading text-3xl leading-tight">
          {payment ? 'Commande payée' : 'Commande envoyée'}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {payment
            ? 'Votre paiement de test est validé : le vendeur va préparer votre commande.'
            : confirmation.orders?.length > 1
              ? `Vos articles ont été répartis en ${confirmation.orders.length} commandes, une par boutique. Chacune sera préparée par son vendeur.`
              : 'Votre commande est transmise au vendeur, qui va la préparer.'}
        </p>

        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card text-left">
          {(confirmation.orders || []).map((order) => (
            <div
              key={order.reference}
              className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 last:border-0"
            >
              <div className="min-w-0">
                <p className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                  {order.reference}
                </p>
                <p className="truncate text-sm font-semibold">{order.vendeur_nom}</p>
                <p className="text-xs text-muted-foreground">
                  {order.items_count} article{order.items_count > 1 ? 's' : ''}
                </p>
              </div>
              <p className="shrink-0 font-heading text-base">{formatPrice(order.total)}</p>
            </div>
          ))}
          <div className="flex items-center justify-between gap-3 border-t border-border bg-secondary/40 px-4 py-3">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="font-heading text-base">{formatPrice(confirmation.total)}</span>
          </div>
        </div>

        {payment ? (
          <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-left">
            <p className="flex items-center gap-2 text-sm font-semibold text-primary">
              <CheckCircle2 className="h-4 w-4" />
              Paiement accepté (sandbox)
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Transaction {payment.transaction} · carte ••••{payment.last4} · {formatPrice(payment.total)}
            </p>
          </div>
        ) : (
          <>
            <PaymentFedaPay
              references={(confirmation.orders || []).map((order) => order.reference)}
              total={confirmation.total}
            />
            <details className="mt-4 rounded-2xl border border-border bg-card">
              <summary className="cursor-pointer px-5 py-3 text-sm font-semibold text-muted-foreground">
                Mode test (sandbox)
              </summary>
              <div className="px-5 pb-5">
                <PaymentSandbox
                  references={(confirmation.orders || []).map((order) => order.reference)}
                  total={confirmation.total}
                  onPaid={setPayment}
                />
              </div>
            </details>
          </>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button asChild className="rounded-full">
            <Link to="/mes-commandes">
              Suivre mes commandes
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/espace-client">Continuer mes achats</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
          <ShoppingBasket className="h-6 w-6" strokeWidth={1.6} />
        </span>
        <h1 className="mt-5 font-heading text-3xl leading-tight">Votre panier est vide</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Parcourez le marché et ajoutez les produits qui vous intéressent.
        </p>
        <Button asChild className="mt-6 rounded-full">
          <Link to="/espace-client">Découvrir le marché</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
        Panier
      </p>
      <h1 className="font-heading text-3xl leading-tight sm:text-4xl">
        {count} article{count > 1 ? 's' : ''} dans votre panier
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {vendors > 1
          ? `Ces articles viennent de ${vendors} boutiques : la commande sera répartie en ${vendors} commandes.`
          : 'Tous ces articles viennent de la même boutique.'}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="min-w-0 space-y-4 lg:col-span-3">
          {groups.map(([vendeur, lines]) => (
            <div key={vendeur} className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
                <p className="truncate text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {vendeur}
                </p>
                <p className="shrink-0 font-heading text-sm">
                  {formatPrice(lines.reduce((sum, line) => sum + line.prix * line.quantite, 0))}
                </p>
              </div>
              {lines.map((line) => (
                <CartLine key={line.product_id} item={line} />
              ))}
            </div>
          ))}

          <Link
            to="/espace-client"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
          >
            Continuer mes achats
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="lg:col-span-2">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-heading text-xl">Livraison</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Le vendeur vous contactera pour convenir de la remise.
            </p>

            <div className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="nom">Votre nom</Label>
                <Input id="nom" value={form.nom} onChange={update('nom')} placeholder="Nom complet" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="telephone">Téléphone</Label>
                <Input
                  id="telephone"
                  value={form.telephone}
                  onChange={update('telephone')}
                  placeholder="+228 90 00 00 00"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="adresse">Adresse de livraison</Label>
                <Textarea
                  id="adresse"
                  value={form.adresse}
                  onChange={update('adresse')}
                  rows={3}
                  placeholder="Quartier, rue, point de repère"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes">Note pour le vendeur (optionnel)</Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={update('notes')}
                  rows={2}
                  placeholder="Horaires, instructions de livraison..."
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="font-heading text-2xl leading-none">{formatPrice(subtotal)}</span>
            </div>

            {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

            <Button type="submit" className="mt-4 w-full rounded-full" disabled={sending}>
              {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Valider ma commande
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}