/**
 * TimeSlotPicker Component
 * Time input component for selecting hours and minutes
 */

import { Input } from '@/components/ui/input';

const TimeSlotPicker = ({
  value = '09:00',
  onChange,
  disabled = false,
  className = ''
}) => {
  return (
    <Input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={className}
    />
  );
};

export default TimeSlotPicker;
