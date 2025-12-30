/**
 * StatusBadge Component
 * Displays order status with appropriate color coding
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { formatStatus } from '@/utils/formatters';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  preparing: 'bg-orange-100 text-orange-800 border-orange-200',
  out_for_delivery: 'bg-purple-100 text-purple-800 border-purple-200',
  delivered: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

const StatusBadge = ({ status, className = '' }) => {
  const colorClass = STATUS_COLORS[status] || 'bg-gray-100 text-gray-800 border-gray-200';

  return (
    <Badge
      variant="outline"
      className={`${colorClass} ${className}`}
    >
      {formatStatus(status)}
    </Badge>
  );
};

export default StatusBadge;
