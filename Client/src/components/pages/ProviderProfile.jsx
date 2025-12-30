/**
 * Provider Profile Page
 * Manage provider business information and working hours
 * Redesigned for better UX, clean layout, and full responsiveness
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { CheckCircle, AlertCircle, Upload, X, Clock, Camera, Store, User, Phone, MapPin, Mail, Tag, FileText } from 'lucide-react';
import LoadingSpinner from '../shared/LoadingSpinner';
import ErrorMessage from '../shared/ErrorMessage';
import WorkingHoursManager from '../provider/WorkingHoursManager';
import { useProviderInit } from '@/hooks/useProviderInit';
import { useDispatch } from 'react-redux';
import { updateProviderProfile } from '@/store/slices/providerSlice';
import { updateProviderProfile as updateProviderProfileService } from '@/services/api/providers.service';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/supabaseClient';

const STORE_CATEGORIES = [
  'Fast Food',
  'Healthy Food',
  'Traditional Food',
  'Desserts & Sweets',
  'Beverages',
  'Vegan & Vegetarian',
  'Other',
];

const ProviderProfile = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const isSetup = searchParams.get('setup') === 'true';
  const { provider, loading, error } = useProviderInit();
  const dispatch = useDispatch();
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    provider_name: '',
    business_name: '',
    bio: '',
    category: '',
    email: '',
    phone: '',
    whatsapp: '',
    address: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Initialize form data when provider loads
  useEffect(() => {
    if (provider) {
      setFormData({
        provider_name: provider.provider_name || '',
        business_name: provider.business_name || '',
        bio: provider.bio || '',
        category: provider.category || '',
        email: provider.email || '',
        phone: provider.phone || '',
        whatsapp: provider.whatsapp || '',
        address: provider.address || '',
      });
      setImagePreview(provider.profile_image_url);
    }
  }, [provider]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Handle category change
  const handleCategoryChange = (value) => {
    setFormData(prev => ({ ...prev, category: value }));
    if (formErrors.category) {
      setFormErrors(prev => ({ ...prev, category: undefined }));
    }
  };

  // Handle image selection
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: t('providerProfile.invalidFileType'),
        description: t('providerProfile.uploadJpgPngWebp'),
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t('providerProfile.fileTooLarge'),
        description: t('providerProfile.imageMustBeLessThan5MB'),
        variant: 'destructive',
      });
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // Remove image
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  // Upload image to Supabase Storage
  const uploadProfileImage = async () => {
    if (!imageFile || !provider?.id) return null;

    setUploadingImage(true);

    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${provider.id}-${Date.now()}.${fileExt}`;
      const filePath = `provider-profiles/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('meal-images')
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('meal-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      console.error('Error uploading image:', err);
      toast({
        title: t('providerProfile.uploadFailed'),
        description: t('providerProfile.failedToUploadImage'),
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formData.business_name?.trim()) {
      errors.business_name = t('providerProfile.storeNameRequired');
    }

    if (!formData.phone?.trim()) {
      errors.phone = t('providerProfile.phoneRequired');
    }

    if (!formData.address?.trim()) {
      errors.address = t('providerProfile.addressRequired');
    }

    return errors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast({
        title: t('providerProfile.validationError'),
        description: t('providerProfile.pleaseFixErrors'),
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      let profileImageUrl = provider?.profile_image_url;

      // Upload image if changed
      if (imageFile) {
        const uploadedUrl = await uploadProfileImage();
        if (uploadedUrl) {
          profileImageUrl = uploadedUrl;
        }
      } else if (imagePreview === null) {
        // User removed the image
        profileImageUrl = null;
      }

      // Update provider profile
      const { data: updatedProvider, error: updateError } = await updateProviderProfileService(
        provider.id,
        {
          ...formData,
          profile_image_url: profileImageUrl,
        }
      );

      if (updateError) throw updateError;

      // Update Redux state
      dispatch(updateProviderProfile(updatedProvider));

      toast({
        title: t('common.success'),
        description: t('providerProfile.profileUpdated'),
      });

      // Clear setup mode from URL
      if (isSetup) {
        window.history.replaceState({}, '', '/provider/profile');
      }

      // Clear image file state
      setImageFile(null);
    } catch (err) {
      console.error('Error updating profile:', err);
      toast({
        title: t('common.error'),
        description: err.message || t('providerProfile.failedToUpdate'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Get store open/closed status
  const getStoreStatus = () => {
    // This would check current time against working hours
    // For now, just show a placeholder
    return { isOpen: false, message: 'Status based on working hours' };
  };

  const storeStatus = getStoreStatus();

  // Handle loading state
  if (loading) {
    return (
      <Layout>
        <LoadingSpinner message={t('providerProfile.loadingProfile')} />
      </Layout>
    );
  }

  // Handle error state
  if (error) {
    return (
      <Layout>
        <ErrorMessage
          title={t('providerProfile.failedToLoadProfile')}
          message={error}
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full min-w-0 space-y-6 pb-8">
        {/* Header */}
        <div className="w-full min-w-0 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-1 flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 break-words">{t('providerProfile.title')}</h1>
            <p className="text-sm sm:text-base text-muted-foreground break-words">
              {t('providerProfile.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Badge variant={storeStatus.isOpen ? 'default' : 'secondary'} className={storeStatus.isOpen ? 'bg-green-100 text-green-800 border-green-200 whitespace-nowrap' : 'bg-gray-100 text-gray-800 border-gray-200 whitespace-nowrap'}>
              {storeStatus.isOpen ? t('providerProfile.openNow') : t('providerProfile.closed')}
            </Badge>
          </div>
        </div>

        {/* Setup alert */}
        {isSetup && (
          <Card className="w-full min-w-0 border-yellow-200 bg-yellow-50 shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-yellow-100 flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-yellow-900 mb-1 break-words">{t('providerProfile.completeYourProfile')}</p>
                  <p className="text-sm text-yellow-800 break-words">
                    {t('providerProfile.fillBusinessInfo')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="w-full min-w-0 space-y-6">
          {/* Profile Image Section */}
          <Card className="w-full min-w-0 shadow-sm">
            <CardHeader className="pb-4 px-4 sm:px-6">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="p-2 rounded-lg bg-blue-50 flex-shrink-0">
                    <Camera className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base sm:text-lg truncate">{t('providerProfile.profileImage')}</CardTitle>
                    <CardDescription className="text-sm mt-0.5 truncate">{t('providerProfile.uploadBusinessLogo')}</CardDescription>
                  </div>
                </div>
                {provider?.is_verified ? (
                  <Badge className="bg-green-100 text-green-800 border-green-200 flex-shrink-0 whitespace-nowrap">
                    <CheckCircle className="h-3 w-3 me-1" />
                    {t('providerProfile.verified')}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200 flex-shrink-0 whitespace-nowrap">
                    {t('providerProfile.pendingVerification')}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="relative group">
                  <Avatar
                    className="h-24 w-24 sm:h-28 sm:w-28 cursor-pointer ring-4 ring-offset-2 ring-transparent group-hover:ring-green-200 transition-all flex-shrink-0"
                    onClick={() => document.getElementById('profile-image')?.click()}
                  >
                    <AvatarImage src={imagePreview} alt="Profile" className="object-cover" />
                    <AvatarFallback className="bg-gray-100">
                      <Camera className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                  {imagePreview && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-3 w-full sm:w-auto min-w-0">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('profile-image')?.click()}
                      className="hover:bg-green-50 hover:border-green-300 hover:text-green-700"
                    >
                      <Upload className="h-4 w-4 me-2" />
                      <span className="truncate">{imagePreview ? t('providerProfile.changePhoto') : t('providerProfile.uploadPhoto')}</span>
                    </Button>
                    {imagePreview && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveImage}
                        className="hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                      >
                        <X className="h-4 w-4 me-2" />
                        {t('providerProfile.remove')}
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground break-words">
                    {t('providerProfile.imageFormatInfo')}
                  </p>
                  <input
                    id="profile-image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Information */}
          <Card className="w-full min-w-0 shadow-sm">
            <CardHeader className="pb-4 px-4 sm:px-6">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-green-50 flex-shrink-0">
                  <Store className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base sm:text-lg truncate">{t('providerProfile.businessInformation')}</CardTitle>
                  <CardDescription className="text-sm mt-0.5 truncate">{t('providerProfile.storeDetailsAndCategory')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="grid gap-4 sm:gap-5">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  {/* Provider Name */}
                  <div className="space-y-2 min-w-0">
                    <Label htmlFor="provider_name" className="flex items-center gap-2 text-sm font-medium">
                      <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{t('providerProfile.providerName')}</span>
                    </Label>
                    <Input
                      id="provider_name"
                      name="provider_name"
                      value={formData.provider_name}
                      onChange={handleChange}
                      placeholder={t('providerProfile.yourName')}
                      className="h-10 w-full"
                    />
                  </div>

                  {/* Store Name */}
                  <div className="space-y-2 min-w-0">
                    <Label htmlFor="business_name" className="flex items-center gap-2 text-sm font-medium">
                      <Store className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{t('providerProfile.storeName')}</span>
                      <span className="text-red-500 ms-1">*</span>
                    </Label>
                    <Input
                      id="business_name"
                      name="business_name"
                      value={formData.business_name}
                      onChange={handleChange}
                      placeholder={t('providerProfile.yourStoreName')}
                      className={`h-10 w-full ${formErrors.business_name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    />
                    {formErrors.business_name && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 flex-shrink-0" />
                        <span className="break-words">{formErrors.business_name}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Category */}
                <div className="space-y-2 min-w-0">
                  <Label htmlFor="category" className="flex items-center gap-2 text-sm font-medium">
                    <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{t('providerProfile.categoryType')}</span>
                  </Label>
                  <Select value={formData.category} onValueChange={handleCategoryChange}>
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue placeholder={t('providerProfile.selectCategory')} />
                    </SelectTrigger>
                    <SelectContent>
                      {STORE_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Bio / About */}
                <div className="space-y-2 min-w-0">
                  <Label htmlFor="bio" className="flex items-center gap-2 text-sm font-medium">
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{t('providerProfile.aboutYourBusiness')}</span>
                  </Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder={t('providerProfile.aboutPlaceholder')}
                    rows={4}
                    className="resize-none w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('providerProfile.characters', { count: formData.bio.length, max: 500 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="w-full min-w-0 shadow-sm">
            <CardHeader className="pb-4 px-4 sm:px-6">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-orange-50 flex-shrink-0">
                  <Phone className="h-5 w-5 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base sm:text-lg truncate">{t('providerProfile.contactInformation')}</CardTitle>
                  <CardDescription className="text-sm mt-0.5 truncate">{t('providerProfile.howCustomersReach')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="grid gap-4 sm:gap-5">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  {/* Phone */}
                  <div className="space-y-2 min-w-0">
                    <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium">
                      <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{t('providerProfile.phoneNumber')}</span>
                      <span className="text-red-500 ms-1">*</span>
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+962 7X XXX XXXX"
                      className={`h-10 w-full ${formErrors.phone ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    />
                    {formErrors.phone && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 flex-shrink-0" />
                        <span className="break-words">{formErrors.phone}</span>
                      </p>
                    )}
                  </div>

                  {/* WhatsApp */}
                  <div className="space-y-2 min-w-0">
                    <Label htmlFor="whatsapp" className="flex items-center gap-2 text-sm font-medium">
                      <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{t('providerProfile.whatsapp')}</span>
                      <span className="text-muted-foreground text-xs">({t('common.optional')})</span>
                    </Label>
                    <Input
                      id="whatsapp"
                      name="whatsapp"
                      type="tel"
                      value={formData.whatsapp}
                      onChange={handleChange}
                      placeholder="+962 7X XXX XXXX"
                      className="h-10 w-full"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2 min-w-0">
                  <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                    <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{t('providerProfile.emailAddress')}</span>
                    <span className="text-muted-foreground text-xs">({t('common.optional')})</span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="store@example.com"
                    className="h-10 w-full"
                  />
                </div>

                {/* Address */}
                <div className="space-y-2 min-w-0">
                  <Label htmlFor="address" className="flex items-center gap-2 text-sm font-medium">
                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{t('providerProfile.businessAddress')}</span>
                    <span className="text-red-500 ms-1">*</span>
                  </Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder={t('providerProfile.addressPlaceholder')}
                    className={`h-10 w-full ${formErrors.address ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  />
                  {formErrors.address && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 flex-shrink-0" />
                      <span className="break-words">{formErrors.address}</span>
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <p className="text-sm text-muted-foreground break-words">
              <span className="text-red-500">*</span> {t('providerProfile.requiredFields')}
            </p>
            <Button
              type="submit"
              disabled={saving || uploadingImage}
              className="bg-green-600 hover:bg-green-700 text-white shadow-sm w-full sm:w-auto min-w-[140px]"
              size="lg"
            >
              {saving || uploadingImage ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent me-2 flex-shrink-0" />
                  <span className="truncate">{t('providerProfile.saving')}</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 me-2 flex-shrink-0" />
                  <span className="truncate">{t('providerProfile.saveChanges')}</span>
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Working Hours */}
        <Card className="w-full min-w-0 shadow-sm">
          <CardHeader className="pb-4 px-4 sm:px-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-50 flex-shrink-0">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base sm:text-lg truncate">{t('providerProfile.workingHours')}</CardTitle>
                <CardDescription className="text-sm mt-0.5 truncate">{t('providerProfile.setAvailability')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <WorkingHoursManager />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ProviderProfile;
