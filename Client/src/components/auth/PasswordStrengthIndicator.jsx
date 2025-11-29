/**
 * Password Strength Indicator Component
 * Reusable component for showing password strength
 */

export const PasswordStrengthIndicator = ({ strength, label }) => {
  if (!strength || strength.strength === 0) return null;

  return (
    <div className="space-y-1">
      <div className="flex space-x-1">
        {[1, 2, 3].map((level) => (
          <div
            key={level}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              level <= strength.strength ? strength.color : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-gray-600">
        Password strength:{' '}
        <span
          className={`font-medium ${
            strength.strength === 1
              ? 'text-red-600'
              : strength.strength === 2
              ? 'text-yellow-600'
              : 'text-green-600'
          }`}
        >
          {label || strength.label}
        </span>
      </p>
    </div>
  );
};
