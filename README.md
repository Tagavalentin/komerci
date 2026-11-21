# Komerci

Application marketplace (React + Vite) avec backend local **Express + MySQL/MariaDB**.
Le frontend est une SPA qui consomme l'API via un client compatible (`src/api/client.js`),
qui reproduit la surface du SDK Base44 (`base44.entities.*`, `base44.auth.*`,
`base44.functions.invoke`, `base44.integrations.Core.UploadPublicFile`).

## Prérequis

1. **MySQL/MariaDB** accessible (XAMPP inclus : `C:\xampp\mysql\bin\mysqld.exe`).
2. Node.js 18+.

## Installation

```bash
npm install                 # frontend
cd server && npm install    # backend API
```

## Configuration

Copier `server/.env.example` vers `server/.env` et ajuster :

| Variable | Rôle |
|---|---|
| `DB_HOST` `DB_PORT` `DB_USER` `DB_PASSWORD` `DB_NAME` | Connexion MySQL (base créée automatiquement) |
| `JWT_SECRET` | Secret de signature des tokens (à changer en prod) |
| `ADMIN_EMAILS` | Emails promus `role=admin` à l'inscription/connexion |
| `APP_URL` | URL publique du frontend (liens emails, OAuth) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URI` | Connexion Google (optionnel) |
| `FEDAPAY_SECRET_KEY` / `FEDAPAY_WEBHOOK_SECRET` / `FEDAPAY_ENV` / `PUBLIC_APP_URL` | Paiement FedaPay (optionnel) |

## Lancer en dev

Trois processus :

```bash
# 1. MySQL (si XAMPP et non démarré)
C:\xampp\mysql\bin\mysqld.exe --defaults-file=C:\xampp\mysql\bin\my.ini --console

# 2. API backend (port 3001)
cd server && npm run dev        # ou : npm start

# 3. Frontend Vite (proxy /api → :3001)
npm run dev
```

Puis ouvrir l'URL affichée par Vite (http://localhost:5173 ou 5174).

## Structure

- `src/api/client.js` — client HTTP remplaçant `@base44/sdk`.
- `src/api/base44Client.js` — ré-export historique (`import { base44 } from '@/api/base44Client'`).
- `server/index.js` — routes auth, entités, fonctions, uploads, OAuth Google.
- `server/entities.js` — couche entités (table `records` + règles d'accès).
- `server/functions.js` — checkoutCart, initiatePayment, simulatePayment, updateOrderStatus, fedapayWebhook.
- `server/orderEmails.js` + `server/mailer.js` — emails logués en console (SMTP à brancher).

## Vérifications

```bash
npm run lint
npm run typecheck
npm run build
```
