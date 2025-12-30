/**
 * LoadingSpinner Component
 * Reusable loading spinner with optional message
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ message = 'Loading...', size = 'default', className = '' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary mb-4`} />
      {message && <p className="text-gray-600 text-sm">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
