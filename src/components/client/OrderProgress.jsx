import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { key: 'recue', label: 'Reçue' },
  { key: 'preparation', label: 'En préparation' },
  { key: 'expediee', label: 'Expédiée' },
  { key: 'livree', label: 'Livrée' },
];

const STEP_INDEX = {
  en_attente: 0,
  payee: 0,
  en_preparation: 1,
  expediee: 2,
  livree: 3,
};

export default function OrderProgress({ statut }) {
  const current = STEP_INDEX[statut] ?? 0;

  return (
    <div className="flex items-start">
      {STEPS.map((step, index) => {
        const done = index <= current;
        return (
          <div key={step.key} className="flex-1">
            <div className="flex items-center">
              <span
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold',
                  done
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-muted-foreground',
                )}
              >
                {done ? <Check className="h-3 w-3" strokeWidth={3} /> : index + 1}
              </span>
              {index < STEPS.length - 1 && (
                <span className={cn('h-0.5 flex-1', index < current ? 'bg-primary' : 'bg-border')} />
              )}
            </div>
            <p
              className={cn(
                'mt-1.5 pr-1 text-[10px] leading-tight',
                done ? 'font-semibold text-foreground' : 'text-muted-foreground',
              )}
            >
              {step.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}