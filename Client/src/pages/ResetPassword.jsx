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
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-2xl shadow-xl p-8 border border-border">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Yami<span className="text-primary">Fit</span>
              </h1>
              <h2 className="text-2xl font-semibold text-foreground mb-2">{t.invalidOrExpired}</h2>
              <p className="text-muted-foreground mb-6">{t.tokenExpiredMessage}</p>
              <Button
                onClick={() => navigate('/forgot-password')}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl"
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Reset Password Card */}
        <div className="bg-card rounded-2xl shadow-xl p-8 border border-border">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Yami<span className="text-primary">Fit</span>
            </h1>
            <h2 className="text-2xl font-semibold text-foreground mb-2">{t.resetPassword}</h2>
            <p className="text-muted-foreground">{t.subtitle}</p>
          </div>

          {/* Success Alert */}
          {success && (
            <Alert className="mb-6 bg-success/10 border-success/20">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <AlertDescription className="text-success">
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
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">
                    {t.newPassword}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={t.passwordPlaceholder}
                      value={formData.password}
                      onChange={handleChange}
                      className="ps-10 pe-10 h-12 border-border focus:border-primary focus:ring-primary"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  
                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        {[1, 2, 3].map((level) => (
                          <div
                            key={level}
                            className={`h-1.5 flex-1 rounded-full transition-colors ${
                              level <= passwordStrength.strength
                                ? passwordStrength.color
                                : 'bg-muted'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t.strength}: <span className={`font-medium ${
                          passwordStrength.strength === 1 ? 'text-destructive' :
                          passwordStrength.strength === 2 ? 'text-warning' :
                          'text-success'
                        }`}>{passwordStrength.label}</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                    {t.confirmPassword}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder={t.confirmPasswordPlaceholder}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="ps-10 pe-10 h-12 border-border focus:border-primary focus:ring-primary"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin me-2" />
                      {t.resetting}
                    </>
                  ) : (
                    t.resetPassword
                  )}
                </Button>
              </form>

              {/* Password Requirements */}
              <div className="mt-6 p-4 bg-info/10 border border-info/20 rounded-lg">
                <p className="text-sm font-semibold text-info mb-2">{t.passwordRequirements}:</p>
                <ul className="text-xs text-info/80 space-y-1 list-disc list-inside">
                  <li>{t.requirement1}</li>
                  <li>{t.requirement2}</li>
                  <li>{t.requirement3}</li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          {t.rememberPassword}{' '}
          <button
            onClick={() => navigate('/login')}
            className="text-primary hover:underline font-semibold"
          >
            {t.backToLogin}
          </button>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
