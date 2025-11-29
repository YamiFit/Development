import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/supabaseClient';
import { useLanguage } from '@/context/LanguageContext';
import { authTranslations } from '@/data/translations';

const ForgotPassword = () => {
  const { language } = useLanguage();
  const t = authTranslations[language].forgotPassword;
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    // Validation
    if (!email) {
      setError(t.emailRequired);
      setLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t.invalidEmail);
      setLoading(false);
      return;
    }

    try {
      // Send password reset email
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (resetError) {
        setError(resetError.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
    } catch (err) {
      setError(t.resetFailed);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yamifit-primary/5 via-white to-yamifit-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to Login Button */}
        <Link to="/login" className="inline-flex items-center text-yamifit-primary hover:text-yamifit-primary/80 mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span className="text-sm font-medium">{t.backToLogin}</span>
        </Link>

        {/* Forgot Password Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-yamifit-primary/10 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-yamifit-primary" />
            </div>
            <h1 className="text-3xl font-bold text-yamifit-accent mb-2">
              Yami<span className="text-yamifit-primary">Fit</span>
            </h1>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">{t.forgotPassword}</h2>
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

          {!success ? (
            <>
              {/* Reset Password Form */}
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
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                      }}
                      className="pl-10 h-12 border-gray-300 focus:border-yamifit-primary focus:ring-yamifit-primary"
                      disabled={loading}
                    />
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
                      {t.sending}
                    </>
                  ) : (
                    t.sendResetLink
                  )}
                </Button>
              </form>

              {/* Additional Info */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>{t.note}:</strong> {t.noteMessage}
                </p>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              {/* Success Actions */}
              <div className="space-y-3">
                <Button
                  onClick={() => {
                    setSuccess(false);
                    setEmail('');
                  }}
                  variant="outline"
                  className="w-full h-12 border-yamifit-primary text-yamifit-primary hover:bg-yamifit-primary/10 rounded-xl"
                >
                  {t.sendAgain}
                </Button>
                <Link to="/login" className="block">
                  <Button
                    className="w-full h-12 bg-yamifit-primary hover:bg-yamifit-primary/90 text-white font-semibold rounded-xl"
                  >
                    {t.backToLogin}
                  </Button>
                </Link>
              </div>

              {/* Help Text */}
              <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>{t.didntReceive}:</strong> {t.checkSpam}
                </p>
              </div>
            </div>
          )}

          {/* Divider */}
          {!success && (
            <>
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
                  {t.createOne}
                </Link>
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          {t.needHelp}{' '}
          <a href="#" className="text-yamifit-primary hover:underline">
            {t.contactSupport}
          </a>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
