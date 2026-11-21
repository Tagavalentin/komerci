// @ts-nocheck
import React, { useState } from 'react';
import { CheckCircle2, Loader2, Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function SupportForm() {
  const { user } = useAuth();
  const [nom, setNom] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [sujet, setSujet] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    if (!email.trim() || !message.trim()) {
      setError('Renseignez votre email et votre message.');
      return;
    }
    setSending(true);
    setError('');
    try {
      await base44.entities.SupportMessage.create({
        nom: nom.trim(),
        email: email.trim(),
        sujet: sujet.trim(),
        message: message.trim(),
        statut: 'nouveau',
      });
      setSent(true);
      setSujet('');
      setMessage('');
    } catch (e) {
      setError("Votre message n'a pas pu être envoyé. Réessayez dans un instant.");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="h-6 w-6" strokeWidth={1.7} />
        </span>
        <p className="mt-4 font-heading text-xl">Message envoyé</p>
        <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
          Merci, notre équipe vous répond sous 48 heures à l'adresse {email}.
        </p>
        <Button variant="outline" className="mt-5 rounded-full" onClick={() => setSent(false)}>
          Écrire un autre message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-5">
      <h2 className="font-heading text-xl">Écrivez-nous</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Une question sur une commande, un produit ou votre boutique : nous répondons sous 48 heures.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="support-nom">Votre nom</Label>
          <Input id="support-nom" value={nom} onChange={(event) => setNom(event.target.value)} placeholder="Ama Koffi" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="support-email">Votre email</Label>
          <Input
            id="support-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="vous@exemple.com"
          />
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        <Label htmlFor="support-sujet">Sujet</Label>
        <Input
          id="support-sujet"
          value={sujet}
          onChange={(event) => setSujet(event.target.value)}
          placeholder="Commande, livraison, boutique..."
        />
      </div>

      <div className="mt-3 space-y-1.5">
        <Label htmlFor="support-message">Votre message</Label>
        <Textarea
          id="support-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={5}
          placeholder="Décrivez votre demande en quelques lignes."
        />
      </div>

      {error && <p className="mt-3 text-xs text-destructive">{error}</p>}

      <Button type="submit" className="mt-4 w-full rounded-full" disabled={sending}>
        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Envoyer le message
      </Button>
    </form>
  );
}