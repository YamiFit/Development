import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { navbarTranslations } from '@/data/translations';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const { language, setLanguage } = useLanguage();
  const t = navbarTranslations[language];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white shadow-md border-b border-gray-200 py-3' : 'py-4 bg-white shadow-sm'
    }`}>
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-yamifit-accent">
            Yami<span className="text-yamifit-primary">Fit</span>
          </h1>
        </div>

        {/* Desktop menu */}
        <ul className={`hidden lg:flex items-center space-x-8 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          <li>
            <a href="#features" className="text-gray-700 hover:text-yamifit-primary transition-colors font-medium">
              {t.features}
            </a>
          </li>
          <li>
            <a href="#how-it-works" className="text-gray-700 hover:text-yamifit-primary transition-colors font-medium">
              {t.howItWorks}
            </a>
          </li>
          <li>
            <a href="#pricing" className="text-gray-700 hover:text-yamifit-primary transition-colors font-medium">
              {t.pricing}
            </a>
          </li>
          <li>
            <a href="#faq" className="text-gray-700 hover:text-yamifit-primary transition-colors font-medium">
              {t.faq}
            </a>
          </li>
        </ul>

        <div className={`hidden lg:flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''} space-x-4 ${language === 'ar' ? 'space-x-reverse' : ''}`}>
          {/* Language Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-gray-300 hover:border-yamifit-primary hover:bg-yamifit-primary/5 transition-colors"
            >
              <Globe size={18} className="text-yamifit-primary" />
              <span className="text-sm font-medium text-gray-700">{language.toUpperCase()}</span>
            </button>
            
            {isLanguageDropdownOpen && (
              <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                <button
                  onClick={() => {
                    setLanguage('en');
                    setIsLanguageDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-yamifit-primary/10 transition-colors ${
                    language === 'en' ? 'bg-yamifit-primary/10 text-yamifit-primary font-semibold' : 'text-gray-700'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => {
                    setLanguage('ar');
                    setIsLanguageDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-yamifit-primary/10 transition-colors border-t border-gray-200 ${
                    language === 'ar' ? 'bg-yamifit-primary/10 text-yamifit-primary font-semibold' : 'text-gray-700'
                  }`}
                >
                  العربية
                </button>
              </div>
            )}
          </div>

          <Link to="/login">
            <Button variant="ghost" className="text-gray-700 hover:text-yamifit-primary hover:bg-yamifit-primary/10 font-medium">
              {t.login}
            </Button>
          </Link>
          <Link to="/signup">
            <Button className="bg-yamifit-primary hover:bg-yamifit-primary/90 text-white w-full rounded-2xl font-semibold shadow-sm">{t.getStarted}</Button>
          </Link>
        </div>

        {/* Mobile menu button */}
        <button className="lg:hidden text-yamifit-accent" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200 absolute top-full left-0 w-full py-4 shadow-lg">
          <div className="container mx-auto px-4">
            <ul className="flex flex-col space-y-4">
              <li>
                <a href="#features" className="text-gray-700 hover:text-yamifit-primary transition-colors block py-2 font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                  {t.features}
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="text-gray-700 hover:text-yamifit-primary transition-colors block py-2 font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                  {t.howItWorks}
                </a>
              </li>
              <li>
                <a href="#testimonials" className="text-gray-700 hover:text-yamifit-primary transition-colors block py-2 font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                  {t.testimonials}
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-gray-700 hover:text-yamifit-primary transition-colors block py-2 font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                  {t.pricing}
                </a>
              </li>
              <li>
                <a href="#faq" className="text-gray-700 hover:text-yamifit-primary transition-colors block py-2 font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                  {t.faq}
                </a>
              </li>
              <li className="pt-4 border-t border-gray-200">
                <div className="mb-3">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Language / اللغة</p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setLanguage('en');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`flex-1 px-3 py-2 rounded border transition-colors ${
                        language === 'en' 
                          ? 'bg-yamifit-primary text-white border-yamifit-primary' 
                          : 'border-gray-300 text-gray-700 hover:border-yamifit-primary'
                      }`}
                    >
                      EN
                    </button>
                    <button
                      onClick={() => {
                        setLanguage('ar');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`flex-1 px-3 py-2 rounded border transition-colors ${
                        language === 'ar' 
                          ? 'bg-yamifit-primary text-white border-yamifit-primary' 
                          : 'border-gray-300 text-gray-700 hover:border-yamifit-primary'
                      }`}
                    >
                      AR
                    </button>
                  </div>
                </div>
              </li>
              <li className="pt-4 flex flex-col space-y-3">
                <Link to="/login" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="ghost" className="text-gray-700 hover:text-yamifit-primary hover:bg-yamifit-primary/10 w-full justify-start font-medium">
                    {t.login}
                  </Button>
                </Link>
                <Link to="/signup" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="bg-yamifit-primary hover:bg-yamifit-primary/90 text-white w-full rounded-2xl font-semibold">{t.getStarted}</Button>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;





