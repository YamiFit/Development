import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { pricingPlans } from '@/data/pricing';
import { useLanguage } from '@/context/LanguageContext';
import { pricingTranslations } from '@/data/translations';


const Pricing = () => {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const { language } = useLanguage();
  const t = pricingTranslations[language];

  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gradient">
            {t.mainHeading}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">
            {t.description}
          </p>
          
          <div className="inline-flex p-1 bg-yamifit-light backdrop-blur-sm border border-yamifit-primary/20 rounded-full">
            <button
              className={`px-4 py-2 rounded-full transition-colors ${
                billingCycle === 'monthly' ? 'bg-yamifit-primary text-white' : 'text-gray-600'
              }`}
              onClick={() => setBillingCycle('monthly')}
            >
              {t.billedMonthly}
            </button>
            <button
              className={`px-4 py-2 rounded-full transition-colors ${
                billingCycle === 'annual' ? 'bg-yamifit-primary text-white' : 'text-gray-600'
              }`}
              onClick={() => setBillingCycle('annual')}
            >
              {t.billedYearly} <span className="text-xs font-medium">{t.save20}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingPlans.map((plan, index) => {
            const planTranslations = {
              'Basic': { 
                name: t.basic, 
                desc: t.basicDesc, 
                features: [t.basicFeature1, t.basicFeature2, t.basicFeature3, t.basicFeature4],
                price: t.basicPrice,
                button: t.startTrial
              },
              'Pro': { 
                name: t.pro, 
                desc: t.proDesc, 
                features: [t.proFeature1, t.proFeature2, t.proFeature3, t.proFeature4, t.proFeature5],
                price: t.proPrice,
                button: t.upgrade
              },
              'Premium': { 
                name: t.elite, 
                desc: t.eliteDesc, 
                features: [t.eliteFeature1, t.eliteFeature2, t.eliteFeature3, t.eliteFeature4, t.eliteFeature5],
                price: t.elitePrice,
                button: t.upgrade
              }
            };
            
            const planTrans = planTranslations[plan.name];
            
            return (
              <div 
                key={index} 
                className={`bg-white backdrop-blur-sm border rounded-2xl overflow-hidden animate-on-scroll shadow-lg ${
                  plan.highlighted 
                    ? 'border-yamifit-primary relative shadow-xl shadow-yamifit-primary/10' 
                    : 'border-yamifit-primary/10'
                }`}
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                {plan.highlighted && (
                  <div className="bg-yamifit-secondary text-white text-center py-1 text-sm font-medium">
                    {t.pro === planTrans.name ? 'Most Popular' : ''}
                  </div>
                )}
                <div className="p-8">
                  <h3 className="text-xl font-semibold mb-2 text-yamifit-accent">{planTrans?.name || plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-3xl md:text-4xl font-bold text-yamifit-accent">
                      {billingCycle === 'monthly' ? plan.price.monthly : plan.price.annual}
                    </span>
                    <span className="text-gray-500 ml-1">{plan.price.monthly !== "$0" ? t.perMonth : ""}</span>
                  </div>
                  <p className="text-gray-600 mb-6">{planTrans?.desc || plan.description}</p>
                  
                  <Button 
                    className={`w-full mb-6 rounded-2xl ${
                      plan.highlighted 
                        ? 'bg-yamifit-primary hover:bg-yamifit-primary/90' 
                        : 'bg-yamifit-secondary hover:bg-yamifit-secondary/90 text-white'
                    }`}
                  >
                    {planTrans?.button || plan.buttonText}
                  </Button>
                  
                  <div>
                    <p className="text-sm font-medium text-yamifit-accent mb-4">{t.whatsIncluded}</p>
                    <ul className="space-y-3">
                      {(planTrans?.features || plan.features).map((feature, i) => (
                        <li key={i} className="flex items-start">
                          <Check className="h-5 w-5 text-yamifit-primary mr-3 shrink-0" />
                          <span className="text-gray-600 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Pricing;


