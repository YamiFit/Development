import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/supabaseClient';
import { useLanguage } from '@/context/LanguageContext';
import { authTranslations } from '@/data/translations';

const Login = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = authTranslations[language].login;
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

    // Validation
    if (!formData.email || !formData.password) {
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

    try {
      // Supabase handles password hashing automatically
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError(t.invalidCredentials);
        } else if (signInError.message.includes('Email not confirmed')) {
          setError(t.emailNotVerified);
        } else {
          setError(signInError.message);
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        // Update last login in profiles table
        await supabase
          .from('profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('id', data.user.id);

        // Navigate to dashboard home page
        navigate('/home');
      }
    } catch (err) {
      setError(t.loginFailed);
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

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-yamifit-accent mb-2">
              Yami<span className="text-yamifit-primary">Fit</span>
            </h1>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">{t.welcomeBack}</h2>
            <p className="text-gray-600">{t.subtitle}</p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
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
                  disabled={loading}
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
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-yamifit-primary hover:text-yamifit-primary/80 font-medium transition-colors"
              >
                {t.forgotPassword}
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 bg-yamifit-primary hover:bg-yamifit-primary/90 text-white font-semibold rounded-xl"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  {t.signingIn}
                </>
              ) : (
                t.signIn
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

          {/* Sign Up Link */}
          <p className="text-center text-gray-600">
            {t.noAccount}{' '}
            <Link
              to="/signup"
              className="text-yamifit-primary hover:text-yamifit-primary/80 font-semibold transition-colors"
            >
              {t.signUpNow}
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

export default Login;
