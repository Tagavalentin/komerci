import { sendEmail } from './mailer.js';

export const STATUS_LABELS = {
  en_attente: 'En attente de paiement',
  payee: 'Payée',
  en_preparation: 'En préparation',
  expediee: 'Expédiée',
  livree: 'Livrée',
  annulee: 'Annulée',
};

const STATUS_MESSAGES = {
  payee: 'Nous avons bien reçu votre paiement. Le vendeur prépare maintenant votre commande.',
  en_preparation: 'Votre commande est en cours de préparation par le vendeur.',
  expediee: 'Votre commande vient de partir. Vous serez livré prochainement.',
  livree: 'Votre commande est marquée comme livrée. Merci de votre confiance !',
  annulee: 'Votre commande a été annulée. Si vous avez déjà payé, contactez le support pour un remboursement.',
  en_attente: 'Votre commande est enregistrée et attend son paiement.',
};

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildHtml(order, statut) {
  const label = STATUS_LABELS[statut] || statut;
  const message = STATUS_MESSAGES[statut] || '';
  const total = Number(order.total) || 0;

  return `<!doctype html>
<html lang="fr"><body style="margin:0;background:#f7f2e8;font-family:Helvetica,Arial,sans-serif;color:#172922;">
  <div style="max-width:560px;margin:0 auto;padding:28px 20px;">
    <p style="margin:0 0 18px;font-size:20px;font-weight:700;color:#1f473b;">Komerci</p>
    <div style="background:#ffffff;border-radius:14px;padding:24px;">
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#b65c3a;">Commande ${escapeHtml(order.reference)}</p>
      <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#1f473b;">${escapeHtml(label)}</h1>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#3d4f47;">Bonjour ${escapeHtml(order.client_nom || '')}, ${escapeHtml(message)}</p>
      <table style="width:100%;font-size:14px;color:#3d4f47;border-collapse:collapse;">
        <tr><td style="padding:6px 0;">Boutique</td><td style="padding:6px 0;text-align:right;font-weight:600;">${escapeHtml(order.vendeur_nom || '—')}</td></tr>
        <tr><td style="padding:6px 0;">Montant</td><td style="padding:6px 0;text-align:right;font-weight:600;">${total.toLocaleString('fr-FR')} FCFA</td></tr>
        <tr><td style="padding:6px 0;">Livraison</td><td style="padding:6px 0;text-align:right;">${escapeHtml(order.adresse_livraison || '—')}</td></tr>
      </table>
    </div>
    <p style="margin:18px 0 0;font-size:12px;line-height:1.6;color:#8a968f;">Vous recevez cet email car une commande a été passée avec cette adresse sur Komerci.</p>
  </div>
</body></html>`;
}

export async function sendOrderStatusEmail(order, statut) {
  const to = String(order.client_email || '').trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
    return { sent: false, reason: 'Adresse client absente' };
  }

  const label = STATUS_LABELS[statut] || statut;
  const result = await sendEmail({
    to,
    subject: `Commande ${order.reference} — ${label}`,
    html: buildHtml(order, statut),
  });
  return { ...result, label };
}
