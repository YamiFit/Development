/**
 * Coach Details Page - PRO Feature
 * Shows detailed information about a specific coach
 * Route: /tracker/coach/:coachId
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import Layout from "../layout/Layout";
import { 
  FiArrowLeft,
  FiUser, 
  FiMail, 
  FiPhone,
  FiMapPin,
  FiAward,
  FiCalendar,
  FiGlobe,
  FiCheck,
  FiActivity,
  FiBriefcase,
  FiAlertCircle,
} from "react-icons/fi";
import { selectUser, selectSelectedCoachId } from "@/store/selectors";
import { mergeProfile } from "@/store/slices/authSlice";
import * as coachService from "@/services/api/coach.service";
import { ROUTES } from "@/config/constants";
import { useToast } from "@/hooks/use-toast";

export default function CoachDetails() {
  const { coachId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const user = useSelector(selectUser);
  const selectedCoachId = useSelector(selectSelectedCoachId);
  const { toast } = useToast();
  
  const [coach, setCoach] = useState(null);
  const [trainingPlaces, setTrainingPlaces] = useState([]);
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selecting, setSelecting] = useState(false);

  const isSelected = currentAssignment?.coach_id === coach?.coach_id;

  // Fetch coach details and training places
  useEffect(() => {
    const fetchCoachDetails = async () => {
      if (!coachId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch coach profile, training places, and current assignment in parallel
        const [coachResult, placesResult, assignmentResult] = await Promise.all([
          coachService.getCoachProfile(coachId),
          coachService.getCoachTrainingPlaces(coachId),
          coachService.getCurrentAssignment().catch(() => ({ data: null })),
        ]);
        
        if (coachResult.error) throw coachResult.error;
        if (!coachResult.data) throw new Error("Coach not found");
        
        setCoach(coachResult.data);
        setTrainingPlaces(placesResult.data || []);
        setCurrentAssignment(assignmentResult.data);
        
      } catch (err) {
        console.error("Error fetching coach details:", err);
        setError(err.message || "Failed to load coach details.");
      } finally {
        setLoading(false);
      }
    };

    fetchCoachDetails();
  }, [coachId]);

  // Handle selecting this coach using new assignment system with business rules
  const handleSelectCoach = async () => {
    if (!user?.id || !coach?.coach_id) return;
    
    setSelecting(true);
    
    try {
      const { data, error } = await coachService.selectCoach(coach.coach_id);
      
      if (error) {
        // Handle specific business rule errors
        if (error.message?.includes('5 days')) {
          toast({
            title: t("coachDetails.cooldownActive"),
            description: t("coachDetails.cooldownMessage"),
            variant: "destructive",
          });
          return;
        }
        if (error.message?.includes('capacity') || error.message?.includes('10')) {
          toast({
            title: t("coachDetails.fullCapacity"),
            description: t("coachDetails.fullCapacityMessage"),
            variant: "destructive",
          });
          return;
        }
        throw error;
      }
      
      // Check RPC response
      if (data && !data.success) {
        toast({
          title: t("coachDetails.selectionFailed"),
          description: data.error || t("coachDetails.selectionFailedMessage"),
          variant: "destructive",
        });
        return;
      }
      
      // Update local state - get the assignment from the response
      if (data?.assignment_id) {
        setCurrentAssignment({ 
          id: data.assignment_id, 
          coach_id: coach.coach_id,
          status: 'ACTIVE'
        });
      }
      
      // MERGE Redux state (not replace!) with new coach selection
      dispatch(mergeProfile({ selected_coach_id: coach.coach_id }));
      
      toast({
        title: t("coachDetails.coachSelected"),
        description: t("coachDetails.coachSelectedMessage", { name: coach.full_name || t("coachDetails.yourCoach") }),
      });
      
    } catch (err) {
      console.error("Error selecting coach:", err);
      toast({
        title: t("coachDetails.selectionFailed"),
        description: err.message || t("coachDetails.selectionFailedRetry"),
        variant: "destructive",
      });
    } finally {
      setSelecting(false);
    }
  };

  // Handle ending assignment with current coach
  const handleEndAssignment = async () => {
    if (!currentAssignment?.id) return;
    
    const confirmed = window.confirm(
      t("coachDetails.endAssignmentConfirm")
    );
    
    if (!confirmed) return;
    
    setSelecting(true);
    
    try {
      const { error } = await coachService.endAssignment(currentAssignment.id);
      
      if (error) throw error;
      
      setCurrentAssignment(null);
      
      // MERGE Redux state (not replace!)
      dispatch(mergeProfile({ selected_coach_id: null }));
      
      toast({
        title: t("coachDetails.assignmentEnded"),
        description: t("coachDetails.assignmentEndedMessage"),
      });
      
    } catch (err) {
      console.error("Error ending assignment:", err);
      toast({
        title: t("common.error"),
        description: err.message || t("coachDetails.endAssignmentFailed"),
        variant: "destructive",
      });
    } finally {
      setSelecting(false);
    }
  };

  const handleGoBack = () => {
    navigate(ROUTES.TRACKER);
  };

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const coachAge = coach?.date_of_birth 
    ? calculateAge(coach.date_of_birth) 
    : coach?.age;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={handleGoBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
        >
          <FiArrowLeft />
          <span>{t("coachDetails.backToCoaches")}</span>
        </button>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={handleGoBack}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              {t("coachDetails.goBack")}
            </button>
          </div>
        )}

        {/* Coach Details */}
        {!loading && !error && coach && (
          <>
            {/* Hero Section */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
              <div className="h-48 bg-gradient-to-br from-green-400 to-green-600 relative">
                {/* Profile Image */}
                <div className="absolute -bottom-16 start-8">
                  <div className="w-32 h-32 rounded-xl bg-white border-4 border-white shadow-lg overflow-hidden">
                    {coach.profile_image_url ? (
                      <img 
                        src={coach.profile_image_url} 
                        alt={coach.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <FiUser className="text-4xl text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected Badge */}
                {isSelected && (
                  <div className="absolute top-4 end-4 bg-white text-green-600 px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-md">
                    <FiCheck /> {t("coachDetails.yourCoach")}
                  </div>
                )}
              </div>

              <div className="pt-20 pb-6 px-8">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                      {coach.full_name}
                    </h1>
                    
                    {(coach.city || coach.country) && (
                      <p className="text-gray-500 flex items-center gap-1 mt-1">
                        <FiMapPin className="text-sm" />
                        {[coach.city, coach.country].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    {isSelected ? (
                      <button
                        onClick={handleEndAssignment}
                        disabled={selecting}
                        className="px-6 py-2.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium disabled:opacity-50"
                      >
                        {selecting ? "..." : t("coachDetails.endAssignment")}
                      </button>
                    ) : currentAssignment ? (
                      <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-lg">
                        <FiAlertCircle />
                        <span className="text-sm">{t("coachDetails.alreadyHaveCoach")}</span>
                      </div>
                    ) : (
                      <button
                        onClick={handleSelectCoach}
                        disabled={selecting}
                        className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                      >
                        {selecting ? t("coachDetails.selecting") : t("coachDetails.selectAsMyCoach")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              {/* Quick Stats */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FiAward className="text-green-500" />
                  {t("coachDetails.quickInfo")}
                </h3>
                
                <div className="space-y-3">
                  {coach.years_of_experience && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t("coachDetails.experience")}</span>
                      <span className="font-medium">{t("coachDetails.yearsCount", { years: coach.years_of_experience })}</span>
                    </div>
                  )}
                  
                  {coachAge && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t("coachDetails.age")}</span>
                      <span className="font-medium">{t("coachDetails.yearsCount", { years: coachAge })}</span>
                    </div>
                  )}
                  
                  {coach.gender && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t("coachDetails.gender")}</span>
                      <span className="font-medium capitalize">{coach.gender}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FiMail className="text-green-500" />
                  {t("coachDetails.contact")}
                </h3>
                
                <div className="space-y-3">
                  {coach.email && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <FiMail className="text-gray-400" />
                      <span className="text-sm truncate">{coach.email}</span>
                    </div>
                  )}
                  
                  {coach.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <FiPhone className="text-gray-400" />
                      <span className="text-sm">{coach.phone}</span>
                    </div>
                  )}
                  
                  {!coach.email && !coach.phone && (
                    <p className="text-sm text-gray-400">{t("coachDetails.contactNotAvailable")}</p>
                  )}
                </div>
              </div>

              {/* Languages */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FiGlobe className="text-green-500" />
                  {t("coachDetails.languages")}
                </h3>
                
                {coach.languages && coach.languages.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {coach.languages.map((lang, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">{t("coachDetails.notSpecified")}</p>
                )}
              </div>
            </div>

            {/* Specialties */}
            {coach.specialties && coach.specialties.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FiAward className="text-green-500" />
                  {t("coachDetails.specialties")}
                </h3>
                
                <div className="flex flex-wrap gap-2">
                  {coach.specialties.map((specialty, index) => (
                    <span 
                      key={index}
                      className="px-4 py-2 bg-green-50 text-green-700 rounded-lg font-medium"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Bio */}
            {coach.bio && (
              <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FiUser className="text-green-500" />
                  {t("coachDetails.about")}
                </h3>
                
                <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
                  {coach.bio}
                </p>
              </div>
            )}

            {/* Training Places */}
            {trainingPlaces.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FiBriefcase className="text-green-500" />
                  {t("coachDetails.trainingExperience")}
                </h3>
                
                <div className="space-y-4">
                  {trainingPlaces.map((place) => (
                    <div 
                      key={place.id}
                      className="border-s-4 border-green-500 ps-4 py-2"
                    >
                      <h4 className="font-medium text-gray-800">{place.place_name}</h4>
                      
                      {(place.city || place.country) && (
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <FiMapPin className="text-xs" />
                          {[place.city, place.country].filter(Boolean).join(", ")}
                        </p>
                      )}
                      
                      {(place.from_date || place.to_date) && (
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <FiCalendar className="text-xs" />
                          {place.from_date ? new Date(place.from_date).toLocaleDateString() : "?"} 
                          {" — "}
                          {place.to_date ? new Date(place.to_date).toLocaleDateString() : t("coachDetails.present")}
                        </p>
                      )}
                      
                      {place.description && (
                        <p className="text-sm text-gray-600 mt-2">{place.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Health Tracking Summary (Placeholder) */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6 mb-6">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FiActivity className="text-green-500" />
                {t("coachDetails.healthTrackingSummary")}
              </h3>
              
              <div className="bg-white rounded-lg p-8 text-center border border-gray-200">
                <FiActivity className="text-5xl text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-700 mb-2">
                  {t("common.comingSoon")}
                </h4>
                <p className="text-gray-500 max-w-md mx-auto">
                  {t("coachDetails.trackMetrics", { name: coach.full_name })}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
