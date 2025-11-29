/**
 * Auth Page Layout Component
 * Shared layout for authentication pages
 */

import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ROUTES, APP_CONFIG } from '@/config/constants';

export const AuthLayout = ({ 
  children, 
  title, 
  subtitle,
  showBackButton = true,
  footer 
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yamifit-primary/5 via-white to-yamifit-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        {showBackButton && (
          <Link 
            to={ROUTES.HOME} 
            className="inline-flex items-center text-yamifit-primary hover:text-yamifit-primary/80 mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>
        )}

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-yamifit-accent mb-2">
              {APP_CONFIG.name.slice(0, 4)}
              <span className="text-yamifit-primary">{APP_CONFIG.name.slice(4)}</span>
            </h1>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">{title}</h2>
            {subtitle && <p className="text-gray-600">{subtitle}</p>}
          </div>

          {/* Content */}
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="text-center mt-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
