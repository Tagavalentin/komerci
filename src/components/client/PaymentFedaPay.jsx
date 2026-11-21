// @ts-nocheck
import React, { useState } from 'react';
import { Loader2, Smartphone, ShieldCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/format';

// Paiement réel via FedaPay : crée la transaction côté serveur puis redirige
// vers la page de paiement sécurisée (carte bancaire ou mobile money).
export default function PaymentFedaPay({ references, total }) {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  async function handlePay() {
    setError('');
    setSending(true);
    try {
      const response = await base44.functions.invoke('initiatePayment', { references });
      const paymentUrl = response.data?.payment_url;
      if (!paymentUrl) {
        setError('Lien de paiement indisponible.');
        return;
      }
      window.location.assign(paymentUrl);
    } catch (e) {
      setError(e?.response?.data?.error || "Le paiement n'a pas pu démarrer.");
      setSending(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-5 text-left">
      <div className="flex items-center gap-2">
        <Smartphone className="h-4 w-4 text-accent" />
        <h2 className="font-heading text-lg leading-none">Paiement en ligne</h2>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        Payez par carte bancaire ou mobile money sur la page sécurisée FedaPay.
      </p>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      <Button type="button" className="mt-4 w-full rounded-full" disabled={sending} onClick={handlePay}>
        {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
        Payer {formatPrice(total)}
      </Button>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        Vous pouvez aussi payer plus tard : la commande reste « en attente ».
      </p>
    </div>
  );
}
