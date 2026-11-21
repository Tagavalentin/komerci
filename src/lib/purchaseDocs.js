// Documentation du tunnel d'achat (panier → commande → paiement sandbox)
// et scénarios de test associés. Source unique de vérité pour la page /documentation.

export const FLOW_SECTIONS = [
  {
    titre: '1. Le panier',
    points: [
      'Le panier est mémorisé dans le navigateur du client : il survit au rafraîchissement de la page et reste disponible après reconnexion, sur le même appareil.',
      'Les articles sont regroupés par boutique. Le compteur de l’en-tête compte les unités (pas les lignes).',
      'La quantité va de 1 au stock affiché du produit ; le bouton « + » s’arrête automatiquement à la limite.',
      'Le sous-total affiché est indicatif : les prix sont toujours recalculés par le serveur au moment de la commande.',
    ],
  },
  {
    titre: '2. Valider la commande',
    points: [
      'Champs demandés : nom (prérempli), téléphone (6 caractères minimum), adresse de livraison (5 caractères minimum) et une note facultative limitée à 500 caractères.',
      'Les contrôles existent dans l’interface puis sont rejoués côté serveur : impossible de créer une commande avec une adresse vide en contournant le formulaire.',
      'Limites serveur : 40 lignes différentes maximum, 1 à 99 unités par article.',
      'Le client doit être connecté (sinon la commande est refusée avec un message de connexion).',
    ],
  },
  {
    titre: '3. Création des commandes',
    points: [
      'Les produits sont relus en base : prix, stock et vendeur viennent toujours du serveur, jamais du navigateur.',
      'Produit supprimé entre-temps → « Un article du panier n’est plus disponible » ; stock insuffisant → message indiquant la quantité restante.',
      'Une commande par boutique : référence ML-123456 pour une seule boutique, ou ML-123456-1 / -2 quand le panier mélange plusieurs vendeurs.',
      'La commande démarre au statut « en attente », les prix sont figés dans les lignes, et le stock est décrémenté immédiatement.',
      'Après la confirmation, le panier est vidé.',
    ],
  },
  {
    titre: '4. Paiement sandbox',
    points: [
      'Aucun débit réel : seules les cartes de test sont acceptées.',
      '4242 4242 4242 4242 → paiement accepté. 4000 0000 0000 0002 → carte refusée. 4000 0000 0000 9995 → fonds insuffisants. Toute autre carte est rejetée avec un rappel des cartes de test.',
      'Format attendu : numéro de 12 à 19 chiffres, titulaire de 2 caractères minimum, expiration au format MM/AA, CVC de 3 chiffres minimum.',
      'La commande doit appartenir au client connecté et être encore « en attente », sinon le paiement est refusé (commande déjà traitée).',
      'En cas de succès : statut « payée », transaction SBX-xxxxxxxxx, quatre derniers chiffres affichés.',
      'Payer plus tard : la commande reste « en attente » et reste consultable dans « Mes commandes ». Il n’existe pas encore de bouton pour reprendre un paiement depuis cette page.',
    ],
  },
  {
    titre: '5. Après le paiement',
    points: [
      'en attente / payée → en préparation ou annulée.',
      'en préparation → expédiée ou annulée.',
      'expédiée → livrée. « Livrée » et « annulée » sont des états finaux.',
      'Seuls le vendeur de la commande ou un administrateur peuvent changer le statut ; toute autre transition est refusée.',
      'Le client voit les changements de statut en temps réel sur « Mes commandes ».',
      'Chaque changement de statut envoie automatiquement un email au client (référence, nouveau statut, boutique, montant, adresse de livraison) ; le paiement réussi envoie aussi un email de confirmation. Un échec d’envoi n’annule jamais le changement de statut.',
    ],
  },
];

export const FLOW_CHECK = {
  titre: 'Vérification du 9 novembre 2026',
  intro: 'Le parcours complet a été exécuté sur la base de l’application avec un produit de test, puis les données de test ont été supprimées.',
  resultats: [
    'Panier vide → refus « Votre panier est vide ».',
    'Commande de 2 × 1 500 FCFA → commande ML-575377 créée, total 3 000 FCFA, stock passé de 3 à 1.',
    'Carte 4000 0000 0000 0002 → « Paiement refusé : carte refusée », commande toujours en attente.',
    'Carte inconnue → rappel des cartes de test.',
    'Carte 4242 4242 4242 4242 → paiement accepté, transaction SBX-50581216, statut « payée ».',
    'Nouvelle tentative de paiement sur la même commande → « Cette commande a déjà été traitée ».',
  ],
};

export const TEST_SCENARIOS = [
  {
    id: 'T1',
    titre: 'Panier mono-boutique',
    etapes: ['Ajouter deux produits de la même boutique.', 'Ouvrir /panier.'],
    attendu: 'Un seul bloc boutique, sous-total = somme des lignes, compteur d’en-tête = nombre d’unités.',
  },
  {
    id: 'T2',
    titre: 'Limite de stock dans le panier',
    etapes: ['Choisir un produit avec 1 en stock.', 'Cliquer plusieurs fois sur « + ».'],
    attendu: 'La quantité plafonne à 1 ; aucune quantité supérieure au stock n’est possible.',
  },
  {
    id: 'T3',
    titre: 'Panier vide',
    etapes: ['Vider le panier.', 'Ouvrir /panier.'],
    attendu: 'Écran « Votre panier est vide » avec un lien vers le marché, aucun formulaire de commande.',
  },
  {
    id: 'T4',
    titre: 'Adresse trop courte',
    etapes: ['Ajouter un article.', 'Saisir une adresse de moins de 5 caractères.', 'Valider.'],
    attendu: 'Message « Indiquez une adresse de livraison complète », aucune commande créée.',
  },
  {
    id: 'T5',
    titre: 'Téléphone trop court',
    etapes: ['Saisir un téléphone de moins de 6 caractères.', 'Valider.'],
    attendu: 'Message « Indiquez un numéro de téléphone pour vous joindre », aucune commande créée.',
  },
  {
    id: 'T6',
    titre: 'Commande acceptée',
    etapes: ['Panier valide d’une boutique.', 'Renseigner adresse et téléphone.', 'Valider.'],
    attendu: 'Écran de confirmation avec référence ML-xxxxxx, panier vidé, stock diminué, statut « en attente ».',
  },
  {
    id: 'T7',
    titre: 'Commande multi-boutiques',
    etapes: ['Ajouter un produit de deux boutiques différentes.', 'Valider la commande.'],
    attendu: 'Une commande par boutique (références -1 et -2), total global = somme des deux commandes.',
  },
  {
    id: 'T8',
    titre: 'Stock épuisé entre-temps',
    etapes: ['Mettre le stock d’un produit du panier à 0 depuis l’espace vendeur.', 'Valider la commande côté client.'],
    attendu: 'Message « Stock insuffisant pour « … » : il en reste 0 », aucune commande ni décrément supplémentaire.',
  },
  {
    id: 'T9',
    titre: 'Carte de test refusée',
    etapes: ['Sur l’écran de confirmation, cliquer sur la carte 4000 0000 0000 0002.', 'Payer.'],
    attendu: 'Message « Paiement refusé : carte refusée. Aucun montant n’a été débité. », commande toujours en attente.',
  },
  {
    id: 'T10',
    titre: 'Carte inconnue',
    etapes: ['Saisir 7777 7777 7777 7777 avec une date et un CVC valides.', 'Payer.'],
    attendu: 'Message rappelant les cartes de test acceptées.',
  },
  {
    id: 'T11',
    titre: 'Format de carte invalide',
    etapes: ['Saisir une expiration au format 2030-12.', 'Payer.'],
    attendu: 'Message « Date d’expiration au format MM/AA », aucun changement de statut.',
  },
  {
    id: 'T12',
    titre: 'Paiement accepté',
    etapes: ['Cliquer sur la carte 4242 4242 4242 4242.', 'Payer.'],
    attendu: 'Écran « Commande payée », transaction SBX-xxxx, carte ••••4242, statut « payée » dans Mes commandes.',
  },
  {
    id: 'T13',
    titre: 'Double paiement',
    etapes: ['Rejouer le paiement sur une commande déjà payée.'],
    attendu: 'Message « Cette commande a déjà été traitée », statut inchangé.',
  },
  {
    id: 'T14',
    titre: 'Payer plus tard',
    etapes: ['Après la confirmation, quitter sans payer.', 'Ouvrir Mes commandes.'],
    attendu: 'La commande apparaît en « en attente » et reste visible ; aucun débit.',
  },
  {
    id: 'T15',
    titre: 'Suivi vendeur',
    etapes: ['En tant que vendeur, passer la commande en préparation, puis expédiée, puis livrée.', 'Revenir côté client.'],
    attendu: 'Chaque changement est visible immédiatement dans Mes commandes ; une transition invalide est refusée.',
  },
  {
    id: 'T17',
    titre: 'Email de changement de statut',
    etapes: ['Commander avec votre propre adresse email.', 'En tant que vendeur, passer la commande en préparation.'],
    attendu: 'Un email « Commande ML-xxxxxx — En préparation » arrive avec le montant, la boutique et l’adresse de livraison.',
  },
  {
    id: 'T16',
    titre: 'Accès refusé',
    etapes: ['Se déconnecter.', 'Ouvrir /panier directement.'],
    attendu: 'Redirection vers la page de connexion, aucune commande possible sans compte.',
  },
];