// @ts-nocheck
import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Retour de FedaPay après le paiement : la commande passe à « payée » via le
// webhook ; cette page confirme simplement le résultat au client.
export default function PaiementRetour() {
  const [params] = useSearchParams();
  const status = params.get('status');
  const transactionId = params.get('id');
  const approved = status === 'approved';
  const canceled = status === 'canceled' || status === 'declined';

  return (
    <div className="mx-auto max-w-md py-10 text-center">
      <span
        className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
          approved ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
        }`}
      >
        {approved ? <CheckCircle2 className="h-7 w-7" strokeWidth={1.7} /> : <XCircle className="h-7 w-7" strokeWidth={1.7} />}
      </span>

      <h1 className="mt-5 font-heading text-3xl leading-tight">
        {approved ? 'Paiement confirmé' : canceled ? 'Paiement annulé' : 'Paiement en cours'}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {approved
          ? 'Merci ! Votre paiement a été accepté. Le vendeur peut maintenant préparer votre commande.'
          : canceled
            ? 'Le paiement n’a pas abouti. Votre commande reste « en attente » : vous pouvez réessayer depuis le récapitulatif.'
            : 'Nous attendons la confirmation du paiement. Votre commande passera à « payée » dès validation.'}
      </p>

      {transactionId && (
        <p className="mt-3 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
          Transaction {transactionId}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button asChild className="rounded-full">
          <Link to="/mes-commandes">Suivre mes commandes</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <Link to="/espace-client">Retour au marché</Link>
        </Button>
      </div>
    </div>
  );
}
