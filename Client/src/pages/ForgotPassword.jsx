import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle2, XCircle, Apple, Activity, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/supabaseClient';
import { useLanguage } from '@/context/LanguageContext';
import { authTranslations } from '@/data/translations';
import logoVideo from '@/components/logo-animation.mp4';

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
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-muted to-secondary/5 flex items-center justify-center p-4 relative overflow-hidden">
      {/* خلفية زخرفية */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 start-10 w-72 h-72 bg-primary rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 end-10 w-96 h-96 bg-secondary rounded-full blur-3xl"></div>
      </div>

      {/* الخط المائل */}
      <div className="absolute top-0 start-0 w-full z-0">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
          <path fill="hsl(var(--primary))" fillOpacity="0.5" d="M0,160L48,170.7C96,181,192,203,288,202.7C384,203,480,181,576,154.7C672,128,768,96,864,117.3C960,139,1056,213,1152,234.7C1248,256,1344,224,1392,208L1440,192L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
        </svg>
      </div>

      {/* أيقونات عشوائية في الخلفية */}
      {[
        { Icon: Apple, top: '15%', left: '10%', delay: '0s', duration: '4s', color: 'text-primary' },
        { Icon: Activity, top: '25%', right: '15%', delay: '1s', duration: '5s', color: 'text-secondary' },
        { Icon: Heart, top: '60%', left: '8%', delay: '2s', duration: '6s', color: 'text-muted-foreground' },
      ].map((item, index) => (
        <div
          key={index}
          className={`hidden lg:block absolute ${item.color} opacity-30`}
          style={{
            top: item.top,
            left: item.left,
            right: item.right,
            animation: `float ${item.duration} ease-in-out infinite`,
            animationDelay: item.delay,
          }}
        >
          <div className="relative">
            <item.Icon size={60} className="animate-pulse" style={{ animationDuration: '3s' }} />
            <div className="absolute inset-0">
              <item.Icon size={60} className="animate-ping" style={{ animationDuration: '4s', opacity: 0.5 }} />
            </div>
          </div>
        </div>
      ))}

      {/* حروف Y و F */}
      <div className="absolute top-4 start-4 flex items-center gap-3 z-0">
        <span className="font-extrabold text-5xl select-none text-secondary">Y</span>
        <span className="font-extrabold text-5xl select-none text-secondary">F</span>
      </div>

      <div className="w-full max-w-md relative z-10">
        <Link to="/login" className="inline-flex items-center mb-4 px-3 py-1.5 rounded-full bg-card shadow-md border border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-all text-sm font-medium z-20 relative">
          <ArrowLeft className="h-4 w-4 me-2" />
          <span className="text-sm">{t.backToLogin}</span>
        </Link>

        <div className="bg-card/80 backdrop-blur-sm rounded-3xl shadow-xl hover:shadow-2xl transition-shadow duration-300 overflow-hidden border border-primary/10">
          {/* video strip */}
          <div className="w-full bg-gradient-to-br from-[#38553B]/5 to-[#D09943]/5 overflow-hidden">
            <video autoPlay loop muted playsInline className="w-full h-44 sm:h-52 object-cover rounded-t-3xl block">
              <source src={logoVideo} type="video/mp4" />
            </video>
          </div>

          <div className="p-4">
            <div className="text-center mb-1">
              <h2 className="text-xl font-semibold text-foreground mb-0">{t.forgotPassword}</h2>
            </div>

            {success && (
              <Alert className="mb-4 bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{t.successMessage}</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive" className="mb-4 bg-red-50 border-red-200">
                <XCircle className="h-4 w-4" />
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            {!success ? (
              <>
                <form onSubmit={handleSubmit} className="space-y-2">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-foreground">{t.email}</Label>
                    <div className="relative">
                      <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder={t.emailPlaceholder}
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(''); }}
                        className="ps-10 h-10 border-primary/20 focus:border-primary focus:ring-primary/20 rounded-xl"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-10 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary/20" disabled={loading}>
                    {loading ? (<><Loader2 className="h-5 w-5 animate-spin me-2" />{t.sending}</>) : (t.sendResetLink)}
                  </Button>
                </form>

                <div className="mt-4 p-3 bg-info/10 border border-info/20 rounded-lg">
                  <p className="text-sm text-info"><strong>{t.note}:</strong> {t.noteMessage}</p>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Button onClick={() => { setSuccess(false); setEmail(''); }} variant="outline" className="w-full h-10 border-primary text-primary hover:bg-primary/10 rounded-xl">{t.sendAgain}</Button>
                  <Link to="/login" className="block"><Button className="w-full h-10 bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold rounded-xl">{t.backToLogin}</Button></Link>
                </div>

                <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                  <p className="text-sm text-warning"><strong>{t.didntReceive}:</strong> {t.checkSpam}</p>
                </div>
              </div>
            )}

            {!success && (
              <>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-primary/20"></div></div>
                  <div className="relative flex justify-center text-sm"><span className="px-4 bg-card text-muted-foreground">{t.or}</span></div>
                </div>

                <p className="text-center text-muted-foreground">{t.noAccount}{' '}<Link to="/signup" className="text-primary hover:text-secondary font-semibold transition-colors">{t.createOne}</Link></p>
              </>
            )}

            <p className="text-center text-sm text-muted-foreground mt-6">{t.needHelp}{' '}<a href="#" className="text-primary hover:underline">{t.contactSupport}</a></p>
          </div>
        </div>
      </div>

      <style jsx>{`@keyframes float {0%, 100% {transform: translateY(0px) rotate(0deg);}50% {transform: translateY(-20px) rotate(10deg);}}`}</style>
    </div>
  );
};

export default ForgotPassword;
