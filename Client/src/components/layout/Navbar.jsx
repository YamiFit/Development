import { FiMoon, FiSun, FiMenu } from "react-icons/fi";
import { toggleSidebar } from "@/store/slices/uiSlice";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/hooks/useTheme";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import NotificationBell from "@/components/shared/NotificationBell";

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  return (
    <div className="h-16 bg-card border-b border-border flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 transition-colors">
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Hamburger Menu - Always on the start side (left for LTR, right for RTL due to parent RTL) */}
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="p-2 hover:bg-accent rounded-lg transition-colors lg:hidden"
        >
          <FiMenu className="text-xl text-foreground" />
        </button>

        {/* Search */}
        <input
          type="text"
          placeholder={t('common.search')}
          className="hidden sm:block w-60 md:w-80 px-4 py-2 rounded-full border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder-muted-foreground transition-colors"
          dir={isRTL ? 'rtl' : 'ltr'}
        />
      </div>

      {/* Icons */}
      <div className="flex items-center gap-2 sm:gap-3 text-xl">
        <LanguageSwitcher variant="toggle" showLabel={false} />
        
        {/* Notification Bell */}
        <NotificationBell />
        
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
          aria-label={theme === 'dark' ? t('theme.switchToLight', 'Switch to light mode') : t('theme.switchToDark', 'Switch to dark mode')}
        >
          {theme === 'dark' ? (
            <FiSun className="text-xl text-amber-500 hover:text-amber-400 transition-colors" />
          ) : (
            <FiMoon className="text-xl text-muted-foreground hover:text-foreground transition-colors" />
          )}
        </button>
      </div>
    </div>
  );
}
