import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSettings } from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '@/supabaseClient';

export default function SecurityTab() {
  const { t } = useTranslation();
  const { updatePassword, loading, authLoading } = useSettings();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [errors, setErrors] = useState({});
  const [isInitialized, setIsInitialized] = useState(true);

  // Password strength indicator
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) return { strength, label: t('settingsSecurity.weak'), color: 'bg-red-500' };
    if (strength === 3) return { strength, label: t('settingsSecurity.medium'), color: 'bg-yellow-500' };
    return { strength, label: t('settingsSecurity.strong'), color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = t('settingsSecurity.currentPasswordRequired');
    }

    if (!formData.newPassword) {
      newErrors.newPassword = t('settingsSecurity.newPasswordRequired');
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = t('settingsSecurity.passwordMinLength');
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('settingsSecurity.confirmPasswordRequired');
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = t('settingsSecurity.passwordsDoNotMatch');
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const { error } = await updatePassword(
      formData.currentPassword,
      formData.newPassword,
      formData.confirmPassword
    );

    if (error) {
      toast({
        title: t('common.error'),
        description: error.message || t('settingsSecurity.updateFailed'),
        variant: 'destructive',
      });
    } else {
      toast({
        title: t('common.success'),
        description: t('settingsSecurity.updateSuccess'),
      });

      // Sign out user and redirect to login
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate('/login');
      }, 1500);
    }
  };

  // Password requirements
  const requirements = [
    { label: t('settingsSecurity.atLeast8Chars'), test: (pwd) => pwd.length >= 8 },
    { label: t('settingsSecurity.oneLowercase'), test: (pwd) => /[a-z]/.test(pwd) },
    { label: t('settingsSecurity.oneUppercase'), test: (pwd) => /[A-Z]/.test(pwd) },
    { label: t('settingsSecurity.oneNumber'), test: (pwd) => /\d/.test(pwd) },
  ];

  // Show loading while auth is initializing
  if (authLoading && !isInitialized) {
    return (
      <div className="bg-white rounded-xl p-6 shadow border flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 shadow border">
      <h2 className="text-lg sm:text-xl font-semibold mb-4">{t('settingsSecurity.title')}</h2>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Current Password */}
        <div className="space-y-2">
          <Label htmlFor="currentPassword">{t('settingsSecurity.currentPassword')}</Label>
          <div className="relative">
            <Input
              id="currentPassword"
              type={showPasswords.current ? 'text' : 'password'}
              value={formData.currentPassword}
              onChange={(e) => handleChange('currentPassword', e.target.value)}
              placeholder={t('settingsSecurity.enterCurrentPassword')}
              className={errors.currentPassword ? 'border-red-500 pe-10' : 'pe-10'}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('current')}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPasswords.current ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.currentPassword && (
            <p className="text-sm text-red-500">{errors.currentPassword}</p>
          )}
        </div>

        {/* New Password */}
        <div className="space-y-2">
          <Label htmlFor="newPassword">{t('settingsSecurity.newPassword')}</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showPasswords.new ? 'text' : 'password'}
              value={formData.newPassword}
              onChange={(e) => handleChange('newPassword', e.target.value)}
              placeholder={t('settingsSecurity.enterNewPassword')}
              className={errors.newPassword ? 'border-red-500 pe-10' : 'pe-10'}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('new')}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPasswords.new ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.newPassword && (
            <p className="text-sm text-red-500">{errors.newPassword}</p>
          )}

          {/* Password Strength Indicator */}
          {formData.newPassword && (
            <div className="space-y-2 mt-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${passwordStrength.color}`}
                    style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{passwordStrength.label}</span>
              </div>

              {/* Requirements checklist */}
              <div className="space-y-1 text-sm">
                {requirements.map((req, index) => {
                  const met = req.test(formData.newPassword);
                  return (
                    <div
                      key={index}
                      className={`flex items-center gap-2 ${
                        met ? 'text-green-600' : 'text-gray-500'
                      }`}
                    >
                      {met ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      <span>{req.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">{t('settingsSecurity.confirmNewPassword')}</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showPasswords.confirm ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              placeholder={t('settingsSecurity.confirmNewPasswordPlaceholder')}
              className={errors.confirmPassword ? 'border-red-500 pe-10' : 'pe-10'}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('confirm')}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPasswords.confirm ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-red-500">{errors.confirmPassword}</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <Button
            type="submit"
            disabled={loading}
            className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                {t('settingsSecurity.updating')}
              </>
            ) : (
              t('settingsSecurity.updatePassword')
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
