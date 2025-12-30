
import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";

import { faqItems } from '../../data/faq';
import { useLanguage } from '@/context/LanguageContext';
import { faqTranslations } from '@/data/translations';

const FAQ = () => {
  const { language } = useLanguage();
  const t = faqTranslations[language];
  return (
    <section id="faq" className="py-24 bg-gradient-to-b from-muted/50 to-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gradient">
            {t.mainHeading}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t.description}
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqItems.map((item, index) => {
              const faqTranslationsList = [
                { q: t.q1, a: t.a1 },
                { q: t.q2, a: t.a2 },
                { q: t.q3, a: t.a3 },
                { q: t.q4, a: t.a4 },
                { q: t.q5, a: t.a5 },
                { q: t.q6, a: t.a6 }
              ];
              
              const faqTrans = faqTranslationsList[index];
              
              return (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="bg-card backdrop-blur-sm border border-primary/10 rounded-2xl overflow-hidden animate-on-scroll shadow-sm"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <AccordionTrigger className="px-6 py-4 text-foreground hover:text-primary hover:no-underline">
                    {faqTrans?.q || item.question}
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-muted-foreground">
                    {faqTrans?.a || item.answer}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQ;





