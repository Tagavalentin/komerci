// @ts-nocheck
import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function FaqAccordion({ items }) {
  return (
    <Accordion type="single" collapsible className="overflow-hidden rounded-2xl border border-border bg-card">
      {items.map((item, index) => (
        <AccordionItem key={item.question} value={`faq-${index}`} className="px-4 last:border-b-0">
          <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline">
            {item.question}
          </AccordionTrigger>
          <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
            {item.reponse}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}