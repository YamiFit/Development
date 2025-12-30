/**
 * Language Switcher Component
 * Provides UI for switching between supported languages
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe, Check } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuthRedux';
import { updateProfile } from '@/services/api/profile.service';

/**
 * Language Switcher - Dropdown variant
 * Use in navbar, settings, etc.
 */
export const LanguageSwitcher = ({ 
  variant = 'dropdown', // 'dropdown' | 'select' | 'toggle' | 'buttons'
  showLabel = false,
  showIcon = true,
  size = 'default', // 'sm' | 'default' | 'lg'
  className = '',
  persistToDb = true, // Whether to persist to user profile
}) => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { user, profile } = useAuth();
  
  const currentLanguage = i18n.language;
  
  const handleLanguageChange = async (lang) => {
    if (lang === currentLanguage) return;
    
    // Change language immediately for instant feedback
    i18n.changeLanguage(lang);
    
    // Persist to database if user is authenticated
    if (persistToDb && user?.id) {
      try {
        await updateProfile(user.id, { language: lang });
      } catch (error) {
        console.error('Failed to persist language preference:', error);
        // Don't show error toast - language change still works locally
      }
    }
    
    toast({
      title: t('toast.success'),
      description: t('settings.languageChanged'),
    });
  };
  
  // Dropdown variant
  if (variant === 'dropdown') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size={size}
            className={`gap-2 ${className}`}
          >
            {showIcon && <Globe className="h-4 w-4" />}
            {showLabel && (
              <span>{SUPPORTED_LANGUAGES[currentLanguage]?.nativeName}</span>
            )}
            {!showLabel && !showIcon && (
              <span className="uppercase text-sm font-medium">{currentLanguage}</span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[150px]">
          {Object.entries(SUPPORTED_LANGUAGES).map(([code, { nativeName }]) => (
            <DropdownMenuItem
              key={code}
              onClick={() => handleLanguageChange(code)}
              className="flex items-center justify-between cursor-pointer"
            >
              <span>{nativeName}</span>
              {currentLanguage === code && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
  
  // Select variant (for forms/settings)
  if (variant === 'select') {
    return (
      <Select 
        value={currentLanguage} 
        onValueChange={handleLanguageChange}
      >
        <SelectTrigger className={className}>
          <SelectValue>
            {showIcon && <Globe className="h-4 w-4 mr-2 inline" />}
            {SUPPORTED_LANGUAGES[currentLanguage]?.nativeName}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(SUPPORTED_LANGUAGES).map(([code, { nativeName }]) => (
            <SelectItem key={code} value={code}>
              {nativeName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
  
  // Toggle variant (simple toggle between two languages)
  if (variant === 'toggle') {
    const nextLang = currentLanguage === 'en' ? 'ar' : 'en';
    return (
      <Button
        variant="ghost"
        size={size}
        onClick={() => handleLanguageChange(nextLang)}
        className={`gap-2 ${className}`}
      >
        {showIcon && <Globe className="h-4 w-4" />}
        <span className="font-medium">
          {SUPPORTED_LANGUAGES[nextLang]?.nativeName}
        </span>
      </Button>
    );
  }
  
  // Buttons variant (show all language options as buttons)
  if (variant === 'buttons') {
    return (
      <div className={`flex gap-2 ${className}`}>
        {Object.entries(SUPPORTED_LANGUAGES).map(([code, { nativeName }]) => (
          <Button
            key={code}
            variant={currentLanguage === code ? 'default' : 'outline'}
            size={size}
            onClick={() => handleLanguageChange(code)}
          >
            {nativeName}
          </Button>
        ))}
      </div>
    );
  }
  
  return null;
};

/**
 * Simple language toggle for navbar
 */
export const LanguageToggle = ({ className = '' }) => {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;
  
  const handleToggle = () => {
    const nextLang = currentLanguage === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(nextLang);
  };
  
  return (
    <button
      onClick={handleToggle}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium 
        bg-gray-100 hover:bg-gray-200 transition-colors ${className}`}
    >
      <Globe className="h-4 w-4" />
      <span>{currentLanguage === 'en' ? 'العربية' : 'English'}</span>
    </button>
  );
};

/**
 * Language indicator badge
 */
export const LanguageBadge = ({ className = '' }) => {
  const { i18n } = useTranslation();
  const { nativeName } = SUPPORTED_LANGUAGES[i18n.language] || {};
  
  return (
    <span className={`inline-flex items-center gap-1 text-xs text-muted-foreground ${className}`}>
      <Globe className="h-3 w-3" />
      {nativeName}
    </span>
  );
};

export default LanguageSwitcher;
