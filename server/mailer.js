// Envoi d'emails : pour l'instant tout est logué dans la console du serveur.
// Pour brancher un vrai SMTP plus tard, implémenter sendEmail ici (nodemailer…).

export async function sendEmail({ to, subject, html, text }) {
  console.log('\n========== EMAIL (non envoyé) ==========');
  console.log(`À      : ${to}`);
  console.log(`Sujet  : ${subject}`);
  if (text) console.log(`Texte  : ${text}`);
  if (html) console.log(`HTML   : ${String(html).slice(0, 500)}…`);
  console.log('========================================\n');
  return { sent: false, reason: 'Emails en mode console (SMTP non configuré)' };
}
