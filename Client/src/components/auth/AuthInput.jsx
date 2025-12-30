/**
 * Reusable Auth Form Input Component
 * DRY component for form inputs with icons
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const AuthInput = ({
  id,
  name,
  type = 'text',
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  disabled = false,
  error,
  icon: Icon,
  iconClassName = '',
  rightIcon: RightIcon,
  onRightIconClick,
  required = false,
  className = '',
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label} {!required && <span className="text-gray-400 text-xs">(Optional)</span>}
      </Label>
      <div className="relative">
        {Icon && (
          <Icon className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${iconClassName || 'text-gray-400'}`} />
        )}
        <Input
          id={id}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          className={`
            ${Icon ? 'pl-10' : ''} 
            ${RightIcon ? 'pr-10' : ''} 
            h-12 border-gray-300 focus:border-yamifit-primary focus:ring-yamifit-primary
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
            ${className}
          `}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        {RightIcon && (
          <button
            type="button"
            onClick={onRightIconClick}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
            tabIndex={-1}
          >
            <RightIcon className="h-5 w-5" />
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
