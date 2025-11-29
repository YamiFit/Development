
import { Activity, Lock, Zap, Compass, LineChart, Shield } from 'lucide-react';
import { features } from '../../data/features';
import { useLanguage } from '@/context/LanguageContext';
import { featuresTranslations } from '@/data/translations';


const Features = () => {
  const { language } = useLanguage();
  const t = featuresTranslations[language];
  return (
    <section id="features" className="py-24 bg-gradient-to-b from-yamifit-light to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gradient">
            {t.mainHeading}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {t.description}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, index) => {
            const featureTranslations = {
              'Calorie Tracking': { title: t.calorieTracking, desc: t.calorieTrackingDesc },
              'Personalized Meals': { title: t.personalizedMeals, desc: t.personalizedMealsDesc },
              'Diet Subscriptions': { title: t.dietSubscriptions, desc: t.dietSubscriptionsDesc },
              'Coaching Chat': { title: t.coachingChat, desc: t.coachingChatDesc },
              'Meal Delivery Tracking': { title: t.mealDelivery, desc: t.mealDeliveryDesc },
              'Smart Analytics & AI': { title: t.smartAnalytics, desc: t.smartAnalyticsDesc }
            };
            
            const featureTitle = featureTranslations[feature.title];
            
            return (
              <div 
                key={index}
                className="bg-white backdrop-blur-sm border border-yamifit-primary/10 rounded-2xl p-6 hover:bg-yamifit-light/50 transition-all duration-300 hover:shadow-xl hover:shadow-yamifit-primary/5 hover:border-yamifit-primary/30 group animate-on-scroll"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="bg-yamifit-primary/10 rounded-xl w-12 h-12 flex items-center justify-center mb-5 text-yamifit-primary group-hover:bg-yamifit-primary/20 transition-colors duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-yamifit-accent">{featureTitle?.title || feature.title}</h3>
                <p className="text-gray-600">{featureTitle?.desc || feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;





