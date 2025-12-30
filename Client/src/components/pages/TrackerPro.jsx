/**
 * Tracker Page - PRO Feature
 * Lists all coaches for PRO users to select and track with
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import Layout from "../layout/Layout";
import { 
  FiUser, 
  FiStar, 
  FiClock, 
  FiCheck, 
  FiSearch,
  FiFilter,
  FiMapPin,
  FiAward,
} from "react-icons/fi";
import { selectUser, selectProfile, selectSelectedCoachId } from "@/store/selectors";
import { mergeProfile } from "@/store/slices/authSlice";
import * as coachService from "@/services/api/coach.service";
import { ROUTES } from "@/config/constants";
import { useToast } from "@/hooks/use-toast";

export default function Tracker() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const user = useSelector(selectUser);
  const profile = useSelector(selectProfile);
  const selectedCoachId = useSelector(selectSelectedCoachId);
  const { toast } = useToast();
  
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [selectingCoachId, setSelectingCoachId] = useState(null);

  // Fetch all public coaches
  useEffect(() => {
    const fetchCoaches = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { data, error: fetchError } = await coachService.getPublicCoachProfiles();
        
        if (fetchError) throw fetchError;
        
        setCoaches(data || []);
      } catch (err) {
        console.error("Error fetching coaches:", err);
        setError("Failed to load coaches. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchCoaches();
  }, []);

  // Get unique specialties for filter
  const allSpecialties = [...new Set(
    coaches.flatMap(coach => coach.specialties || [])
  )].sort();

  // Filter coaches based on search and specialty
  const filteredCoaches = coaches.filter(coach => {
    const matchesSearch = !searchQuery || 
      coach.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coach.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coach.city?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSpecialty = !selectedSpecialty ||
      coach.specialties?.includes(selectedSpecialty);
    
    return matchesSearch && matchesSpecialty;
  });

  // Handle selecting a coach using RPC with business rules
  const handleSelectCoach = async (coachId) => {
    if (!user?.id) return;
    
    setSelectingCoachId(coachId);
    
    try {
      const { data, error } = await coachService.selectCoach(coachId);
      
      if (error) {
        // Handle business rule errors
        if (error.message?.includes('5 days')) {
          toast({
            title: t("coachTracker.cooldownActive"),
            description: t("coachTracker.cooldownMessage"),
            variant: "destructive",
          });
          return;
        }
        if (error.message?.includes('capacity') || error.message?.includes('10')) {
          toast({
            title: t("coachTracker.fullCapacity"),
            description: t("coachTracker.fullCapacityMessage"),
            variant: "destructive",
          });
          return;
        }
        throw error;
      }
      
      // Check RPC response success field
      if (data && !data.success) {
        toast({
          title: t("coachTracker.selectionFailed"),
          description: data.error || t("coachTracker.couldNotSelect"),
          variant: "destructive",
        });
        return;
      }
      
      // MERGE Redux state (not replace!)
      dispatch(mergeProfile({ selected_coach_id: coachId }));
      
      toast({
        title: t("coachTracker.coachSelected"),
        description: t("coachTracker.coachSelectedMessage"),
      });
      
    } catch (err) {
      console.error("Error selecting coach:", err);
      toast({
        title: t("coachTracker.selectionFailed"),
        description: err.message || t("coachTracker.selectionFailedMessage"),
        variant: "destructive",
      });
    } finally {
      setSelectingCoachId(null);
    }
  };

  // Handle viewing coach details
  const handleViewCoach = (coachId) => {
    navigate(`${ROUTES.TRACKER_COACH}/${coachId}`);
  };

  // Find the selected coach from the list
  const selectedCoach = coaches.find(c => c.coach_id === selectedCoachId);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {t("coachTracker.title")}
          </h1>
          <p className="text-gray-600">
            {t("coachTracker.subtitle")}
          </p>
        </div>

        {/* Selected Coach Card */}
        {selectedCoach && (
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative z-10">
              <p className="text-green-100 text-sm mb-2">{t("coachTracker.yourSelectedCoach")}</p>
              
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                  {selectedCoach.profile_image_url ? (
                    <img 
                      src={selectedCoach.profile_image_url} 
                      alt={selectedCoach.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FiUser className="text-3xl text-white" />
                  )}
                </div>
                
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{selectedCoach.full_name}</h3>
                  <p className="text-green-100">
                    {selectedCoach.specialties?.slice(0, 2).join(", ") || t("coachTracker.fitnessCoach")}
                  </p>
                </div>
                
                <button
                  onClick={() => handleViewCoach(selectedCoach.coach_id)}
                  className="bg-white text-green-600 px-4 py-2 rounded-lg font-medium hover:bg-green-50 transition-colors"
                >
                  {t("coachTracker.viewDetails")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 rtl:left-auto rtl:right-4" />
            <input
              type="text"
              placeholder={t("coachTracker.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full ps-11 pe-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          
          <div className="relative">
            <FiFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 rtl:left-auto rtl:right-4" />
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="ps-11 pe-8 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white min-w-[200px]"
            >
              <option value="">{t("coachTracker.allSpecialties")}</option>
              {allSpecialties.map(specialty => (
                <option key={specialty} value={specialty}>{specialty}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              {t("common.retry")}
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredCoaches.length === 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-10 text-center">
            <FiUser className="text-5xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              {coaches.length === 0 ? t("coachTracker.noCoachesAvailable") : t("coachTracker.noCoachesFound")}
            </h3>
            <p className="text-gray-500">
              {coaches.length === 0 
                ? t("coachTracker.checkBackLater")
                : t("coachTracker.adjustCriteria")}
            </p>
          </div>
        )}

        {/* Coaches Grid */}
        {!loading && !error && filteredCoaches.length > 0 && (
          <>
            <p className="text-sm text-gray-500 mb-4">
              {t("coachTracker.showingCoaches", { showing: filteredCoaches.length, total: coaches.length })}
            </p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCoaches.map((coach) => (
                <CoachCard
                  key={coach.coach_id}
                  coach={coach}
                  isSelected={coach.coach_id === selectedCoachId}
                  isSelecting={selectingCoachId === coach.coach_id}
                  onSelect={() => handleSelectCoach(coach.coach_id)}
                  onView={() => handleViewCoach(coach.coach_id)}
                  t={t}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

/**
 * Coach Card Component
 */
function CoachCard({ coach, isSelected, isSelecting, onSelect, onView, t }) {
  return (
    <div 
      className={`bg-white border rounded-xl overflow-hidden hover:shadow-lg transition-all ${
        isSelected ? 'border-green-500 ring-2 ring-green-200' : 'border-gray-200'
      }`}
    >
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
        {coach.profile_image_url ? (
          <img 
            src={coach.profile_image_url} 
            alt={coach.full_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FiUser className="text-6xl text-gray-300" />
          </div>
        )}
        
        {isSelected && (
          <div className="absolute top-3 end-3 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
            <FiCheck /> {t("coachTracker.selected")}
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">
          {coach.full_name}
        </h3>
        
        {/* Location */}
        {(coach.city || coach.country) && (
          <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
            <FiMapPin className="text-gray-400" />
            {[coach.city, coach.country].filter(Boolean).join(", ")}
          </p>
        )}
        
        {/* Experience */}
        {coach.years_of_experience && (
          <p className="text-sm text-gray-600 flex items-center gap-1 mb-3">
            <FiAward className="text-green-500" />
            {t("coachTracker.yearsExperience", { years: coach.years_of_experience })}
          </p>
        )}
        
        {/* Specialties */}
        {coach.specialties && coach.specialties.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {coach.specialties.slice(0, 3).map((specialty, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full"
              >
                {specialty}
              </span>
            ))}
            {coach.specialties.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{coach.specialties.length - 3} {t("common.more")}
              </span>
            )}
          </div>
        )}
        
        {/* Bio excerpt */}
        {coach.bio && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-4">
            {coach.bio}
          </p>
        )}
        
        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onView}
            className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            {t("coachTracker.viewProfile")}
          </button>
          
          {!isSelected && (
            <button
              onClick={onSelect}
              disabled={isSelecting}
              className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSelecting ? t("coachTracker.selecting") : t("coachTracker.selectCoach")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
