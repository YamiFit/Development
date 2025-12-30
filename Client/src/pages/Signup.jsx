import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowLeft, Loader2, CheckCircle2, XCircle, Apple, Activity, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/supabaseClient';
import { useLanguage } from '@/context/LanguageContext';
import { authTranslations } from '@/data/translations';
import logoVideo from '@/components/logo-animation.mp4';

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
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
      setError(t.allFieldsRequired);
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError(t.invalidEmail);
      setLoading(false);
      return;
    }

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
        setSuccess(true);
        setLoading(false);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err) {
      setError(t.signupFailed);
      setLoading(false);
    }
  };

  // أيقونات عشوائية
  const floatingIcons = [
    { Icon: Apple, top: '15%', left: '10%', delay: '0s', duration: '4s', color: 'text-primary' },
    { Icon: Activity, top: '25%', right: '15%', delay: '1s', duration: '5s', color: 'text-secondary' },
    { Icon: Heart, top: '60%', left: '8%', delay: '2s', duration: '6s', color: 'text-muted-foreground' },
    { Icon: Apple, top: '70%', right: '12%', delay: '0.5s', duration: '5.5s', color: 'text-primary' },
    { Icon: Activity, top: '40%', left: '5%', delay: '1.5s', duration: '4.5s', color: 'text-secondary' },
    { Icon: Heart, top: '80%', right: '8%', delay: '2.5s', duration: '5s', color: 'text-muted-foreground' },
  ];

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

      {/* أيقونات عائمة */}
      {floatingIcons.map((item, index) => (
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
            <item.Icon size={75} className="animate-pulse" style={{ animationDuration: '3s' }} />
            <div className="absolute inset-0">
              <item.Icon size={75} className="animate-ping" style={{ animationDuration: '4s', opacity: 0.5 }} />
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
        {/* زر العودة */}
        <Link to="/" className="inline-flex items-center mb-6 px-3 py-1.5 rounded-full bg-card shadow-md border border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-all text-sm font-medium z-20 relative">
          <ArrowLeft className="h-4 w-4 me-2" />
          <span className="text-sm">{t.backToHome}</span>
        </Link>

        {/* بطاقة التسجيل */}
        <div className="bg-card/80 backdrop-blur-sm rounded-3xl shadow-xl hover:shadow-2xl transition-shadow duration-300 overflow-hidden border border-primary/10">
          {/* الفيديو */}
          <div className="w-full bg-gradient-to-br from-[#38553B]/5 to-[#D09943]/5 overflow-hidden">
            <video autoPlay loop muted playsInline className="w-full h-52 sm:h-64 object-cover rounded-t-3xl block">
              <source src={logoVideo} type="video/mp4" />
            </video>
          </div>

          {/* محتوى البطاقة */}
          <div className="p-5">
            <div className="text-center mb-1">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">{t.createAccount}</h2>
            </div>

            {success && (
              <Alert className="mb-6 bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{t.successMessage}</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200">
                <XCircle className="h-4 w-4" />
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium text-foreground">{t.fullName}</Label>
                <div className="relative">
                  <User className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                  <Input id="fullName" name="fullName" type="text" placeholder={t.fullNamePlaceholder} value={formData.fullName} onChange={handleChange} className="ps-10 h-12 border-primary/20 focus:border-primary focus:ring-primary/20 rounded-xl" disabled={loading || success} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">{t.email}</Label>
                <div className="relative">
                  <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                  <Input id="email" name="email" type="email" placeholder={t.emailPlaceholder} value={formData.email} onChange={handleChange} className="ps-10 h-12 border-primary/20 focus:border-primary focus:ring-primary/20 rounded-xl" disabled={loading || success} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-foreground">{t.phone} <span className="text-muted-foreground text-xs">({t.optional})</span></Label>
                <div className="relative">
                  <Phone className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                  <Input id="phone" name="phone" type="tel" placeholder={t.phonePlaceholder} value={formData.phone} onChange={handleChange} className="ps-10 h-12 border-primary/20 focus:border-primary focus:ring-primary/20 rounded-xl" disabled={loading || success} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">{t.password}</Label>
                <div className="relative">
                  <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                  <Input id="password" name="password" type={showPassword ? 'text' : 'password'} placeholder={t.passwordPlaceholder} value={formData.password} onChange={handleChange} className="ps-10 pe-10 h-12 border-primary/20 focus:border-primary focus:ring-primary/20 rounded-xl" disabled={loading || success} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {formData.password && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3].map((level) => (
                        <div key={level} className={`h-1.5 flex-1 rounded-full transition-colors ${level <= passwordStrength.strength ? passwordStrength.color : 'bg-muted'}`} />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">{t.strength}: <span className={`font-medium ${passwordStrength.strength === 1 ? 'text-destructive' : passwordStrength.strength === 2 ? 'text-warning' : 'text-success'}`}>{passwordStrength.label}</span></p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">{t.confirmPassword}</Label>
                <div className="relative">
                  <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                  <Input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} placeholder={t.confirmPasswordPlaceholder} value={formData.confirmPassword} onChange={handleChange} className="ps-10 pe-10 h-12 border-primary/20 focus:border-primary focus:ring-primary/20 rounded-xl" disabled={loading || success} />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-10 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary/20"
                disabled={loading || success}
              >
                {loading ? (<><Loader2 className="h-5 w-5 animate-spin me-2" />{t.creatingAccount}</>) : success ? (<><CheckCircle2 className="h-5 w-5 me-2" />{t.accountCreated}</>) : (t.signUp)}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-primary/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-card text-muted-foreground">{t.or}</span>
              </div>
            </div>

            <p className="text-center text-muted-foreground">{t.haveAccount}{' '}<Link to="/login" className="text-primary hover:text-secondary font-semibold transition-colors">{t.signInNow}</Link></p>

            <p className="text-center text-sm text-muted-foreground mt-6">{t.termsPrefix}{' '}<a href="#" className="text-primary hover:text-secondary hover:underline transition-colors">{t.terms}</a>{' '}{t.and}{' '}<a href="#" className="text-primary hover:text-secondary hover:underline transition-colors">{t.privacy}</a></p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(10deg); }
        }
      `}</style>
    </div>
  );
};

export default Signup;