/**
 * ResponsiveCard Component
 * Wrapper around Card with responsive padding and overflow protection
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const ResponsiveCard = ({
  title,
  description,
  children,
  headerAction,
  className = '',
  contentClassName = '',
  noPadding = false,
  hover = false
}) => {
  return (
    <Card 
      className={cn(
        "w-full min-w-0 overflow-hidden",
        hover && "transition-shadow duration-200 hover:shadow-md",
        className
      )}
    >
      {(title || description || headerAction) && (
        <CardHeader className="px-4 sm:px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {title && (
                <CardTitle className="text-lg sm:text-xl truncate">
                  {title}
                </CardTitle>
              )}
              {description && (
                <CardDescription className="mt-1.5 text-sm break-words">
                  {description}
                </CardDescription>
              )}
            </div>
            {headerAction && (
              <div className="flex-shrink-0">
                {headerAction}
              </div>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent className={cn(
        noPadding ? "p-0" : "px-4 sm:px-6 py-4",
        contentClassName
      )}>
        {children}
      </CardContent>
    </Card>
  );
};

export default ResponsiveCard;
