import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, Loader2, Apple, Activity, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuthRedux';
import { useLanguage } from '@/context/LanguageContext';
import { authTranslations } from '@/data/translations';
import { ROLE_DASHBOARD_ROUTES } from '@/config/constants';
import * as profileService from '@/services/api/profile.service';
import logoVideo from '@/components/logo-animation.mp4';

const Login = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = authTranslations[language].login;
  const { signIn } = useAuth();
  
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.email || !formData.password) {
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

    try {
      const { data, error: signInError } = await signIn({
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

      if (data?.user) {
        // Fetch profile directly to get role (Redux might not be updated yet)
        const { data: profileData } = await profileService.getProfile(data.user.id);
        const userRole = profileData?.role || 'user';
        const dashboardRoute = ROLE_DASHBOARD_ROUTES[userRole] || '/home';
        
        console.log('✅ Login successful, navigating to:', dashboardRoute);
        navigate(dashboardRoute);
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      setError(t.loginFailed);
      setLoading(false);
    }
  };

  // أيقونات عشوائية في الخلفية
  const floatingIcons = [
    { Icon: Apple, top: '15%', left: '10%', delay: '0s', duration: '4s', color: 'text-primary' },
    { Icon: Activity, top: '25%', right: '15%', delay: '1s', duration: '5s', color: 'text-secondary' },
    { Icon: Heart, top: '60%', left: '8%', delay: '2s', duration: '6s', color: 'text-secondary' },
    { Icon: Apple, top: '70%', right: '12%', delay: '0.5s', duration: '5.5s', color: 'text-primary' },
    { Icon: Activity, top: '40%', left: '5%', delay: '1.5s', duration: '4.5s', color: 'text-secondary' },
    { Icon: Heart, top: '80%', right: '8%', delay: '2.5s', duration: '5s', color: 'text-secondary' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4 relative overflow-hidden">
      {/* خلفية زخرفية */}

      
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 start-10 w-72 h-72 bg-primary rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 end-10 w-96 h-96 bg-secondary rounded-full blur-3xl"></div>
      </div>

      {/* الخط المائل بطول الصفحة */}
        <div className="absolute top-0 start-0 w-full z-0">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="fill-primary">
          <path fillOpacity="1" d="M0,160L48,170.7C96,181,192,203,288,202.7C384,203,480,181,576,154.7C672,128,768,96,864,117.3C960,139,1056,213,1152,234.7C1248,256,1344,224,1392,208L1440,192L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
        </svg>
      </div>

      {/* أيقونات عائمة متحركة */}
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

      {/* حروف Y و F في الأعلى */}
<div className="absolute top-4 start-4 flex items-center gap-3 z-0">
  <span className="font-extrabold text-5xl select-none text-secondary">Y</span>
  <span className="font-extrabold text-5xl select-none text-secondary">F</span>
</div>



      <div className="w-full max-w-md relative z-10">
        {/* زر العودة */}
          <Link to="/" className="inline-flex items-center mb-4 px-3 py-1.5 rounded-full bg-card shadow-md border border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-all text-sm font-medium z-20 relative">
          <ArrowLeft className="h-4 w-4 me-2" />
          <span className="text-sm">{t.backToHome}</span>
        </Link>

        {/* بطاقة تسجيل الدخول */}
        <div className="bg-card/90 backdrop-blur-sm rounded-3xl shadow-xl hover:shadow-2xl transition-shadow duration-300 overflow-hidden border border-border">
          {/* شريط الفيديو */}
          <div className="w-full bg-gradient-to-br from-primary/5 to-secondary/5 overflow-hidden">
            <video
              autoPlay
              loop
              muted
              playsInline
                className="w-full h-44 sm:h-52 object-cover rounded-t-3xl block"
            >
              <source src={logoVideo} type="video/mp4" />
            </video>
          </div>

          {/* محتوى البطاقة */}
          <div className="p-4">
            <div className="text-center mb-1">
              <h2 className="text-xl font-semibold text-foreground mb-0">{t.welcomeBack}</h2>
            </div>

            {/* رسالة الخطأ */}
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* نموذج تسجيل الدخول */}
            <form onSubmit={handleSubmit} className="space-y-2">
              {/* حقل البريد الإلكتروني */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  {t.email}
                </Label>
                <div className="relative">
                  <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder={t.emailPlaceholder}
                    value={formData.email}
                    onChange={handleChange}
                    className="ps-10 h-10 rounded-xl"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* حقل كلمة المرور */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  {t.password}
                </Label>
                <div className="relative">
                  <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t.passwordPlaceholder}
                    value={formData.password}
                    onChange={handleChange}
                    className="ps-10 pe-10 h-10 rounded-xl"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* رابط نسيت كلمة المرور */}
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm text-secondary hover:text-secondary/80 font-medium transition-colors">
                  {t.forgotPassword}
                </Link>
              </div>

              {/* زر الإرسال */}
              <Button
                type="submit"
                className="w-full h-10 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
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

            {/* الفاصل */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-card text-muted-foreground">{t.or}</span>
              </div>
            </div>

            {/* رابط التسجيل */}
            <p className="text-center text-muted-foreground">
              {t.noAccount}{' '}
              <Link to="/signup" className="text-primary hover:text-secondary font-semibold transition-colors">
                {t.signUpNow}
              </Link>
            </p>

            <p className="text-center text-sm text-muted-foreground mt-6">
          {t.termsPrefix}{' '}
          <a href="#" className="text-primary hover:text-secondary hover:underline transition-colors">
            {t.terms}
          </a>{' '}
          {t.and}{' '}
          <a href="#" className="text-primary hover:text-secondary hover:underline transition-colors">
            {t.privacy}
          </a>
        </p>
          </div>
        </div>

        {/* التذييل */}
        
      </div>

      {/* CSS للحركة */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(10deg);
          }
        }
      `}</style>
    </div>
  );
};

export default Login;