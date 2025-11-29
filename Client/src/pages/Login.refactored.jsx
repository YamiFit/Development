/**
 * Login Page - Refactored
 * Clean, DRY implementation using custom hooks and components
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthInput } from '@/components/auth/AuthInput';
import { useForm } from '@/hooks/useForm';
import { usePasswordToggle } from '@/hooks/usePasswordToggle';
import { useLanguage } from '@/context/LanguageContext';
import { authTranslations } from '@/data/translations';
import { validateForm, isValidEmail } from '@/utils/validators';
import { signIn, updateLastLogin } from '@/services/api/auth.service';
import { ROUTES } from '@/config/constants';

const Login = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = authTranslations[language].login;
  const [error, setError] = useState('');
  const passwordToggle = usePasswordToggle();

  /**
   * Form validation rules
   */
  const validateLoginForm = (values) => {
    return validateForm(values, {
      email: {
        required: true,
        email: true,
        label: t.email || 'Email',
      },
      password: {
        required: true,
        label: t.password || 'Password',
      },
    });
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (values) => {
    setError('');

    const { data, error: signInError } = await signIn({
      email: values.email,
      password: values.password,
    });

    if (signInError) {
      // Handle specific error messages
      if (signInError.message?.includes('Invalid login credentials')) {
        setError(t.invalidCredentials || 'Invalid email or password');
      } else if (signInError.message?.includes('Email not confirmed')) {
        setError(t.emailNotVerified || 'Please verify your email before logging in');
      } else {
        setError(signInError.message || t.loginFailed || 'Login failed');
      }
      return;
    }

    if (data?.user) {
      // Update last login timestamp
      await updateLastLogin(data.user.id);
      
      // Navigate to dashboard
      navigate(ROUTES.DASHBOARD);
    }
  };

  const form = useForm(
    {
      email: '',
      password: '',
    },
    handleSubmit,
    validateLoginForm
  );

  return (
    <AuthLayout
      title={t.signIn || 'Sign In'}
      subtitle={t.subtitle || 'Welcome back! Please sign in to continue'}
      footer={
        <p className="text-sm text-gray-500">
          {t.termsPrefix || 'By signing in, you agree to our'}{' '}
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
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Login Form */}
      <form onSubmit={form.handleSubmit} className="space-y-5">
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
          disabled={form.isSubmitting}
          error={form.touched.email && form.errors.email}
          icon={Mail}
          required
        />

        {/* Password Field */}
        <AuthInput
          id="password"
          name="password"
          type={passwordToggle.inputType}
          label={t.password || 'Password'}
          placeholder={t.passwordPlaceholder || '••••••••'}
          value={form.values.password}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
          disabled={form.isSubmitting}
          error={form.touched.password && form.errors.password}
          icon={Lock}
          rightIcon={passwordToggle.isVisible ? EyeOff : Eye}
          onRightIconClick={passwordToggle.toggle}
          required
        />

        {/* Forgot Password Link */}
        <div className="flex justify-end">
          <Link
            to={ROUTES.FORGOT_PASSWORD}
            className="text-sm text-yamifit-primary hover:text-yamifit-primary/80 font-medium transition-colors"
          >
            {t.forgotPassword || 'Forgot password?'}
          </Link>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-12 bg-yamifit-primary hover:bg-yamifit-primary/90 text-white font-semibold rounded-xl"
          disabled={form.isSubmitting}
        >
          {form.isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              {t.signingIn || 'Signing in...'}
            </>
          ) : (
            t.signIn || 'Sign In'
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

      {/* Signup Link */}
      <p className="text-center text-gray-600">
        {t.noAccount || "Don't have an account?"}{' '}
        <Link
          to={ROUTES.SIGNUP}
          className="text-yamifit-primary hover:text-yamifit-primary/80 font-semibold transition-colors"
        >
          {t.signUpNow || 'Sign up now'}
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Login;
