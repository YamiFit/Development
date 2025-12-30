import { useEffect, useState } from "react";
import { useSettings } from "@/hooks/useSettings";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Ruler, Moon, Sun, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuthRedux";
import { updateProfile } from "@/services/api/profile.service";

export default function PreferencesTab() {
  const { userPreferences, preferencesLoading, authLoading, updateUserPreferences } =
    useSettings();
  const { theme, setTheme, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    unit_system: "metric",
  });

  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'en');
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load preferences when available
  useEffect(() => {
    if (userPreferences) {
      setFormData({
        unit_system: userPreferences.unit_system || "metric",
      });
      setIsInitialized(true);
    }
  }, [userPreferences]);

  // Sync language state with i18n
  useEffect(() => {
    setCurrentLanguage(i18n.language);
  }, [i18n.language]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLanguageChange = async (lang) => {
    // Change language immediately for instant feedback
    i18n.changeLanguage(lang);
    setCurrentLanguage(lang);
    
    // Persist to database if user is authenticated
    if (user?.id) {
      try {
        await updateProfile(user.id, { language: lang });
      } catch (error) {
        console.error('Failed to persist language preference:', error);
      }
    }
    
    toast({
      title: t('toast.success'),
      description: t('settings.languageChanged'),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    const { error } = await updateUserPreferences(formData);

    if (error) {
      toast({
        title: t('toast.error'),
        description: error.message || t('errors.updateFailed'),
        variant: "destructive",
      });
    } else {
      toast({
        title: t('toast.success'),
        description: t('toast.preferencesUpdated'),
      });
    }

    setIsSaving(false);
  };

  if ((authLoading || preferencesLoading) && !isInitialized) {
    return (
      <div className="bg-white rounded-xl p-6 shadow border flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 shadow border">
      <h2 className="text-lg sm:text-xl font-semibold mb-4">{t('settings.preferences')}</h2>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Language Selection */}
        <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 rounded-lg border">
          <div className="flex items-center gap-2 sm:gap-3">
            <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <Label
                htmlFor="language"
                className="text-sm sm:text-base font-semibold"
              >
                {t('settings.language')}
              </Label>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {t('settings.selectLanguage')}
              </p>
            </div>
          </div>

          <Select
            value={currentLanguage}
            onValueChange={handleLanguageChange}
          >
            <SelectTrigger id="language">
              <SelectValue placeholder={t('settings.selectLanguage')} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SUPPORTED_LANGUAGES).map(([code, { nativeName, name }]) => (
                <SelectItem key={code} value={code}>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{nativeName}</span>
                    <span className="text-xs text-gray-500">{name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Unit System */}
        <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 rounded-lg border">
          <div className="flex items-center gap-2 sm:gap-3">
            <Ruler className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <Label
                htmlFor="unit_system"
                className="text-sm sm:text-base font-semibold"
              >
                {t('settings.unitSystem')}
              </Label>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {t('settings.unitSystem')}
              </p>
            </div>
          </div>

          <Select
            value={formData.unit_system}
            onValueChange={(value) => handleChange("unit_system", value)}
          >
            <SelectTrigger id="unit_system">
              <SelectValue placeholder={t('settings.unitSystem')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="metric">
                <div className="flex flex-col items-start">
                  <span className="font-medium">{t('settings.metric')}</span>
                </div>
              </SelectItem>
              <SelectItem value="imperial">
                <div className="flex flex-col items-start">
                  <span className="font-medium">{t('settings.imperial')}</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Theme */}
        <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 rounded-lg border dark:border-gray-700">
          <div className="flex items-center gap-2 sm:gap-3">
            {isDark ? (
              <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
            ) : (
              <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <Label
                htmlFor="theme"
                className="text-sm sm:text-base font-semibold dark:text-white"
              >
                {t('settings.theme')}
              </Label>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t('settings.themeDescription', 'Choose your preferred appearance')}
              </p>
            </div>
          </div>

          <Select
            value={theme}
            onValueChange={(value) => {
              setTheme(value);
              toast({
                title: t('toast.success'),
                description: t('settings.themeChanged', 'Theme updated successfully'),
              });
            }}
          >
            <SelectTrigger id="theme" className="dark:bg-gray-800 dark:border-gray-600">
              <SelectValue placeholder={t('settings.theme')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  <span className="font-medium">{t('settings.lightMode')}</span>
                </div>
              </SelectItem>
              <SelectItem value="dark">
                <div className="flex items-center gap-2">
                  <Moon className="h-4 w-4" />
                  <span className="font-medium">{t('settings.darkMode')}</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Theme Preview */}
          <div className="mt-4 p-3 rounded-md border-2 border-dashed border-gray-300 dark:border-gray-600">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t('common.preview', 'Preview')}:</p>
            <div
              className={`p-4 rounded transition-colors ${
                isDark
                  ? "bg-gray-900 text-white border border-gray-700"
                  : "bg-white text-gray-900 border border-gray-200"
              }`}
            >
              <p className="font-medium">{t('settings.sampleText', 'Sample Text')}</p>
              <p className="text-sm opacity-75 mt-1">
                {t('settings.themePreviewDescription', 'This is how your app will look')}
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t">
          <Button
            type="submit"
            disabled={isSaving || preferencesLoading}
            className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('common.loading')}
              </>
            ) : (
              t('common.save')
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
