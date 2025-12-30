/**
 * PageHeader Component
 * Reusable page header with title, description, and optional action button
 * Fully responsive with mobile-first approach
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PageHeader = ({
  title,
  description,
  action,
  actionLabel,
  onAction,
  actionIcon: ActionIcon,
  backButton = false,
  badge,
  className = ''
}) => {
  const navigate = useNavigate();

  return (
    <div className={`w-full min-w-0 mb-6 ${className}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Title and Description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            {backButton && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="flex-shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
                  {title}
                </h1>
                {badge && (
                  <span className="flex-shrink-0">{badge}</span>
                )}
              </div>
              {description && (
                <p className="text-sm sm:text-base text-muted-foreground mt-1 break-words">
                  {description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        {(action || (actionLabel && onAction)) && (
          <div className="flex-shrink-0 w-full sm:w-auto">
            {action || (
              <Button
                onClick={onAction}
                className="w-full sm:w-auto"
              >
                {ActionIcon && <ActionIcon className="h-4 w-4 mr-2" />}
                {actionLabel}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
