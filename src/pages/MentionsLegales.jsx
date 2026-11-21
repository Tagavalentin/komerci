import React from 'react';
import { Link } from 'react-router-dom';

const SECTIONS = [
  {
    titre: 'Éditeur de la plateforme',
    texte:
      "Komerci est une place de marché de proximité éditée depuis Lomé, au Togo. Elle met en relation des commerçants et artisans locaux avec les habitants de leur quartier. Les coordonnées complètes de l'éditeur et son numéro d'enregistrement sont disponibles sur demande auprès du support.",
  },
  {
    titre: 'Objet du service',
    texte:
      "Komerci permet aux vendeurs de publier leur catalogue et aux clients de commander des produits en ligne. Chaque vente est conclue directement entre le vendeur et le client : Komerci n'est ni vendeur, ni propriétaire des produits proposés.",
  },
  {
    titre: 'Compte utilisateur',
    texte:
      "La création d'un compte requiert une adresse email valide. Vous êtes responsable de la confidentialité de vos identifiants et des actions effectuées depuis votre compte. Les informations fournies doivent être exactes et tenues à jour.",
  },
  {
    titre: 'Prix et paiement',
    texte:
      "Les prix sont affichés en francs CFA (XOF), toutes taxes comprises, et sont fixés par les vendeurs. Le paiement est effectué en ligne par carte bancaire via notre prestataire de paiement sécurisé. Aucune donnée de carte n'est conservée par Komerci.",
  },
  {
    titre: 'Livraison et retours',
    texte:
      "Les délais et modalités de livraison sont indiqués par chaque vendeur et confirmés dans le suivi de commande. Les produits alimentaires frais ne sont ni repris ni échangés ; pour les autres produits, tout problème doit être signalé sous 48 heures après réception via la page Support.",
  },
  {
    titre: 'Données personnelles',
    texte:
      "Les données collectées (identité, coordonnées, historique de commandes, messages adressés au support) servent uniquement à faire fonctionner le service : traitement des commandes, livraison, assistance et prévention des fraudes. Elles ne sont ni revendues ni cédées à des tiers. Vous pouvez demander l'accès, la rectification ou la suppression de vos données en écrivant au support.",
  },
  {
    titre: 'Cookies et stockage local',
    texte:
      "La plateforme utilise le stockage local de votre navigateur pour conserver votre panier, vos favoris et votre session. Ces éléments restent sur votre appareil et peuvent être effacés à tout moment depuis les réglages de votre navigateur.",
  },
  {
    titre: 'Responsabilité',
    texte:
      "Komerci met tout en œuvre pour assurer la disponibilité et la fiabilité du service, sans pouvoir la garantir de manière absolue. La responsabilité de l'éditeur ne saurait être engagée en cas d'inexactitude des informations publiées par un vendeur ou d'inexécution d'une commande par celui-ci.",
  },
  {
    titre: 'Propriété intellectuelle',
    texte:
      "La marque, l'interface et les contenus de Komerci sont protégés. Les photos et descriptions de produits restent la propriété des vendeurs, qui garantissent détenir les droits nécessaires à leur publication.",
  },
  {
    titre: 'Modification et droit applicable',
    texte:
      "Ces mentions peuvent être mises à jour pour refléter l'évolution du service. La version en vigueur est celle publiée sur cette page. Le service est soumis au droit togolais ; tout litige relève des juridictions compétentes de Lomé.",
  },
];

export default function MentionsLegales() {
  return (
    <div className="mx-auto max-w-3xl">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">Informations</p>
      <h1 className="font-heading text-3xl leading-tight sm:text-4xl">
        Mentions légales et conditions d'utilisation
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Dernière mise à jour : novembre 2026. En utilisant Komerci, vous acceptez les conditions
        décrites ci-dessous.
      </p>

      <div className="mt-8 space-y-7">
        {SECTIONS.map((section, index) => (
          <section key={section.titre} className="border-t border-border pt-5 first:border-t-0 first:pt-0">
            <h2 className="font-heading text-lg">
              <span className="mr-2 text-accent">{String(index + 1).padStart(2, '0')}</span>
              {section.titre}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{section.texte}</p>
          </section>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-border bg-card p-5">
        <p className="text-sm font-semibold">Une question sur ces conditions ?</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Écrivez-nous depuis la page{' '}
          <Link to="/support" className="font-semibold text-accent hover:underline">
            Support
          </Link>{' '}
          ou consultez la{' '}
          <Link to="/faq" className="font-semibold text-accent hover:underline">
            FAQ
          </Link>
          .
        </p>
      </div>
    </div>
  );
}