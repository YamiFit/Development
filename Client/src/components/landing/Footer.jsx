
import { Facebook, Twitter, Instagram, Linkedin, Github } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { footerTranslations } from '@/data/translations';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { language } = useLanguage();
  const t = footerTranslations[language];

  return (
    <footer className="bg-yamifit-accent pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-8">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-white mb-4">
              Yami<span className="text-yamifit-primary">Fit</span>
            </h2>
            <p className="text-gray-300 mb-6 max-w-xs">
              {t.description}
            </p>
            <div className="flex space-x-4">
              <a href="#!" className="text-gray-300 hover:text-yamifit-primary transition-colors">
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </a>
              <a href="#!" className="text-gray-300 hover:text-yamifit-primary transition-colors">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </a>
              <a href="#!" className="text-gray-300 hover:text-yamifit-primary transition-colors">
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </a>
              <a href="#!" className="text-gray-300 hover:text-yamifit-primary transition-colors">
                <Linkedin className="h-5 w-5" />
                <span className="sr-only">LinkedIn</span>
              </a>
              <a href="#!" className="text-gray-300 hover:text-yamifit-primary transition-colors">
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-white font-medium mb-4">{t.product}</h3>
            <ul className="space-y-2">
              <li><a href="#!" className="text-gray-300 hover:text-yamifit-primary transition-colors">{t.features}</a></li>
              <li><a href="#!" className="text-gray-300 hover:text-yamifit-primary transition-colors">{t.pricing}</a></li>
              <li><a href="#!" className="text-gray-300 hover:text-yamifit-primary transition-colors">{t.security}</a></li>
              <li><a href="#!" className="text-gray-300 hover:text-yamifit-primary transition-colors">{t.documentation}</a></li>
              <li><a href="#!" className="text-gray-300 hover:text-yamifit-primary transition-colors">{t.contactUs}</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-medium mb-4">{t.support}</h3>
            <ul className="space-y-2">
              <li><a href="#!" className="text-gray-300 hover:text-yamifit-primary transition-colors">{t.blog}</a></li>
              <li><a href="#!" className="text-gray-300 hover:text-yamifit-primary transition-colors">{t.faq}</a></li>
              <li><a href="#!" className="text-gray-300 hover:text-yamifit-primary transition-colors">{t.contactUs}</a></li>
              <li><a href="#!" className="text-gray-300 hover:text-yamifit-primary transition-colors">{t.recipes}</a></li>
              <li><a href="#!" className="text-gray-300 hover:text-yamifit-primary transition-colors">{t.helpCenter}</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-medium mb-4">{t.company}</h3>
            <ul className="space-y-2">
              <li><a href="#!" className="text-gray-300 hover:text-yamifit-primary transition-colors">{t.about}</a></li>
              <li><a href="#!" className="text-gray-300 hover:text-yamifit-primary transition-colors">{t.careers}</a></li>
              <li><a href="#!" className="text-gray-300 hover:text-yamifit-primary transition-colors">{t.blog}</a></li>
              <li><a href="#!" className="text-gray-300 hover:text-yamifit-primary transition-colors">{t.privacyPolicy}</a></li>
              <li><a href="#!" className="text-gray-300 hover:text-yamifit-primary transition-colors">{t.support}</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-300 text-sm mb-4 md:mb-0">
              {t.copyright}
              
            </p>
            <div className="flex space-x-6">
              <a href="#!" className="text-gray-300 hover:text-yamifit-primary text-sm transition-colors">{t.termsOfService}</a>
              <a href="#!" className="text-gray-300 hover:text-yamifit-primary text-sm transition-colors">{t.privacyPolicy}</a>
              <a href="#!" className="text-gray-300 hover:text-yamifit-primary text-sm transition-colors">{t.cookiePolicy}</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;





