// @ts-nocheck
import React from 'react';
import { BookOpen, ListChecks } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PurchaseFlowDoc from '@/components/docs/PurchaseFlowDoc';
import TestScenarios from '@/components/docs/TestScenarios';

export default function Documentation() {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
        Référence
      </p>
      <h1 className="font-heading text-3xl leading-tight sm:text-4xl">
        Tunnel d’achat — documentation et tests
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Du panier au paiement sandbox : le fonctionnement de chaque étape, puis les scénarios à rejouer
        avant chaque mise en ligne.
      </p>

      <Tabs defaultValue="parcours" className="mt-6">
        <TabsList className="rounded-full">
          <TabsTrigger value="parcours" className="rounded-full">
            <BookOpen className="mr-2 h-4 w-4" />
            Fonctionnement
          </TabsTrigger>
          <TabsTrigger value="tests" className="rounded-full">
            <ListChecks className="mr-2 h-4 w-4" />
            Scénarios de test
          </TabsTrigger>
        </TabsList>
        <TabsContent value="parcours" className="mt-5">
          <PurchaseFlowDoc />
        </TabsContent>
        <TabsContent value="tests" className="mt-5">
          <TestScenarios />
        </TabsContent>
      </Tabs>
    </div>
  );
}