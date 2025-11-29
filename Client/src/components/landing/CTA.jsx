
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { ctaTranslations } from '@/data/translations';

const CTA = () => {
  const { language } = useLanguage();
  const t = ctaTranslations[language];
  return (
    <section className="py-24 bg-gradient-to-b from-white to-yamifit-light relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-yamifit-primary/10 rounded-full filter blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-yamifit-secondary/10 rounded-full filter blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto bg-white backdrop-blur-lg border border-yamifit-primary/20 rounded-3xl p-8 md:p-12 text-center shadow-xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 animate-fade-in text-yamifit-accent">
            {t.mainHeading}
          </h2>
          <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {t.description}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Button size="lg" className="bg-yamifit-primary hover:bg-yamifit-primary/90 text-white px-8 py-6 rounded-2xl">
              {t.ctaButton}
              
            </Button>
           
          </div>
          <p className="mt-6 text-sm text-gray-500 animate-fade-in" style={{ animationDelay: '0.6s' }}>
            {t.noCreditCard}
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTA;





