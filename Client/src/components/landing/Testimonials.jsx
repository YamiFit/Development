import { useState, useEffect, useRef } from 'react';
import { Star } from 'lucide-react';
import { testimonials } from '../../data/testimonials';
import { useLanguage } from '@/context/LanguageContext';
import { testimonialsTranslations } from '@/data/translations';

const Testimonials = () => {
  const { language } = useLanguage();
  const t = testimonialsTranslations[language];

  return (
    <section id="testimonials" className="py-24 bg-gradient-to-b from-yamifit-light to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gradient">
            {t.mainHeading}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {t.description}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => {
            const testimonialTranslations = [
              { author: t.testimonial1Author, role: t.testimonial1Role, quote: t.testimonial1 },
              { author: t.testimonial2Author, role: t.testimonial2Role, quote: t.testimonial2 },
              { author: t.testimonial3Author, role: t.testimonial3Role, quote: t.testimonial3 }
            ];
            
            const testTrans = testimonialTranslations[index];
            
            return (
              <div 
                key={index} 
                className="bg-white backdrop-blur-sm border border-yamifit-primary/10 rounded-2xl p-8 md:p-10 shadow-lg animate-on-scroll hover:shadow-xl transition-all duration-300"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yamifit-secondary fill-yamifit-secondary" />
                  ))}
                </div>
                <p className="text-lg md:text-xl text-gray-700 mb-8">"{testTrans?.quote || testimonial.quote}"</p>
                <div className="flex items-center">
                  <img 
                    src={testimonial.avatar} 
                    alt={testTrans?.author || testimonial.author} 
                    className="w-12 h-12 rounded-full object-cover border-2 border-yamifit-primary"
                  />
                  <div className="ml-4">
                    <p className="font-medium text-yamifit-accent">{testTrans?.author || testimonial.author}</p>
                    <p className="text-sm text-gray-600">{testTrans?.role || testimonial.role}</p>
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

export default Testimonials;





