
import { Button } from "@/components/ui/button";
import { steps } from "../../data/how-it-works";
import { useLanguage } from '@/context/LanguageContext';
import { howItWorksTranslations } from '@/data/translations';


const HowItWorks = () => {
  const { language } = useLanguage();
  const t = howItWorksTranslations[language];
  return (
    <section id="how-it-works" className="py-24 bg-gradient-to-b from-background to-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gradient">
            {t.mainHeading}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t.description}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const stepTranslations = [
              { title: t.step1Title, desc: t.step1Desc },
              { title: t.step2Title, desc: t.step2Desc },
              { title: t.step3Title, desc: t.step3Desc },
              { title: t.step4Title, desc: t.step4Desc }
            ];
            
            const stepTrans = stepTranslations[index];
            
            return (
              <div 
                key={index}
                className="relative bg-card backdrop-blur-sm border border-primary/10 rounded-2xl p-8 animate-on-scroll hover:shadow-lg hover:border-primary/30 transition-all duration-300"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <span className="absolute -top-4 -start-4 bg-secondary border-2 rounded-xl border-secondary/30 text-secondary-foreground font-bold text-xl px-3 py-1">
                  {step.number}
                </span>
                <div className="bg-primary/10 rounded-xl w-12 h-12 flex items-center justify-center mb-6 text-primary">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold mb-4 text-foreground">{stepTrans?.title || step.title}</h3>
                <p className="text-muted-foreground">{stepTrans?.desc || step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;





