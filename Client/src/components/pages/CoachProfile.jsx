/**
 * Coach Profile Page
 * Create and edit coach profile information
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Loader2, 
  Save, 
  Camera, 
  X, 
  Plus, 
  Trash2, 
  Edit, 
  MapPin,
  Calendar,
  ArrowLeft,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuthRedux';
import { useToast } from '@/hooks/use-toast';
import {
  getCoachProfile,
  upsertCoachProfile,
  uploadCoachProfileImage,
  getCoachTrainingPlaces,
  addTrainingPlace,
  updateTrainingPlace,
  deleteTrainingPlace,
  calculateProfileCompletion,
} from '@/services/api/coach.service';

// Specialty options
const SPECIALTY_OPTIONS = [
  'Weight Loss',
  'Muscle Building',
  'Strength Training',
  'Cardio & Endurance',
  'Sports Nutrition',
  'Bodybuilding',
  'CrossFit',
  'HIIT',
  'Yoga & Flexibility',
  'Rehabilitation',
  'Senior Fitness',
  'Pre/Post Natal',
  'Athletic Performance',
  'Functional Training',
  'Nutrition Planning',
];

// Language options
const LANGUAGE_OPTIONS = [
  'Arabic',
  'English',
  'French',
  'Spanish',
  'German',
  'Turkish',
  'Urdu',
  'Hindi',
];

// Country options (simplified)
const COUNTRY_OPTIONS = [
  'Jordan',
  'Saudi Arabia',
  'UAE',
  'Kuwait',
  'Qatar',
  'Bahrain',
  'Oman',
  'Egypt',
  'Lebanon',
  'Iraq',
  'Palestine',
  'Syria',
  'Morocco',
  'Tunisia',
  'Algeria',
  'United States',
  'United Kingdom',
  'Canada',
  'Germany',
  'France',
  'Other',
];

const CoachProfile = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    gender: '',
    date_of_birth: '',
    years_of_experience: '',
    bio: '',
    specialties: [],
    languages: [],
    profile_image_url: '',
    phone: '',
    email: '',
    city: '',
    country: '',
    is_public: true,
  });

  // Training places state
  const [trainingPlaces, setTrainingPlaces] = useState([]);
  const [showPlaceModal, setShowPlaceModal] = useState(false);
  const [editingPlace, setEditingPlace] = useState(null);
  const [placeFormData, setPlaceFormData] = useState({
    place_name: '',
    city: '',
    country: '',
    from_date: '',
    to_date: '',
    description: '',
  });
  const [savingPlace, setSavingPlace] = useState(false);
  const [deletingPlaceId, setDeletingPlaceId] = useState(null);

  // Image state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Error state
  const [errors, setErrors] = useState({});
  const [isNewProfile, setIsNewProfile] = useState(true);

  // Fetch coach profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;

      setLoading(true);

      try {
        const [profileResult, placesResult] = await Promise.all([
          getCoachProfile(user.id),
          getCoachTrainingPlaces(user.id),
        ]);

        if (profileResult.data) {
          setIsNewProfile(false);
          setFormData({
            full_name: profileResult.data.full_name || '',
            gender: profileResult.data.gender || '',
            date_of_birth: profileResult.data.date_of_birth || '',
            years_of_experience: profileResult.data.years_of_experience?.toString() || '',
            bio: profileResult.data.bio || '',
            specialties: profileResult.data.specialties || [],
            languages: profileResult.data.languages || [],
            profile_image_url: profileResult.data.profile_image_url || '',
            phone: profileResult.data.phone || '',
            email: profileResult.data.email || profile?.email || user?.email || '',
            city: profileResult.data.city || '',
            country: profileResult.data.country || '',
            is_public: profileResult.data.is_public ?? true,
          });
          setImagePreview(profileResult.data.profile_image_url);
        } else {
          // Pre-fill with profile data if available
          setFormData(prev => ({
            ...prev,
            full_name: profile?.full_name || '',
            email: profile?.email || user?.email || '',
            phone: profile?.phone || '',
          }));
        }

        setTrainingPlaces(placesResult.data || []);
      } catch (error) {
        console.error('Error fetching coach profile:', error);
        toast({
          title: t('common.error'),
          description: t('coachProfile.failedToLoadProfile'),
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user?.id, profile, toast]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Handle select change
  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Handle specialty toggle
  const handleSpecialtyToggle = (specialty) => {
    setFormData(prev => {
      const current = prev.specialties || [];
      if (current.includes(specialty)) {
        return { ...prev, specialties: current.filter(s => s !== specialty) };
      } else {
        return { ...prev, specialties: [...current, specialty] };
      }
    });
  };

  // Handle language toggle
  const handleLanguageToggle = (language) => {
    setFormData(prev => {
      const current = prev.languages || [];
      if (current.includes(language)) {
        return { ...prev, languages: current.filter(l => l !== language) };
      } else {
        return { ...prev, languages: [...current, language] };
      }
    });
  };

  // Handle image selection
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: t('coachProfile.invalidFileType'),
        description: t('coachProfile.uploadJpgPngWebp'),
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t('coachProfile.fileTooLarge'),
        description: t('coachProfile.imageMustBeLessThan5MB'),
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
    setImagePreview(formData.profile_image_url || null);
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = t('coachProfile.fullNameRequired');
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('coachProfile.invalidEmailFormat');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: t('coachProfile.validationError'),
        description: t('coachProfile.fixErrorsBeforeSaving'),
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      let profileImageUrl = formData.profile_image_url;

      // Upload image if new file selected
      if (imageFile) {
        setUploadingImage(true);
        const uploadResult = await uploadCoachProfileImage(user.id, imageFile);
        if (uploadResult.error) {
          throw new Error('Failed to upload image');
        }
        profileImageUrl = uploadResult.url;
        setUploadingImage(false);
      }

      // Prepare data for upsert
      const profileData = {
        full_name: formData.full_name.trim(),
        gender: formData.gender || null,
        date_of_birth: formData.date_of_birth || null,
        years_of_experience: formData.years_of_experience ? parseInt(formData.years_of_experience) : null,
        bio: formData.bio.trim() || null,
        specialties: formData.specialties.length > 0 ? formData.specialties : null,
        languages: formData.languages.length > 0 ? formData.languages : null,
        profile_image_url: profileImageUrl || null,
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        city: formData.city.trim() || null,
        country: formData.country || null,
        is_public: formData.is_public,
      };

      const result = await upsertCoachProfile(profileData);

      if (result.error) {
        throw result.error;
      }

      setIsNewProfile(false);
      setImageFile(null);
      
      toast({
        title: t('common.success'),
        description: isNewProfile ? t('coachProfile.profileCreatedSuccessfully') : t('coachProfile.profileUpdatedSuccessfully'),
      });

      // Navigate back to dashboard
      navigate('/coach/dashboard');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: t('common.error'),
        description: error.message || t('coachProfile.failedToSaveProfile'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
      setUploadingImage(false);
    }
  };

  // Training Place Modal handlers
  const openAddPlaceModal = () => {
    setEditingPlace(null);
    setPlaceFormData({
      place_name: '',
      city: '',
      country: '',
      from_date: '',
      to_date: '',
      description: '',
    });
    setShowPlaceModal(true);
  };

  const openEditPlaceModal = (place) => {
    setEditingPlace(place);
    setPlaceFormData({
      place_name: place.place_name || '',
      city: place.city || '',
      country: place.country || '',
      from_date: place.from_date || '',
      to_date: place.to_date || '',
      description: place.description || '',
    });
    setShowPlaceModal(true);
  };

  const handlePlaceFormChange = (e) => {
    const { name, value } = e.target;
    setPlaceFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSavePlace = async () => {
    if (!placeFormData.place_name.trim()) {
      toast({
        title: t('coachProfile.validationError'),
        description: t('coachProfile.placeNameRequired'),
        variant: 'destructive',
      });
      return;
    }

    setSavingPlace(true);

    try {
      const data = {
        place_name: placeFormData.place_name.trim(),
        city: placeFormData.city.trim() || null,
        country: placeFormData.country || null,
        from_date: placeFormData.from_date || null,
        to_date: placeFormData.to_date || null,
        description: placeFormData.description.trim() || null,
      };

      if (editingPlace) {
        const result = await updateTrainingPlace(editingPlace.id, data);
        if (result.error) throw result.error;
        
        setTrainingPlaces(prev => 
          prev.map(p => p.id === editingPlace.id ? result.data : p)
        );
        toast({ title: t('common.success'), description: t('coachProfile.trainingPlaceUpdated') });
      } else {
        const result = await addTrainingPlace(data);
        if (result.error) throw result.error;
        
        setTrainingPlaces(prev => [result.data, ...prev]);
        toast({ title: t('common.success'), description: t('coachProfile.trainingPlaceAdded') });
      }

      setShowPlaceModal(false);
    } catch (error) {
      console.error('Error saving training place:', error);
      toast({
        title: t('common.error'),
        description: t('coachProfile.failedToSaveTrainingPlace'),
        variant: 'destructive',
      });
    } finally {
      setSavingPlace(false);
    }
  };

  const handleDeletePlace = async (placeId) => {
    setDeletingPlaceId(placeId);

    try {
      const result = await deleteTrainingPlace(placeId);
      if (!result.success) throw new Error('Delete failed');

      setTrainingPlaces(prev => prev.filter(p => p.id !== placeId));
      toast({ title: t('coachProfile.deleted'), description: t('coachProfile.trainingPlaceRemoved') });
    } catch (error) {
      console.error('Error deleting training place:', error);
      toast({
        title: t('common.error'),
        description: t('coachProfile.failedToDeleteTrainingPlace'),
        variant: 'destructive',
      });
    } finally {
      setDeletingPlaceId(null);
    }
  };

  // Get initials for avatar
  const initials = (formData.full_name || 'C')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Profile completion
  const profileCompletion = calculateProfileCompletion(formData);

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">{t('common.loadingProfile')}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/coach/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {isNewProfile ? t('coachProfile.createCoachProfile') : t('coachProfile.editCoachProfile')}
              </h1>
              <p className="text-muted-foreground">
                {isNewProfile ? t('coachProfile.setUpYourProfile') : t('coachProfile.updateYourProfileInfo')}
              </p>
            </div>
          </div>
          <Badge variant={profileCompletion === 100 ? 'default' : 'secondary'}>
            {profileCompletion}% {t('coachProfile.complete')}
          </Badge>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Image & Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>{t('coachProfile.profilePhoto')}</CardTitle>
              <CardDescription>{t('coachProfile.uploadProfessionalPhoto')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-2 border-primary/20">
                    {imagePreview ? (
                      <AvatarImage src={imagePreview} alt="Profile" />
                    ) : null}
                    <AvatarFallback className="text-2xl font-semibold bg-primary/10 text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <label
                    htmlFor="profile-image"
                    className="absolute -bottom-1 -right-1 p-1.5 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
                  >
                    <Camera className="h-4 w-4" />
                    <input
                      id="profile-image"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleImageSelect}
                      disabled={uploadingImage}
                    />
                  </label>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{t('coachProfile.profilePhoto')}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('coachProfile.imageRequirements')}
                  </p>
                  {imageFile && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveImage}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4 me-1" />
                      {t('common.remove')}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('coachProfile.personalInformation')}</CardTitle>
              <CardDescription>{t('coachProfile.yourBasicInfo')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="full_name">{t('coachProfile.fullName')} *</Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder={t('coachProfile.enterFullName')}
                    className={errors.full_name ? 'border-destructive' : ''}
                  />
                  {errors.full_name && (
                    <p className="text-xs text-destructive">{errors.full_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">{t('coachProfile.gender')}</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => handleSelectChange('gender', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('coachProfile.selectGender')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">{t('coachProfile.male')}</SelectItem>
                      <SelectItem value="female">{t('coachProfile.female')}</SelectItem>
                      <SelectItem value="other">{t('coachProfile.other')}</SelectItem>
                      <SelectItem value="prefer_not_to_say">{t('coachProfile.preferNotToSay')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">{t('coachProfile.dateOfBirth')}</Label>
                  <Input
                    id="date_of_birth"
                    name="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="years_of_experience">{t('coachProfile.yearsOfExperience')}</Label>
                  <Input
                    id="years_of_experience"
                    name="years_of_experience"
                    type="number"
                    min="0"
                    max="50"
                    value={formData.years_of_experience}
                    onChange={handleChange}
                    placeholder={t('coachProfile.yearsPlaceholder')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">{t('coachProfile.bio')}</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder={t('coachProfile.bioPlaceholder')}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('coachProfile.contactInformation')}</CardTitle>
              <CardDescription>{t('coachProfile.howClientsReachYou')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('coachProfile.email')}</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={t('coachProfile.emailPlaceholder')}
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t('coachProfile.phone')}</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder={t('coachProfile.phonePlaceholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">{t('coachProfile.city')}</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder={t('coachProfile.cityPlaceholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">{t('coachProfile.country')}</Label>
                  <Select
                    value={formData.country}
                    onValueChange={(value) => handleSelectChange('country', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('coachProfile.selectCountry')} />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRY_OPTIONS.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Specialties */}
          <Card>
            <CardHeader>
              <CardTitle>{t('coachProfile.specialties')}</CardTitle>
              <CardDescription>{t('coachProfile.selectExpertise')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {SPECIALTY_OPTIONS.map((specialty) => (
                  <Badge
                    key={specialty}
                    variant={formData.specialties.includes(specialty) ? 'default' : 'outline'}
                    className="cursor-pointer transition-colors"
                    onClick={() => handleSpecialtyToggle(specialty)}
                  >
                    {formData.specialties.includes(specialty) && (
                      <CheckCircle className="h-3 w-3 me-1" />
                    )}
                    {specialty}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Languages */}
          <Card>
            <CardHeader>
              <CardTitle>{t('coachProfile.languages')}</CardTitle>
              <CardDescription>{t('coachProfile.languagesYouSpeak')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {LANGUAGE_OPTIONS.map((language) => (
                  <Badge
                    key={language}
                    variant={formData.languages.includes(language) ? 'default' : 'outline'}
                    className="cursor-pointer transition-colors"
                    onClick={() => handleLanguageToggle(language)}
                  >
                    {formData.languages.includes(language) && (
                      <CheckCircle className="h-3 w-3 me-1" />
                    )}
                    {language}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Training Places */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t('coachProfile.trainingPlaces')}</CardTitle>
                <CardDescription>{t('coachProfile.gymsAndClinics')}</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={openAddPlaceModal}>
                <Plus className="h-4 w-4 me-1" />
                {t('coachProfile.addPlace')}
              </Button>
            </CardHeader>
            <CardContent>
              {trainingPlaces.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-lg">
                  <MapPin className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground text-sm">{t('coachProfile.noTrainingPlaces')}</p>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={openAddPlaceModal}
                    className="mt-2"
                  >
                    {t('coachProfile.addFirstPlace')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {trainingPlaces.map((place) => (
                    <div
                      key={place.id}
                      className="flex items-start justify-between p-4 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{place.place_name}</p>
                        {(place.city || place.country) && (
                          <p className="text-sm text-muted-foreground">
                            <MapPin className="inline h-3 w-3 me-1" />
                            {[place.city, place.country].filter(Boolean).join(', ')}
                          </p>
                        )}
                        {(place.from_date || place.to_date) && (
                          <p className="text-sm text-muted-foreground">
                            <Calendar className="inline h-3 w-3 me-1" />
                            {place.from_date || t('coachProfile.notAvailable')} — {place.to_date || t('coachProfile.present')}
                          </p>
                        )}
                        {place.description && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {place.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditPlaceModal(place)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeletePlace(place.id)}
                          disabled={deletingPlaceId === place.id}
                        >
                          {deletingPlaceId === place.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Visibility Settings */}
          <Card>
            <CardHeader>
              <CardTitle>{t('coachProfile.profileVisibility')}</CardTitle>
              <CardDescription>{t('coachProfile.controlWhoCanSee')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('coachProfile.publicProfile')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('coachProfile.allowUsersToFind')}
                  </p>
                </div>
                <Switch
                  checked={formData.is_public}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_public: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/coach/dashboard')}
              disabled={saving}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={saving || uploadingImage}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 me-2 animate-spin" />
                  {t('common.saving')}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 me-2" />
                  {isNewProfile ? t('coachProfile.createProfile') : t('coachProfile.saveChanges')}
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Training Place Modal */}
        <Dialog open={showPlaceModal} onOpenChange={setShowPlaceModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingPlace ? t('coachProfile.editTrainingPlace') : t('coachProfile.addTrainingPlace')}
              </DialogTitle>
              <DialogDescription>
                {t('coachProfile.addGymOrAcademy')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="place_name">{t('coachProfile.placeName')} *</Label>
                <Input
                  id="place_name"
                  name="place_name"
                  value={placeFormData.place_name}
                  onChange={handlePlaceFormChange}
                  placeholder={t('coachProfile.placeNamePlaceholder')}
                />
              </div>
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="place_city">{t('coachProfile.city')}</Label>
                  <Input
                    id="place_city"
                    name="city"
                    value={placeFormData.city}
                    onChange={handlePlaceFormChange}
                    placeholder={t('coachProfile.cityPlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="place_country">{t('coachProfile.country')}</Label>
                  <Select
                    value={placeFormData.country}
                    onValueChange={(value) => setPlaceFormData(prev => ({ ...prev, country: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('common.select')} />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRY_OPTIONS.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="from_date">{t('coachProfile.fromDate')}</Label>
                  <Input
                    id="from_date"
                    name="from_date"
                    type="date"
                    value={placeFormData.from_date}
                    onChange={handlePlaceFormChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="to_date">{t('coachProfile.toDate')}</Label>
                  <Input
                    id="to_date"
                    name="to_date"
                    type="date"
                    value={placeFormData.to_date}
                    onChange={handlePlaceFormChange}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="place_description">{t('coachProfile.description')}</Label>
                <Textarea
                  id="place_description"
                  name="description"
                  value={placeFormData.description}
                  onChange={handlePlaceFormChange}
                  placeholder={t('coachProfile.descriptionPlaceholder')}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPlaceModal(false)}
                disabled={savingPlace}
              >
                {t('common.cancel')}
              </Button>
              <Button onClick={handleSavePlace} disabled={savingPlace}>
                {savingPlace ? (
                  <>
                    <Loader2 className="h-4 w-4 me-2 animate-spin" />
                    {t('common.saving')}
                  </>
                ) : editingPlace ? (
                  t('common.update')
                ) : (
                  t('common.add')
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default CoachProfile;
