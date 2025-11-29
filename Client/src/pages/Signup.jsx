import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowLeft, Loader2, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/supabaseClient';
import { useLanguage } from '@/context/LanguageContext';
import { authTranslations } from '@/data/translations';

const Signup = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = authTranslations[language].signup;
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Password strength checker
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) return { strength: 1, label: t.weak, color: 'bg-red-500' };
    if (strength <= 3) return { strength: 2, label: t.medium, color: 'bg-yellow-500' };
    return { strength: 3, label: t.strong, color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    // Validation
    if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
      setError(t.allFieldsRequired);
      setLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError(t.invalidEmail);
      setLoading(false);
      return;
    }

    // Password validation
    if (formData.password.length < 8) {
      setError(t.passwordTooShort);
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t.passwordsNoMatch);
      setLoading(false);
      return;
    }

    try {
      // Supabase automatically hashes passwords using bcrypt and sends verification email
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone
          },
          emailRedirectTo: `${window.location.origin}/login`
        }
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError(t.emailExists);
        } else {
          setError(signUpError.message);
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        // Profile is automatically created by database trigger
        setSuccess(true);
        setLoading(false);
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err) {
      setError(t.signupFailed);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yamifit-primary/5 via-white to-yamifit-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to Home Button */}
        <Link to="/" className="inline-flex items-center text-yamifit-primary hover:text-yamifit-primary/80 mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span className="text-sm font-medium">{t.backToHome}</span>
        </Link>

        {/* Signup Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-yamifit-accent mb-2">
              Yami<span className="text-yamifit-primary">Fit</span>
            </h1>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">{t.createAccount}</h2>
            <p className="text-gray-600">{t.subtitle}</p>
          </div>

          {/* Success Alert */}
          {success && (
            <Alert className="mb-6 bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{t.successMessage}</AlertDescription>
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
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name Field */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                {t.fullName}
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder={t.fullNamePlaceholder}
                  value={formData.fullName}
                  onChange={handleChange}
                  className="pl-10 h-12 border-gray-300 focus:border-yamifit-primary focus:ring-yamifit-primary"
                  disabled={loading || success}
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                {t.email}
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t.emailPlaceholder}
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10 h-12 border-gray-300 focus:border-yamifit-primary focus:ring-yamifit-primary"
                  disabled={loading || success}
                />
              </div>
            </div>

            {/* Phone Field (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                {t.phone} <span className="text-gray-400 text-xs">({t.optional})</span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder={t.phonePlaceholder}
                  value={formData.phone}
                  onChange={handleChange}
                  className="pl-10 h-12 border-gray-300 focus:border-yamifit-primary focus:ring-yamifit-primary"
                  disabled={loading || success}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                {t.password}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t.passwordPlaceholder}
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10 pr-10 h-12 border-gray-300 focus:border-yamifit-primary focus:ring-yamifit-primary"
                  disabled={loading || success}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="space-y-1">
                  <div className="flex space-x-1">
                    {[1, 2, 3].map((level) => (
                      <div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          level <= passwordStrength.strength
                            ? passwordStrength.color
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-600">
                    {t.strength}: <span className={`font-medium ${
                      passwordStrength.strength === 1 ? 'text-red-600' :
                      passwordStrength.strength === 2 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>{passwordStrength.label}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                {t.confirmPassword}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder={t.confirmPasswordPlaceholder}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="pl-10 pr-10 h-12 border-gray-300 focus:border-yamifit-primary focus:ring-yamifit-primary"
                  disabled={loading || success}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 bg-yamifit-primary hover:bg-yamifit-primary/90 text-white font-semibold rounded-xl"
              disabled={loading || success}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  {t.creatingAccount}
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  {t.accountCreated}
                </>
              ) : (
                t.signUp
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">{t.or}</span>
            </div>
          </div>

          {/* Login Link */}
          <p className="text-center text-gray-600">
            {t.haveAccount}{' '}
            <Link
              to="/login"
              className="text-yamifit-primary hover:text-yamifit-primary/80 font-semibold transition-colors"
            >
              {t.signInNow}
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          {t.termsPrefix}{' '}
          <a href="#" className="text-yamifit-primary hover:underline">
            {t.terms}
          </a>{' '}
          {t.and}{' '}
          <a href="#" className="text-yamifit-primary hover:underline">
            {t.privacy}
          </a>
        </p>
      </div>
    </div>
  );
};

export default Signup;
