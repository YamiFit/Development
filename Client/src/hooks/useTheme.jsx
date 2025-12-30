/**
 * Theme Hook - useTheme
 * Provides dark/light mode functionality with persistence
 * - Authenticated users: stored in DB (profiles.theme)
 * - Guests: stored in localStorage
 * - Fallback: OS preference
 */

import { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';
import { supabase } from '@/supabaseClient';

// Theme context for global access
const ThemeContext = createContext(null);

/**
 * Theme Provider Component
 */
export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    // Initialize from localStorage immediately to prevent flash
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('yamifit-theme');
      if (stored === 'dark' || stored === 'light') {
        // Apply immediately
        if (stored === 'dark') {
          document.documentElement.classList.add('dark');
        }
        return stored;
      }
      // Check OS preference
      if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
        return 'dark';
      }
    }
    return 'light';
  });
  const [user, setUser] = useState(null);
  const initRef = useRef(false);

  // Apply theme to document
  const applyTheme = useCallback((newTheme) => {
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    setThemeState(newTheme);
  }, []);

  // Initialize theme on mount - non-blocking
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const initTheme = async () => {
      try {
        // Check for current user
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);

        if (currentUser) {
          // Authenticated user: try to fetch from DB (non-blocking)
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('theme')
              .eq('id', currentUser.id)
              .single();

            if (profile?.theme && (profile.theme === 'dark' || profile.theme === 'light')) {
              applyTheme(profile.theme);
              localStorage.setItem('yamifit-theme', profile.theme);
            }
          } catch {
            // Profile fetch failed (theme column might not exist), use localStorage
            console.log('Theme column not available, using localStorage');
          }
        }
      } catch (error) {
        console.error('Error initializing theme:', error);
      }
    };

    initTheme();

    // Listen for auth changes - but don't block login
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null);
      
      // Only fetch theme on SIGNED_IN event, not on every auth change
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('theme')
            .eq('id', session.user.id)
            .single();

          if (profile?.theme && (profile.theme === 'dark' || profile.theme === 'light')) {
            applyTheme(profile.theme);
            localStorage.setItem('yamifit-theme', profile.theme);
          }
        } catch {
          // Ignore errors - theme is optional
        }
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [applyTheme]);

  // Set theme function
  const setTheme = useCallback(async (newTheme) => {
    // Apply immediately for instant feedback
    applyTheme(newTheme);

    // Persist to localStorage (always, for guests and as backup)
    localStorage.setItem('yamifit-theme', newTheme);

    // If authenticated, also persist to DB
    if (user) {
      try {
        await supabase
          .from('profiles')
          .update({ theme: newTheme })
          .eq('id', user.id);
      } catch (error) {
        console.error('Failed to persist theme to DB:', error);
      }
    }
  }, [user, applyTheme]);

  // Toggle theme function
  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  }, [theme, setTheme]);

  const value = {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * useTheme Hook
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}

export default useTheme;
