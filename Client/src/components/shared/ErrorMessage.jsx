/**
 * ErrorMessage Component
 * Reusable error display with optional retry action
 */

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

const ErrorMessage = ({
  title = 'Error',
  message = 'Something went wrong',
  onRetry,
  className = ''
}) => {
  return (
    <div className={`py-6 ${className}`}>
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="mt-2">
          {message}
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="mt-3"
            >
              Try Again
            </Button>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default ErrorMessage;
