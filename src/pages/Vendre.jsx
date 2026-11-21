// @ts-nocheck
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Loader2, Store } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { canSell } from '@/lib/homeRoute';
import Brand from '@/components/layout/Brand';
import { Button } from '@/components/ui/button';

const BENEFITS = [
  {
    title: 'Votre vitrine en quelques minutes',
    text: "Nom de la boutique, ville, photo : votre page vendeur est prête avant même votre premier produit.",
  },
  {
    title: 'Publiez ce que vous fabriquez',
    text: 'Photo, prix, stock — vos produits apparaissent immédiatement sur le marché de votre ville.',
  },
  {
    title: 'Encaissez sans intermédiaire',
    text: 'Les commandes arrivent dans votre espace avec les coordonnées du client. Vous livrez, vous êtes payé.',
  },
];

const STEPS = [
  { num: '01', title: 'Créez votre compte', text: 'Une adresse email, un mot de passe, et vous choisissez le profil vendeur.' },
  { num: '02', title: 'Habillez votre boutique', text: 'Le nom de votre commerce, votre ville et quelques mots sur votre savoir-faire.' },
  { num: '03', title: 'Mettez vos produits en ligne', text: 'Un produit publié = une commande possible dès la même journée.' },
];

const CHECKLIST = [
  'Aucun abonnement pour ouvrir votre boutique',
  'Vous fixez vous-même vos prix',
  'Stock et commandes suivis automatiquement',
  'Vos clients peuvent laisser un avis sur chaque produit',
];

export default function Vendre() {
  const { isAuthenticated, user, checkUserAuth } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const seller = canSell(user);

  async function openShop() {
    setError('');
    if (!isAuthenticated) {
      navigate('/register');
      return;
    }
    if (seller) {
      navigate('/vendeur');
      return;
    }
    setBusy(true);
    try {
      await base44.auth.updateMe({ account_type: 'vendeur' });
      await checkUserAuth();
      navigate('/vendeur', { replace: true });
    } catch (e) {
      setError("Impossible d'ouvrir votre boutique pour le moment. Réessayez.");
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-4">
          <Brand />
          <div className="flex items-center gap-1 sm:gap-2">
            {isAuthenticated ? (
              <Button variant="ghost" asChild className="rounded-full text-sm">
                <Link to={seller ? '/vendeur' : '/espace-client'}>Mon espace</Link>
              </Button>
            ) : (
              <Button variant="ghost" asChild className="rounded-full text-sm">
                <Link to="/login">Se connecter</Link>
              </Button>
            )}
            <Button className="rounded-full text-sm" onClick={openShop} disabled={busy}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {seller ? 'Mon espace vendeur' : 'Ouvrir ma boutique'}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-20">
        <section className="py-14 lg:py-20">
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <Store className="h-3.5 w-3.5 text-accent" />
            Devenir vendeur
          </p>
          <h1 className="mt-5 max-w-2xl font-heading text-[2.4rem] leading-[1.08] sm:text-5xl">
            Vous fabriquez ou vendez ?
            <span className="text-accent"> Ouvrez votre boutique.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
            Komerci accueille les commerçants, artisans et producteurs locaux. Publiez vos produits
            et laissez vos voisins commander directement auprès de vous.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button size="lg" className="rounded-full" onClick={openShop} disabled={busy}>
              {busy ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="mr-2 h-4 w-4" />
              )}
              {seller ? 'Aller à mon espace vendeur' : 'Ouvrir ma boutique'}
            </Button>
            {!isAuthenticated && (
              <span className="text-xs text-muted-foreground">
                Déjà inscrit ?{' '}
                <Link to="/login" className="font-semibold text-foreground underline-offset-4 hover:underline">
                  Connectez-vous
                </Link>
              </span>
            )}
          </div>
          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
        </section>

        <section className="grid grid-cols-1 gap-4 border-t border-border pt-10 md:grid-cols-3">
          {BENEFITS.map((benefit) => (
            <div key={benefit.title} className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-heading text-lg leading-snug">{benefit.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{benefit.text}</p>
            </div>
          ))}
        </section>

        <section className="mt-14 grid grid-cols-1 gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-start">
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
              Comment ça marche
            </p>
            <h2 className="font-heading text-3xl leading-tight">Trois étapes, et vous vendez.</h2>
            <div className="mt-7 space-y-6">
              {STEPS.map((step) => (
                <div key={step.num} className="flex gap-4 border-t border-border pt-4">
                  <p className="font-heading text-xl text-accent">{step.num}</p>
                  <div>
                    <h3 className="font-heading text-base">{step.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-primary p-7 text-primary-foreground">
            <h2 className="font-heading text-2xl leading-tight">Ce que vous obtenez</h2>
            <ul className="mt-5 space-y-3 text-sm">
              {CHECKLIST.map((item) => (
                <li key={item} className="flex gap-2.5 text-primary-foreground/85">
                  <Check className="mt-0.5 h-4 w-4 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Button
              className="mt-7 w-full rounded-full bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              onClick={openShop}
              disabled={busy}
            >
              {seller ? 'Mon espace vendeur' : 'Commencer maintenant'}
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-5 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>Komerci — le marché local, en ligne.</p>
          <div className="flex gap-5">
            <Link to="/" className="hover:text-foreground">Accueil</Link>
            <Link to="/espace-client" className="hover:text-foreground">Le marché</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}