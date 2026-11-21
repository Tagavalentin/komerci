// @ts-nocheck
import React from 'react';
import { Link } from 'react-router-dom';
import { LifeBuoy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FaqAccordion from '@/components/support/FaqAccordion';
import { FAQ_ITEMS } from '@/lib/faq';

const CATEGORIES = [...new Set(FAQ_ITEMS.map((item) => item.categorie))];

export default function Faq() {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">FAQ</p>
      <h1 className="font-heading text-3xl leading-tight sm:text-4xl">Questions fréquentes</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
        Livraison, retours, paiement et fonctionnement de la place de marché — les réponses aux
        questions que l'on nous pose le plus souvent.
      </p>

      <div className="mt-8 space-y-8">
        {CATEGORIES.map((categorie) => (
          <section key={categorie}>
            <h2 className="mb-3 font-heading text-xl">{categorie}</h2>
            <FaqAccordion items={FAQ_ITEMS.filter((item) => item.categorie === categorie)} />
          </section>
        ))}
      </div>

      <div className="mt-10 flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
            <LifeBuoy className="h-5 w-5" strokeWidth={1.7} />
          </span>
          <div>
            <p className="text-sm font-semibold">Vous ne trouvez pas votre réponse ?</p>
            <p className="text-xs text-muted-foreground">Notre équipe vous répond sous 48 heures.</p>
          </div>
        </div>
        <Button asChild className="rounded-full">
          <Link to="/support">Contacter le support</Link>
        </Button>
      </div>
    </div>
  );
}