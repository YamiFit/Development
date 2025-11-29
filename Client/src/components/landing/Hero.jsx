
import { ArrowRight, ArrowUpRight, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { heroTranslations } from '@/data/translations';

const Hero = () => {
  const { language } = useLanguage();
  const t = heroTranslations[language];
  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-gradient-hero hero-glow">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-10 w-72 h-72 bg-yamifit-primary/10 rounded-full filter blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-yamifit-secondary/10 rounded-full filter blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="flex flex-col lg:flex-row items-center">
          <div className="lg:w-1/2 animate-fade-in-left">
            <div className="inline-flex items-center bg-yamifit-primary/10 backdrop-blur-sm border border-yamifit-primary/20 rounded-full px-4 py-1.5 mb-6">
              <span className="text-xs font-medium text-yamifit-primary mr-2">{t.badge}</span>
              <span className="text-xs text-yamifit-accent">{t.badgeFeature}</span>
              <ChevronRight className="h-4 w-4 text-yamifit-secondary ml-1" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-yamifit-accent">
              {t.mainHeading} <span className="text-gradient">{t.highlight}</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-lg">
              {t.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/signup">
                <Button size="lg" className="bg-yamifit-primary hover:bg-yamifit-primary/90 text-white px-8 py-6 rounded-2xl">
                  {t.startJourney}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
               <a href="#pricing" className="inline-flex">
                <Button variant="outline" size="lg" className="border-yamifit-secondary text-yamifit-secondary hover:bg-yamifit-secondary/10 py-6 rounded-2xl">
                  {t.explorePlans}
                  <ArrowUpRight className="ml-2 h-5 w-5" />
                </Button>
              </a>
            </div>
            <div className={`mt-8 flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''} space-x-6`}>
              <div>
                <p className="text-2xl font-bold text-yamifit-accent">{t.activeUsers}</p>
                <p className="text-sm text-gray-500">{t.activeUsersLabel}</p>
              </div>
              <div className="h-12 w-px bg-gray-300"></div>
              <div>
                <p className="text-2xl font-bold text-yamifit-accent">{t.mealsTacked}</p>
                <p className="text-sm text-gray-500">{t.mealsTrackedLabel}</p>
              </div>
              <div className="h-12 w-px bg-gray-300"></div>
              <div>
                <p className="text-2xl font-bold text-yamifit-accent">{t.TrustedbyFitnessEnthusiastsWorldwide}</p>
                <p className="text-sm text-gray-500">{t.trustedBy}</p>
              </div>
            </div>
          </div>

          <div className="lg:w-1/2 mt-12 lg:mt-0 animate-fade-in-right">
            <div className="relative max-w-md mx-auto animate-float">
              <img 
                src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&h=800"
                alt="Healthy food and nutrition tracking" 
                className="rounded-3xl shadow-2xl border border-yamifit-primary/20"
              />
              <div className="absolute -right-6 -bottom-6 bg-white backdrop-blur-md rounded-2xl p-4 border border-yamifit-primary/30 shadow-lg">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-yamifit-primary/20 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yamifit-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t.caloriesSaved}</p>
                    <p className="text-lg font-bold text-yamifit-primary">{t.caloriesValue}</p>
                  </div>
                </div>
              </div>
              <div className="absolute -left-6 -top-6 bg-white backdrop-blur-md rounded-2xl p-4 border border-yamifit-secondary/30 shadow-lg">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-yamifit-secondary/20 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yamifit-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t.todayGoal}</p>
                    <p className="text-lg font-bold text-yamifit-accent">{t.completed}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;





