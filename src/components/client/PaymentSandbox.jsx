// @ts-nocheck
import React, { useState } from 'react';
import { CreditCard, Loader2, ShieldCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatPrice } from '@/lib/format';

const TEST_CARDS = [
  { numero: '4242 4242 4242 4242', resultat: 'acceptée' },
  { numero: '4000 0000 0000 0002', resultat: 'refusée' },
];

const EMPTY_CARD = { numero: '', titulaire: '', expiration: '', cvc: '' };

export default function PaymentSandbox({ references, total, onPaid }) {
  const [card, setCard] = useState(EMPTY_CARD);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const update = (field) => (event) => setCard((prev) => ({ ...prev, [field]: event.target.value }));

  async function handlePay(event) {
    event.preventDefault();
    setError('');
    setSending(true);
    try {
      const response = await base44.functions.invoke('simulatePayment', {
        references,
        numero: card.numero,
        titulaire: card.titulaire,
        expiration: card.expiration,
        cvc: card.cvc,
      });
      onPaid(response.data);
    } catch (e) {
      setError(e?.response?.data?.error || "Le paiement n'a pas abouti.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handlePay} className="mt-6 rounded-2xl border border-border bg-card p-5 text-left">
      <div className="flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-accent" />
        <h2 className="font-heading text-lg leading-none">Paiement</h2>
        <span className="ml-auto rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
          Sandbox
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        Mode test : aucune vraie carte n'est demandée et aucun montant n'est débité.
      </p>

      <div className="mt-4 space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="card-numero">Numéro de carte de test</Label>
          <Input
            id="card-numero"
            value={card.numero}
            onChange={update('numero')}
            inputMode="numeric"
            placeholder="4242 4242 4242 4242"
            autoComplete="off"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="card-titulaire">Titulaire</Label>
          <Input
            id="card-titulaire"
            value={card.titulaire}
            onChange={update('titulaire')}
            placeholder="Nom sur la carte"
            autoComplete="off"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="card-expiration">Expiration</Label>
            <Input
              id="card-expiration"
              value={card.expiration}
              onChange={update('expiration')}
              placeholder="12/30"
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="card-cvc">CVC</Label>
            <Input
              id="card-cvc"
              value={card.cvc}
              onChange={update('cvc')}
              placeholder="123"
              inputMode="numeric"
              autoComplete="off"
            />
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <span>Cartes de test :</span>
        {TEST_CARDS.map((testCard) => (
          <button
            key={testCard.numero}
            type="button"
            onClick={() =>
              setCard({ numero: testCard.numero, titulaire: 'Client Test', expiration: '12/30', cvc: '123' })
            }
            className="rounded-full border border-border px-2.5 py-1 font-mono text-[10px] hover:border-accent hover:text-foreground"
          >
            {testCard.numero} · {testCard.resultat}
          </button>
        ))}
      </div>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      <Button type="submit" className="mt-4 w-full rounded-full" disabled={sending}>
        {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
        Payer {formatPrice(total)}
      </Button>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        Vous pouvez aussi payer plus tard : la commande reste « en attente ».
      </p>
    </form>
  );
}