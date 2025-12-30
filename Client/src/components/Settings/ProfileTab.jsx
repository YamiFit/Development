import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/hooks/useSettings";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Edit2,
  Check,
  X,
  Camera,
  Activity,
  Target,
  Trophy,
  Zap,
} from "lucide-react";

export default function ProfileTab() {
  const { t } = useTranslation();
  const { profile, updateProfile, loading, authLoading } = useSettings();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    gender: "",
  });

  const [errors, setErrors] = useState({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Load profile data when available
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        gender: profile.gender || "",
      });
      setIsInitialized(true);
    }
  }, [profile]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Basic validation
    const newErrors = {};
    if (!formData.full_name || formData.full_name.trim().length < 2) {
      newErrors.full_name = t("settingsProfile.nameMinLength");
    }

    if (
      formData.phone &&
      !/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(
        formData.phone
      )
    ) {
      newErrors.phone = t("settingsProfile.invalidPhone");
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Update profile
    const { data, error } = await updateProfile(formData);

    if (error) {
      toast({
        title: t("common.error"),
        description: error.message || t("settingsProfile.updateFailed"),
        variant: "destructive",
      });
    } else {
      // Update local form data with returned data
      if (data) {
        setFormData({
          full_name: data.full_name || "",
          phone: data.phone || "",
          gender: data.gender || "",
        });
      }

      toast({
        title: t("common.success"),
        description: t("settingsProfile.updateSuccess"),
      });
    }
  };

  // Show loading only if auth is still loading AND profile hasn't been initialized yet
  if (authLoading && !isInitialized) {
    return (
      <div className="bg-white rounded-xl p-6 shadow border flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If not loading but no profile, show error
  if (!profile && !isInitialized) {
    return (
      <div className="bg-white rounded-xl p-6 shadow border flex items-center justify-center min-h-[400px]">
        <p className="text-red-500">
          {t("settingsProfile.loadFailed")}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 shadow border">
      <h2 className="text-lg sm:text-xl font-semibold mb-4">
        {t("settingsProfile.title")}
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="full_name">{t("settingsProfile.fullName")}</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => handleChange("full_name", e.target.value)}
              placeholder={t("settingsProfile.enterFullName")}
              className={errors.full_name ? "border-red-500" : ""}
            />
            {errors.full_name && (
              <p className="text-sm text-red-500">{errors.full_name}</p>
            )}
          </div>

          {/* Email (Read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email">{t("settingsProfile.email")}</Label>
            <Input
              id="email"
              value={profile.email}
              disabled
              className="bg-gray-50 cursor-not-allowed"
              title={t("settingsProfile.emailManagedByAuth")}
            />
            <p className="text-xs text-gray-500">{t("settingsProfile.emailCannotBeChanged")}</p>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">{t("settingsProfile.phone")}</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder={t("settingsProfile.phonePlaceholder")}
              className={errors.phone ? "border-red-500" : ""}
            />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone}</p>
            )}
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <Label htmlFor="gender">{t("settingsProfile.gender")}</Label>
            <Select
              value={formData.gender}
              onValueChange={(value) => handleChange("gender", value)}
            >
              <SelectTrigger id="gender">
                <SelectValue placeholder={t("settingsProfile.selectGender")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">{t("settingsProfile.male")}</SelectItem>
                <SelectItem value="female">{t("settingsProfile.female")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-4 sm:mt-6">
          <Button
            type="submit"
            disabled={loading}
            className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                {t("settingsProfile.saving")}
              </>
            ) : (
              t("settingsProfile.saveChanges")
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
