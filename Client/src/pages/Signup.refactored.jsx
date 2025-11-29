/**
 * Signup Page - Refactored
 * Clean, DRY implementation using custom hooks and components
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Phone, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthInput } from '@/components/auth/AuthInput';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';
import { useForm } from '@/hooks/useForm';
import { usePasswordToggle } from '@/hooks/usePasswordToggle';
import { useLanguage } from '@/context/LanguageContext';
import { authTranslations } from '@/data/translations';
import { validateForm, calculatePasswordStrength } from '@/utils/validators';
import { signUp } from '@/services/api/auth.service';
import { ROUTES, VALIDATION_RULES } from '@/config/constants';

const Signup = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = authTranslations[language].signup;
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const passwordToggle = usePasswordToggle();
  const confirmPasswordToggle = usePasswordToggle();

  /**
   * Form validation rules
   */
  const validateSignupForm = (values) => {
    return validateForm(values, {
      fullName: {
        required: true,
        minLength: 2,
        label: t.fullName || 'Full Name',
      },
      email: {
        required: true,
        email: true,
        label: t.email || 'Email',
      },
      phone: {
        required: false,
        phone: true,
        label: t.phone || 'Phone',
      },
      password: {
        required: true,
        minLength: VALIDATION_RULES.PASSWORD_MIN_LENGTH,
        label: t.password || 'Password',
      },
      confirmPassword: {
        required: true,
        match: 'password',
        label: t.confirmPassword || 'Confirm Password',
      },
    });
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (values) => {
    setError('');
    setSuccess(false);

    const { data, error: signUpError } = await signUp({
      email: values.email,
      password: values.password,
      fullName: values.fullName,
      phone: values.phone,
    });

    if (signUpError) {
      // Handle specific error messages
      if (signUpError.message?.includes('already registered')) {
        setError(t.emailExists || 'This email is already registered');
      } else {
        setError(signUpError.message || t.signupFailed || 'Signup failed');
      }
      return;
    }

    if (data?.user) {
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate(ROUTES.LOGIN);
      }, 3000);
    }
  };

  const form = useForm(
    {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
    handleSubmit,
    validateSignupForm
  );

  // Calculate password strength
  const passwordStrength = calculatePasswordStrength(form.values.password);

  return (
    <AuthLayout
      title={t.createAccount || 'Create Account'}
      subtitle={t.subtitle || 'Start your fitness journey today'}
      footer={
        <p className="text-sm text-gray-500">
          {t.termsPrefix || 'By signing up, you agree to our'}{' '}
          <a href="#" className="text-yamifit-primary hover:underline">
            {t.terms || 'Terms'}
          </a>{' '}
          {t.and || 'and'}{' '}
          <a href="#" className="text-yamifit-primary hover:underline">
            {t.privacy || 'Privacy Policy'}
          </a>
        </p>
      }
    >
      {/* Success Alert */}
      {success && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {t.successMessage || 'Account created! Check your email for verification.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Signup Form */}
      <form onSubmit={form.handleSubmit} className="space-y-5">
        {/* Full Name Field */}
        <AuthInput
          id="fullName"
          name="fullName"
          type="text"
          label={t.fullName || 'Full Name'}
          placeholder={t.fullNamePlaceholder || 'John Doe'}
          value={form.values.fullName}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
          disabled={form.isSubmitting || success}
          error={form.touched.fullName && form.errors.fullName}
          icon={User}
          required
        />

        {/* Email Field */}
        <AuthInput
          id="email"
          name="email"
          type="email"
          label={t.email || 'Email'}
          placeholder={t.emailPlaceholder || 'you@example.com'}
          value={form.values.email}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
          disabled={form.isSubmitting || success}
          error={form.touched.email && form.errors.email}
          icon={Mail}
          required
        />

        {/* Phone Field (Optional) */}
        <AuthInput
          id="phone"
          name="phone"
          type="tel"
          label={t.phone || 'Phone'}
          placeholder={t.phonePlaceholder || '+1234567890'}
          value={form.values.phone}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
          disabled={form.isSubmitting || success}
          error={form.touched.phone && form.errors.phone}
          icon={Phone}
        />

        {/* Password Field */}
        <div>
          <AuthInput
            id="password"
            name="password"
            type={passwordToggle.inputType}
            label={t.password || 'Password'}
            placeholder={t.passwordPlaceholder || '••••••••'}
            value={form.values.password}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            disabled={form.isSubmitting || success}
            error={form.touched.password && form.errors.password}
            icon={Lock}
            rightIcon={passwordToggle.isVisible ? EyeOff : Eye}
            onRightIconClick={passwordToggle.toggle}
            required
          />
          
          {/* Password Strength Indicator */}
          {form.values.password && (
            <div className="mt-2">
              <PasswordStrengthIndicator
                strength={passwordStrength}
                label={
                  passwordStrength.strength === 1
                    ? t.weak || 'Weak'
                    : passwordStrength.strength === 2
                    ? t.medium || 'Medium'
                    : t.strong || 'Strong'
                }
              />
            </div>
          )}
        </div>

        {/* Confirm Password Field */}
        <AuthInput
          id="confirmPassword"
          name="confirmPassword"
          type={confirmPasswordToggle.inputType}
          label={t.confirmPassword || 'Confirm Password'}
          placeholder={t.confirmPasswordPlaceholder || '••••••••'}
          value={form.values.confirmPassword}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
          disabled={form.isSubmitting || success}
          error={form.touched.confirmPassword && form.errors.confirmPassword}
          icon={Lock}
          rightIcon={confirmPasswordToggle.isVisible ? EyeOff : Eye}
          onRightIconClick={confirmPasswordToggle.toggle}
          required
        />

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-12 bg-yamifit-primary hover:bg-yamifit-primary/90 text-white font-semibold rounded-xl"
          disabled={form.isSubmitting || success}
        >
          {form.isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              {t.creatingAccount || 'Creating account...'}
            </>
          ) : success ? (
            <>
              <CheckCircle2 className="h-5 w-5 mr-2" />
              {t.accountCreated || 'Account Created!'}
            </>
          ) : (
            t.signUp || 'Sign Up'
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500">{t.or || 'or'}</span>
        </div>
      </div>

      {/* Login Link */}
      <p className="text-center text-gray-600">
        {t.haveAccount || 'Already have an account?'}{' '}
        <Link
          to={ROUTES.LOGIN}
          className="text-yamifit-primary hover:text-yamifit-primary/80 font-semibold transition-colors"
        >
          {t.signInNow || 'Sign in now'}
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Signup;
