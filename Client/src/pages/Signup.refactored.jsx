/**
 * Signup Page - Refactored
 * Clean, DRY implementation using custom hooks and components
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Phone, Loader2, CheckCircle2, XCircle, Apple, Activity, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthInput } from '@/components/auth/AuthInput';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';
import { useForm } from '@/hooks/useForm';
import { usePasswordToggle } from '@/hooks/usePasswordToggle';
import { useLanguage } from '@/context/LanguageContext';
import { authTranslations } from '@/data/translations';
import logoVideo from '@/components/logo-animation.mp4';
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
    <div className="min-h-screen bg-gradient-to-br from-[#38553B]/10 via-[#D9D9D9] to-[#D09943]/5 flex items-center justify-center p-4 relative overflow-hidden">
      {/* background blobs */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#38553B] rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#D09943] rounded-full blur-3xl"></div>
      </div>

      {/* slanted SVG */}
      <div className="absolute -top-8 left-0 w-full h-28 sm:h-36 z-0 pointer-events-none">
        <svg className="w-full h-full -z-10" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
          <path fill="#3BB273" fillOpacity="1" d="M0,160L48,170.7C96,181,192,203,288,202.7C384,203,480,181,576,154.7C672,128,768,96,864,117.3C960,139,1056,213,1152,234.7C1248,256,1344,224,1392,208L1440,192L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
        </svg>
      </div>

      {/* floating icons */}
      {[
        { Icon: Apple, top: '15%', left: '10%', delay: '0s', duration: '4s', color: 'text-[#38553B]' },
        { Icon: Activity, top: '25%', right: '15%', delay: '1s', duration: '5s', color: 'text-[#D09943]' },
        { Icon: Heart, top: '60%', left: '8%', delay: '2s', duration: '6s', color: 'text-[#8D5E38]' },
      ].map((item, index) => (
        <div key={index} className={`hidden lg:block absolute ${item.color} opacity-30`} style={{ top: item.top, left: item.left, right: item.right, animation: `float ${item.duration} ease-in-out infinite`, animationDelay: item.delay }}>
          <div className="relative">
            <item.Icon size={60} className="animate-pulse" style={{ animationDuration: '3s' }} />
            <div className="absolute inset-0">
              <item.Icon size={60} className="animate-ping" style={{ animationDuration: '4s', opacity: 0.5 }} />
            </div>
          </div>
        </div>
      ))}

      {/* Y F letters */}
      <div className="absolute top-4 left-4 flex items-center gap-3 z-0">
        <span className="font-extrabold text-5xl select-none" style={{ color: '#D09943' }}>Y</span>
        <span className="font-extrabold text-5xl select-none" style={{ color: '#D09943' }}>F</span>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* back link */}
        <Link to={ROUTES.HOME} className="inline-flex items-center mb-4 px-3 py-1.5 rounded-full bg-white shadow-md border border-[#38553B]/30 text-[#38553B] hover:bg-[#38553B] hover:text-white transition-all text-sm font-medium z-20 relative">
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span className="text-sm">{t.backToHome || 'Back'}</span>
        </Link>

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-[0_30px_80px_rgba(0,0,0,0.25),0_8px_30px_rgba(59,178,115,0.12),inset_0_1px_0_rgba(255,255,255,0.6)] hover:shadow-[0_40px_120px_rgba(0,0,0,0.30),0_12px_50px_rgba(208,153,67,0.18)] transition-shadow duration-300 overflow-hidden border border-[#38553B]/10">
          {/* video header */}
          <div className="w-full bg-gradient-to-br from-[#38553B]/5 to-[#D09943]/5 overflow-hidden">
            <video autoPlay loop muted playsInline className="w-full h-44 sm:h-52 object-cover rounded-t-3xl block">
              <source src={logoVideo} type="video/mp4" />
            </video>
          </div>

          <div className="p-6">
            <div className="text-center mb-2">
              <h1 className="text-3xl font-bold mb-1"><span className="text-[#38553B]">Yami</span><span className="text-[#D09943]">Fit</span></h1>
              <h2 className="text-xl font-semibold text-gray-800">{t.createAccount || 'Create Account'}</h2>
            </div>

            {/* Success/Error */}
            {success && (
              <Alert className="mb-4 bg-green-50 border-green-200"><CheckCircle2 className="h-4 w-4 text-green-600" /><AlertDescription className="text-green-800">{t.successMessage || 'Account created! Check your email.'}</AlertDescription></Alert>
            )}
            {error && (
              <Alert variant="destructive" className="mb-4 bg-red-50 border-red-200"><XCircle className="h-4 w-4" /><AlertDescription className="text-red-800">{error}</AlertDescription></Alert>
            )}

            {/* form */}
            <form onSubmit={form.handleSubmit} className="space-y-4">
              <AuthInput id="fullName" name="fullName" type="text" label={t.fullName || 'Full Name'} placeholder={t.fullNamePlaceholder || 'John Doe'} value={form.values.fullName} onChange={form.handleChange} onBlur={form.handleBlur} disabled={form.isSubmitting || success} error={form.touched.fullName && form.errors.fullName} icon={User} iconClassName="text-[#38553B]" required />

              <AuthInput id="email" name="email" type="email" label={t.email || 'Email'} placeholder={t.emailPlaceholder || 'you@example.com'} value={form.values.email} onChange={form.handleChange} onBlur={form.handleBlur} disabled={form.isSubmitting || success} error={form.touched.email && form.errors.email} icon={Mail} iconClassName="text-[#38553B]" required />

              <AuthInput id="phone" name="phone" type="tel" label={t.phone || 'Phone'} placeholder={t.phonePlaceholder || '+1234567890'} value={form.values.phone} onChange={form.handleChange} onBlur={form.handleBlur} disabled={form.isSubmitting || success} error={form.touched.phone && form.errors.phone} icon={Phone} iconClassName="text-[#38553B]" />

              <div>
                <AuthInput id="password" name="password" type={passwordToggle.inputType} label={t.password || 'Password'} placeholder={t.passwordPlaceholder || '••••••••'} value={form.values.password} onChange={form.handleChange} onBlur={form.handleBlur} disabled={form.isSubmitting || success} error={form.touched.password && form.errors.password} icon={Lock} rightIcon={passwordToggle.isVisible ? EyeOff : Eye} onRightIconClick={passwordToggle.toggle} required />
                {form.values.password && (<div className="mt-2"><PasswordStrengthIndicator strength={passwordStrength} label={passwordStrength.strength === 1 ? t.weak || 'Weak' : passwordStrength.strength === 2 ? t.medium || 'Medium' : t.strong || 'Strong'} /></div>)}
              </div>

              <AuthInput id="confirmPassword" name="confirmPassword" type={confirmPasswordToggle.inputType} label={t.confirmPassword || 'Confirm Password'} placeholder={t.confirmPasswordPlaceholder || '••••••••'} value={form.values.confirmPassword} onChange={form.handleChange} onBlur={form.handleBlur} disabled={form.isSubmitting || success} error={form.touched.confirmPassword && form.errors.confirmPassword} icon={Lock} rightIcon={confirmPasswordToggle.isVisible ? EyeOff : Eye} onRightIconClick={confirmPasswordToggle.toggle} required />

              <Button type="submit" className="w-full h-12 bg-gradient-to-r from-[#3BB273] to-[#D09943] hover:from-[#8D5E38] hover:to-[#D09943] text-white font-semibold rounded-xl shadow-[0_12px_36px_rgba(59,178,115,0.28)] hover:shadow-[0_18px_48px_rgba(208,153,67,0.28)] transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#3BB273]/20" disabled={form.isSubmitting || success}>
                {form.isSubmitting ? (<><Loader2 className="h-5 w-5 animate-spin mr-2" />{t.creatingAccount || 'Creating account...'}</>) : success ? (<><CheckCircle2 className="h-5 w-5 mr-2" />{t.accountCreated || 'Account Created!'}</>) : (t.signUp || 'Sign Up')}
              </Button>
            </form>

            <div className="relative my-4"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#38553B]/20"></div></div><div className="relative flex justify-center text-sm"><span className="px-4 bg-white text-[#8D5E38]">{t.or || 'or'}</span></div></div>

            <p className="text-center text-gray-600">{t.haveAccount || 'Already have an account?'}{' '}<Link to={ROUTES.LOGIN} className="text-[#38553B] hover:text-[#D09943] font-semibold transition-colors">{t.signInNow || 'Sign in now'}</Link></p>

            <p className="text-center text-sm text-gray-500 mt-6">{t.termsPrefix || 'By signing up, you agree to our'}{' '}<a href="#" className="text-[#38553B] hover:underline">{t.terms || 'Terms'}</a>{' '}{t.and || 'and'}{' '}<a href="#" className="text-[#38553B] hover:underline">{t.privacy || 'Privacy Policy'}</a></p>
          </div>
        </div>
      </div>

      <style jsx>{`@keyframes float {0%, 100% {transform: translateY(0px) rotate(0deg);}50% {transform: translateY(-20px) rotate(10deg);}}`}</style>
    </div>
  );
};

export default Signup;
