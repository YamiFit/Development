/**
 * ThemeToggle Component
 * A reusable theme toggle button that works on both landing page and dashboard.
 * - Sun/Moon icon switch
 * - Accessible with proper aria-labels
 * - RTL/LTR safe
 */

import { FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

export function ThemeToggle({ 
  className = '', 
  variant = 'default', // 'default' | 'landing' | 'compact'
  showLabel = false,
  labelPosition = 'end' // 'start' | 'end'
}) {
  const { toggleTheme, isDark } = useTheme();

  const baseClasses = 'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';
  
  const variantClasses = {
    default: 'p-2 rounded-lg hover:bg-accent',
    landing: 'p-2 rounded-lg border border-border bg-card hover:bg-accent',
    compact: 'p-1.5 rounded-md hover:bg-accent',
  };

  const iconClasses = {
    sun: 'text-xl text-amber-500',
    moon: 'text-xl text-muted-foreground hover:text-foreground',
  };

  const label = isDark ? 'Light mode' : 'Dark mode';
  const ariaLabel = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <button
      onClick={toggleTheme}
      className={cn(baseClasses, variantClasses[variant], className)}
      aria-label={ariaLabel}
      title={label}
    >
      <span className={cn('flex items-center gap-2', labelPosition === 'start' && 'flex-row-reverse')}>
        {isDark ? (
          <FiSun className={iconClasses.sun} />
        ) : (
          <FiMoon className={iconClasses.moon} />
        )}
        {showLabel && (
          <span className="text-sm font-medium text-foreground">{label}</span>
        )}
      </span>
    </button>
  );
}

export default ThemeToggle;
