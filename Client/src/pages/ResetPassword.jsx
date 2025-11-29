import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/supabaseClient';
import { useLanguage } from '@/context/LanguageContext';
import { authTranslations } from '@/data/translations';

const ResetPassword = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = authTranslations[language].resetPassword;
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validToken, setValidToken] = useState(false);

  // Check if we have a valid session from the reset link
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setValidToken(true);
      } else {
        setError(t.invalidToken);
      }
    };
    checkSession();
  }, [t.invalidToken]);

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
    if (!formData.password || !formData.confirmPassword) {
      setError(t.allFieldsRequired);
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
      // Update password using Supabase
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.password
      });

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(t.resetFailed);
      setLoading(false);
    }
  };

  if (!validToken && error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yamifit-primary/5 via-white to-yamifit-secondary/5 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <h1 className="text-3xl font-bold text-yamifit-accent mb-2">
                Yami<span className="text-yamifit-primary">Fit</span>
              </h1>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">{t.invalidOrExpired}</h2>
              <p className="text-gray-600 mb-6">{t.tokenExpiredMessage}</p>
              <Button
                onClick={() => navigate('/forgot-password')}
                className="w-full h-12 bg-yamifit-primary hover:bg-yamifit-primary/90 text-white font-semibold rounded-xl"
              >
                {t.requestNewLink}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yamifit-primary/5 via-white to-yamifit-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Reset Password Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-yamifit-primary/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-yamifit-primary" />
            </div>
            <h1 className="text-3xl font-bold text-yamifit-accent mb-2">
              Yami<span className="text-yamifit-primary">Fit</span>
            </h1>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">{t.resetPassword}</h2>
            <p className="text-gray-600">{t.subtitle}</p>
          </div>

          {/* Success Alert */}
          {success && (
            <Alert className="mb-6 bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {t.successMessage}
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

          {!success && validToken && (
            <>
              {/* Reset Password Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    {t.newPassword}
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
                      disabled={loading}
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
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      {t.resetting}
                    </>
                  ) : (
                    t.resetPassword
                  )}
                </Button>
              </form>

              {/* Password Requirements */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <p className="text-sm font-semibold text-blue-900 mb-2">{t.passwordRequirements}:</p>
                <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                  <li>{t.requirement1}</li>
                  <li>{t.requirement2}</li>
                  <li>{t.requirement3}</li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          {t.rememberPassword}{' '}
          <button
            onClick={() => navigate('/login')}
            className="text-yamifit-primary hover:underline font-semibold"
          >
            {t.backToLogin}
          </button>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
