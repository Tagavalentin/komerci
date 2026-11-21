// @ts-nocheck
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, ShoppingBasket, ArrowRight, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { isAdmin } from '@/lib/homeRoute';
import { Button } from '@/components/ui/button';
import Brand from '@/components/layout/Brand';

const CHOICES = [
  {
    value: 'vendeur',
    icon: Store,
    title: 'Je vends',
    text: 'Ouvrir ma boutique, publier mes produits et suivre mes commandes.',
  },
  {
    value: 'client',
    icon: ShoppingBasket,
    title: "J'achète",
    text: "Parcourir le marché et commander près de chez moi — l'espace client arrive à l'étape suivante.",
  },
];

export default function Onboarding() {
  const { user, checkUserAuth } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');

  // Seul l'administrateur attribue le statut vendeur : les autres comptes
  // choisissent uniquement entre « acheter » et le parcours par défaut.
  const choices = isAdmin(user) ? CHOICES : CHOICES.filter((c) => c.value === 'client');

  async function choose(value) {
    setBusy(value);
    setError('');
    try {
      await base44.auth.updateMe({ account_type: value });
      await checkUserAuth();
      navigate(value === 'vendeur' ? '/vendeur' : '/espace-client', { replace: true });
    } catch (e) {
      setError("Impossible d'enregistrer votre choix. Réessayez.");
      setBusy(null);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="mx-auto w-full max-w-3xl px-5 py-8">
        <Brand />
      </div>
      <div className="mx-auto w-full max-w-3xl flex-1 px-5 pb-16">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
          Bienvenue {user?.full_name ? user.full_name.split(' ')[0] : ''}
        </p>
        <h1 className="font-heading text-3xl leading-tight sm:text-4xl">
          Comment allez-vous utiliser Komerci ?
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
          Ce choix définit votre espace. Vous pourrez le modifier plus tard depuis vos paramètres.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {choices.map((choice) => {
            const Icon = choice.icon;
            return (
              <button
                key={choice.value}
                type="button"
                onClick={() => choose(choice.value)}
                disabled={!!busy}
                className="group rounded-2xl border border-border bg-card p-6 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" strokeWidth={1.7} />
                </span>
                <p className="mt-5 font-heading text-xl">{choice.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{choice.text}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-accent">
                  {busy === choice.value ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Enregistrement…
                    </>
                  ) : (
                    <>
                      Continuer <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {!isAdmin(user) && (
          <p className="mt-6 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
            Vous souhaitez vendre vos articles ? L'espace vendeur est ouvert sur demande par
            l'administrateur —{' '}
            <a href="/support" className="font-semibold text-foreground underline-offset-4 hover:underline">
              contactez le support
            </a>
            .
          </p>
        )}

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

        <div className="mt-10 flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => base44.auth.logout(window.location.origin)}>
            Se déconnecter
          </Button>
        </div>
      </div>
    </div>
  );
}