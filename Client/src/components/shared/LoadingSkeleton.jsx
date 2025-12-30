/**
 * LoadingSkeleton Component
 * Reusable loading skeleton patterns for provider pages
 */

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// Dashboard Stats Skeleton
export const StatsCardSkeleton = () => (
  <Card className="overflow-hidden">
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-12 w-12 rounded-lg" />
      </div>
    </CardContent>
  </Card>
);

// Order Card Skeleton
export const OrderCardSkeleton = () => (
  <Card>
    <CardContent className="p-4">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex items-center justify-between pt-2 border-t">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// Meal Card Skeleton
export const MealCardSkeleton = () => (
  <Card className="overflow-hidden">
    <Skeleton className="h-48 w-full" />
    <CardContent className="p-4">
      <div className="space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-9 flex-1 rounded-md" />
          <Skeleton className="h-9 flex-1 rounded-md" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// List Skeleton
export const ListSkeleton = ({ count = 3 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <Card key={i}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-9 w-20 rounded-md flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

// Table Skeleton (for larger screens)
export const TableSkeleton = ({ rows = 5, cols = 4 }) => (
  <div className="rounded-md border">
    <div className="p-4 border-b bg-muted/50">
      <div className="flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
    </div>
    <div className="divide-y">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4">
          <div className="flex gap-4">
            {Array.from({ length: cols }).map((_, j) => (
              <Skeleton key={j} className="h-4 flex-1" />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Generic Loading Skeleton
const LoadingSkeleton = ({ type = 'card', count = 1, className = '' }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'stats':
        return <StatsCardSkeleton />;
      case 'order':
        return <OrderCardSkeleton />;
      case 'meal':
        return <MealCardSkeleton />;
      case 'list':
        return <ListSkeleton count={count} />;
      case 'table':
        return <TableSkeleton rows={count} />;
      default:
        return <Skeleton className={`h-32 ${className}`} />;
    }
  };

  if (type === 'list' || type === 'table') {
    return renderSkeleton();
  }

  return (
    <div className={`grid gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>{renderSkeleton()}</div>
      ))}
    </div>
  );
};

export default LoadingSkeleton;
