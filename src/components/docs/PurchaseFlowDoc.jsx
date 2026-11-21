import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { FLOW_SECTIONS, FLOW_CHECK } from '@/lib/purchaseDocs';

export default function PurchaseFlowDoc() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {FLOW_SECTIONS.map((section) => (
          <div key={section.titre} className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-heading text-xl leading-tight">{section.titre}</h2>
            <ul className="mt-3 space-y-2">
              {section.points.map((point) => (
                <li key={point} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
        <p className="flex items-center gap-2 text-sm font-semibold text-primary">
          <CheckCircle2 className="h-4 w-4" />
          {FLOW_CHECK.titre}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{FLOW_CHECK.intro}</p>
        <ul className="mt-3 space-y-1.5">
          {FLOW_CHECK.resultats.map((resultat) => (
            <li key={resultat} className="flex gap-2 text-sm text-foreground/80">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <span>{resultat}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}