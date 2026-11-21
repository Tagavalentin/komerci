// @ts-nocheck
import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowRight, Store, ReceiptText, Boxes } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
import { useAuth } from '@/lib/AuthContext';
import { homeRouteFor } from '@/lib/homeRoute';
import Brand from '@/components/layout/Brand';

const HERO =
  'https://media.base44.com/images/public/6ae483de3b2c1a317318c9e3/d1215ba35_generated_image.png';

const FEATURES = [
  {
    icon: Store,
    title: 'Une vitrine qui vous ressemble',
    text: "Nom de la boutique, photo, description, prix : votre catalogue est en ligne en quelques minutes, sans savoir coder.",
  },
  {
    icon: ReceiptText,
    title: 'Vos commandes, sous contrôle',
    text: "Chaque commande arrive dans votre espace avec l'adresse du client. Vous la préparez, l'expédiez, la clôturez.",
  },
  {
    icon: Boxes,
    title: 'Un stock toujours juste',
    text: 'Le stock se met à jour à chaque commande. Impossible de vendre ce que vous n’avez plus.',
  },
];

const STEPS = [
  { num: '01', title: 'Ouvrez votre boutique', text: 'Un compte vendeur, le nom de votre commerce, votre ville.' },
  { num: '02', title: 'Publiez vos produits', text: 'Une photo, un prix, un stock. Votre catalogue prend vie.' },
  { num: '03', title: 'Expédiez, encaissez', text: 'Vous suivez chaque commande du premier clic à la livraison.' },
];

export default function Landing() {
  const { isAuthenticated, isLoadingAuth, user } = useAuth();

  if (!isLoadingAuth && isAuthenticated && user) {
    return <Navigate to={homeRouteFor(user)} replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4">
          <Brand />
          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" asChild className="rounded-full text-sm">
              <Link to="/login">Se connecter</Link>
            </Button>
            <Button asChild className="rounded-full text-sm">
              <Link to="/register">Ouvrir ma boutique</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-5 py-14 lg:grid-cols-2 lg:gap-16 lg:py-24">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Le marché local, en ligne
            </p>
            <h1 className="font-heading text-[2.6rem] leading-[1.05] sm:text-6xl">
              Vendez ce que vous faites de mieux,
              <span className="text-accent"> près de chez vous.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground">
              Komerci réunit les commerçants et les artisans d'une même ville. Ouvrez votre
              boutique, montrez vos produits et gérez vos commandes depuis un seul espace — sans
              intermédiaire.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-full">
                <Link to="/register">
                  Ouvrir ma boutique
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full">
                <Link to="/login">J'ai déjà un compte</Link>
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-xs text-muted-foreground">
              <span>Stock mis à jour en temps réel</span>
              <span className="hidden h-3 w-px bg-border sm:block" />
              <span>Commandes suivies de bout en bout</span>
              <span className="hidden h-3 w-px bg-border sm:block" />
              <span>Sans commission cachée</span>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-[4/5] w-full overflow-hidden rounded-[2rem] border border-border bg-secondary">
              <Image src={HERO} alt="Étal de produits frais sur un marché local" className="h-full w-full object-cover" />
            </div>
            <div className="absolute -bottom-6 left-4 right-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:left-8 sm:right-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Cette semaine
              </p>
              <div className="mt-2 flex items-end justify-between gap-4">
                <div>
                  <p className="font-heading text-2xl leading-none">128 produits</p>
                  <p className="mt-1 text-xs text-muted-foreground">publiés par les vendeurs du quartier</p>
                </div>
                <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-semibold text-accent">
                  +12 %
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-card/50">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 px-5 py-16 md:grid-cols-3">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="rounded-2xl border border-border bg-card p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" strokeWidth={1.7} />
                  </span>
                  <h2 className="mt-5 font-heading text-xl leading-snug">{feature.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16 lg:py-20">
          <div className="mb-10 max-w-xl">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
              Comment ça marche
            </p>
            <h2 className="font-heading text-3xl leading-tight sm:text-4xl">
              Trois étapes, et votre boutique tourne.
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.num} className="border-t border-border pt-5">
                <p className="font-heading text-2xl text-accent">{step.num}</p>
                <h3 className="mt-3 font-heading text-lg">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-16">
          <div className="rounded-[2rem] bg-primary px-7 py-12 text-primary-foreground sm:px-12">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <h2 className="font-heading text-3xl leading-tight sm:text-4xl">
                  Votre premier client est peut-être à deux rues d'ici.
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-primary-foreground/70">
                  Créez votre boutique vendeur et publiez votre premier produit aujourd'hui.
                </p>
              </div>
              <Button asChild size="lg" className="shrink-0 rounded-full bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                <Link to="/register">
                  Commencer
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>Komerci — le marché local, en ligne.</p>
          <div className="flex gap-5">
            <Link to="/login" className="hover:text-foreground">Espace vendeur</Link>
            <Link to="/register" className="hover:text-foreground">Créer une boutique</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}