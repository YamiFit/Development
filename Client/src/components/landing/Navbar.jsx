import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { navbarTranslations } from '@/data/translations';
import { ThemeToggle } from '@/components/shared/ThemeToggle';

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
      isScrolled 
        ? 'bg-card/95 backdrop-blur-sm shadow-md border-b border-border py-3' 
        : 'py-4 bg-card/80 backdrop-blur-sm shadow-sm'
    }`}>
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-foreground">
            Yami<span className="text-primary">Fit</span>
          </h1>
        </div>

        {/* Desktop menu */}
        <ul className={`hidden lg:flex items-center space-x-8 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          <li>
            <a href="#features" className="text-muted-foreground hover:text-primary transition-colors font-medium">
              {t.features}
            </a>
          </li>
          <li>
            <a href="#how-it-works" className="text-muted-foreground hover:text-primary transition-colors font-medium">
              {t.howItWorks}
            </a>
          </li>
          <li>
            <a href="#pricing" className="text-muted-foreground hover:text-primary transition-colors font-medium">
              {t.pricing}
            </a>
          </li>
          <li>
            <a href="#faq" className="text-muted-foreground hover:text-primary transition-colors font-medium">
              {t.faq}
            </a>
          </li>
        </ul>

        <div className={`hidden lg:flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''} space-x-4 ${language === 'ar' ? 'space-x-reverse' : ''}`}>
          {/* Theme Toggle */}
          <ThemeToggle variant="landing" />
          
          {/* Language Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-border bg-card hover:border-primary hover:bg-accent transition-colors"
            >
              <Globe size={18} className="text-primary" />
              <span className="text-sm font-medium text-foreground">{language.toUpperCase()}</span>
            </button>
            
            {isLanguageDropdownOpen && (
              <div className="absolute end-0 mt-2 w-32 bg-popover border border-border rounded-lg shadow-lg z-50">
                <button
                  onClick={() => {
                    setLanguage('en');
                    setIsLanguageDropdownOpen(false);
                  }}
                  className={`w-full text-start px-4 py-2 hover:bg-accent transition-colors rounded-t-lg ${
                    language === 'en' ? 'bg-accent text-primary font-semibold' : 'text-foreground'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => {
                    setLanguage('ar');
                    setIsLanguageDropdownOpen(false);
                  }}
                  className={`w-full text-start px-4 py-2 hover:bg-accent transition-colors border-t border-border rounded-b-lg ${
                    language === 'ar' ? 'bg-accent text-primary font-semibold' : 'text-foreground'
                  }`}
                >
                  العربية
                </button>
              </div>
            )}
          </div>

          <Link to="/login">
            <Button variant="ghost" className="text-muted-foreground hover:text-primary hover:bg-accent font-medium">
              {t.login}
            </Button>
          </Link>
          <Link to="/signup">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground w-full rounded-2xl font-semibold shadow-sm">{t.getStarted}</Button>
          </Link>
        </div>

        {/* Mobile menu button */}
        <button className="lg:hidden text-foreground" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-card border-t border-border absolute top-full left-0 w-full py-4 shadow-lg">
          <div className="container mx-auto px-4">
            <ul className="flex flex-col space-y-4">
              <li>
                <a href="#features" className="text-muted-foreground hover:text-primary transition-colors block py-2 font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                  {t.features}
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="text-muted-foreground hover:text-primary transition-colors block py-2 font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                  {t.howItWorks}
                </a>
              </li>
              <li>
                <a href="#testimonials" className="text-muted-foreground hover:text-primary transition-colors block py-2 font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                  {t.testimonials}
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-muted-foreground hover:text-primary transition-colors block py-2 font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                  {t.pricing}
                </a>
              </li>
              <li>
                <a href="#faq" className="text-muted-foreground hover:text-primary transition-colors block py-2 font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                  {t.faq}
                </a>
              </li>
              <li className="pt-4 border-t border-border">
                {/* Theme Toggle in Mobile Menu */}
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">Theme</p>
                  <ThemeToggle variant="compact" />
                </div>
                <div className="mb-3">
                  <p className="text-sm font-semibold text-foreground mb-2">Language / اللغة</p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setLanguage('en');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`flex-1 px-3 py-2 rounded border transition-colors ${
                        language === 'en' 
                          ? 'bg-primary text-primary-foreground border-primary' 
                          : 'border-border text-foreground hover:border-primary'
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
                          ? 'bg-primary text-primary-foreground border-primary' 
                          : 'border-border text-foreground hover:border-primary'
                      }`}
                    >
                      AR
                    </button>
                  </div>
                </div>
              </li>
              <li className="pt-4 flex flex-col space-y-3">
                <Link to="/login" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="ghost" className="text-muted-foreground hover:text-primary hover:bg-accent w-full justify-start font-medium">
                    {t.login}
                  </Button>
                </Link>
                <Link to="/signup" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground w-full rounded-2xl font-semibold">{t.getStarted}</Button>
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





