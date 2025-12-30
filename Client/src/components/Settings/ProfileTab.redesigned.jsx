import { useState, useEffect } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, User, Mail, Phone, Calendar, 
  MapPin, Edit2, Check, X, Camera, 
  Activity, Target, Trophy, Zap
} from 'lucide-react';

export default function ProfileTab() {
  const { profile, updateProfile, loading, authLoading } = useSettings();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    gender: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        gender: profile.gender || '',
      });
    }
  }, [profile]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const newErrors = {};
    if (!formData.full_name || formData.full_name.trim().length < 2) {
      newErrors.full_name = 'Name must be at least 2 characters';
    }

    if (formData.phone && !/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const { data, error } = await updateProfile(formData);

    if (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
    } else {
      if (data) {
        setFormData({
          full_name: data.full_name || '',
          phone: data.phone || '',
          gender: data.gender || '',
        });
      }
      setIsEditing(false);
      toast({
        title: 'Success',
        description: 'Profile updated successfully!',
      });
    }
  };

  if (authLoading) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-lg border flex items-center justify-center min-h-[500px]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const stats = [
    { label: 'Streak Days', value: '12', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Goals Hit', value: '24', icon: Target, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Achievements', value: '8', icon: Trophy, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Premium Profile Card */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-8 shadow-2xl shadow-emerald-500/30 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full translate-y-48 -translate-x-48" />
        </div>

        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Avatar Section */}
          <div className="relative group">
            <div className="w-28 h-28 rounded-3xl bg-white/20 backdrop-blur-sm border-4 border-white/30 flex items-center justify-center shadow-xl">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full rounded-2xl object-cover" />
              ) : (
                <User className="w-12 h-12 text-white" />
              )}
            </div>
            <button className="absolute bottom-0 right-0 p-2.5 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110">
              <Camera className="w-4 h-4 text-emerald-600" />
            </button>
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  {profile?.full_name || 'Your Name'}
                </h2>
                <p className="text-emerald-50 flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4" />
                  {user?.email}
                </p>
              </div>
              <div className="flex gap-2">
                {!isEditing && (
                  <Button
                    onClick={() => setIsEditing(true)}
                    size="sm"
                    className="bg-white/20 backdrop-blur-sm hover:bg-white/30 border border-white/30 text-white shadow-lg"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mt-8 relative">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center hover:bg-white/20 transition-all duration-300">
                <div className={`inline-flex p-2 rounded-xl ${stat.bg} mb-2`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-emerald-50 mt-1">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Form or Display Info */}
      {isEditing ? (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-lg border space-y-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Edit Personal Information</h3>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => setIsEditing(false)}
                variant="outline"
                size="sm"
                className="rounded-xl"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                size="sm"
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl shadow-lg shadow-emerald-500/30"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600" />
                Full Name
              </Label>
              <Input
                value={formData.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                placeholder="Enter your full name"
                className="h-12 rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
              />
              {errors.full_name && (
                <p className="text-sm text-red-500">{errors.full_name}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-600" />
                Phone Number
              </Label>
              <Input
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="h-12 rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone}</p>
              )}
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Gender</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => handleChange('gender', value)}
              >
                <SelectTrigger className="h-12 rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-500">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </form>
      ) : (
        <div className="bg-white rounded-2xl p-8 shadow-lg border">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Personal Information</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <User className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Full Name</p>
                <p className="font-semibold text-gray-900">{profile?.full_name || 'Not set'}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Phone className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Phone Number</p>
                <p className="font-semibold text-gray-900">{profile?.phone || 'Not set'}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Activity className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Gender</p>
                <p className="font-semibold text-gray-900 capitalize">{profile?.gender || 'Not set'}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="p-3 bg-amber-100 rounded-xl">
                <Mail className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Email Address</p>
                <p className="font-semibold text-gray-900">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
