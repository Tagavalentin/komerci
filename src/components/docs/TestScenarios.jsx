import React, { useState } from 'react';
import { Circle, CircleCheck } from 'lucide-react';
import { TEST_SCENARIOS } from '@/lib/purchaseDocs';
import { cn } from '@/lib/utils';

export default function TestScenarios() {
  const [done, setDone] = useState([]);
  const toggle = (id) =>
    setDone((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-5 py-3">
        <p className="text-sm text-muted-foreground">
          Cochez chaque scénario rejoué lors de votre recette.
        </p>
        <p className="font-heading text-base">
          {done.length} / {TEST_SCENARIOS.length} validés
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {TEST_SCENARIOS.map((scenario) => {
          const checked = done.includes(scenario.id);
          return (
            <div
              key={scenario.id}
              className={cn(
                'rounded-2xl border p-5 transition-colors',
                checked ? 'border-primary/30 bg-primary/5' : 'border-border bg-card',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                    {scenario.id}
                  </p>
                  <h3 className="mt-1 font-heading text-lg leading-tight">{scenario.titre}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => toggle(scenario.id)}
                  aria-label={checked ? 'Marquer comme à tester' : 'Marquer comme validé'}
                  className="shrink-0 text-muted-foreground hover:text-primary"
                >
                  {checked ? (
                    <CircleCheck className="h-5 w-5 text-primary" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </button>
              </div>

              <ol className="mt-3 space-y-1 text-sm text-muted-foreground">
                {scenario.etapes.map((etape, index) => (
                  <li key={etape} className="flex gap-2">
                    <span className="font-semibold text-foreground/60">{index + 1}.</span>
                    <span>{etape}</span>
                  </li>
                ))}
              </ol>

              <p className="mt-3 rounded-xl bg-secondary/60 px-3 py-2 text-sm leading-relaxed">
                <span className="font-semibold">Attendu : </span>
                {scenario.attendu}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}