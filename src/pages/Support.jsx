// @ts-nocheck
import React from 'react';
import { Link } from 'react-router-dom';
import { LifeBuoy, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FaqAccordion from '@/components/support/FaqAccordion';
import SupportForm from '@/components/support/SupportForm';
import { FAQ_ITEMS } from '@/lib/faq';

const SUPPORT_FAQ = FAQ_ITEMS.filter((item) =>
  ['Fonctionnement', 'Livraison'].includes(item.categorie),
);

export default function Support() {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">Support</p>
      <h1 className="font-heading text-3xl leading-tight sm:text-4xl">Comment pouvons-nous vous aider ?</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
        Les réponses aux questions les plus fréquentes, et un formulaire pour nous écrire directement.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1.3fr_1fr]">
        <section>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-xl">Questions fréquentes</h2>
            <Button asChild variant="ghost" size="sm" className="rounded-full text-xs">
              <Link to="/faq">Toute la FAQ</Link>
            </Button>
          </div>
          <div className="mt-3">
            <FaqAccordion items={SUPPORT_FAQ} />
          </div>

          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                <LifeBuoy className="h-5 w-5" strokeWidth={1.7} />
              </span>
              <div>
                <p className="text-sm font-semibold">Une commande en cours de problème ?</p>
                <p className="text-xs text-muted-foreground">
                  Indiquez sa référence dans le formulaire : nous traitons ces demandes en priorité.
                </p>
              </div>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              Réponse sous 48 h
            </span>
          </div>
        </section>

        <section>
          <SupportForm />
        </section>
      </div>
    </div>
  );
}