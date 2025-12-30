import { useState } from "react";
import Layout from "../layout/Layout";
import AssessmentDisplayEnhanced from "../AssessmentDisplayEnhanced";
import { useAuth } from "@/hooks/useAuthRedux";
import { useTranslation } from "react-i18next";
import { RefreshCw, Sparkles, Heart, ArrowRight } from "lucide-react";

export default function Home() {
  const { healthProfile, loading, refreshUserData } = useAuth();
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);

  // Check if we have AI assessment data
  const hasAIAssessment =
    healthProfile &&
    (healthProfile.general_assessment ||
      healthProfile.bmi_category ||
      healthProfile.daily_calorie_target);

  // Handle refresh button click - properly fetch fresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshUserData();
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Layout>
      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="relative mx-auto mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#3BB273]/20 border-t-[#3BB273] mx-auto"></div>
              <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[#3BB273] h-6 w-6" />
            </div>
            <p className="text-[#2D3142]/70 font-medium text-lg">{t('home.loadingDashboard')}</p>
            <p className="text-[#2D3142]/50 text-sm mt-1">{t('home.preparingData', 'Preparing your personalized data...')}</p>
          </div>
        </div>
      )}

      {/* No health profile */}
      {!loading && !healthProfile && (
        <div className="bg-gradient-to-br from-[#3BB273]/10 to-[#FF8C42]/10 border border-[#3BB273]/20 rounded-2xl p-8 shadow-lg">
          <div className="text-center max-w-md mx-auto">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-[#3BB273] to-[#3BB273]/80 rounded-2xl flex items-center justify-center shadow-lg shadow-[#3BB273]/30">
              <Heart className="text-white h-10 w-10" />
            </div>
            <h2 className="text-2xl font-bold text-[#2D3142] mb-3">
              {t('home.welcomeToYamiFit')}
            </h2>
            <p className="text-[#2D3142]/70 text-lg leading-relaxed">
              {t('home.completeHealthProfile')}
            </p>
            <button className="mt-6 px-6 py-3 bg-gradient-to-r from-[#3BB273] to-[#3BB273]/90 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#3BB273]/30 transition-all flex items-center gap-2 mx-auto">
              {t('home.getStarted', 'Get Started')}
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Health profile exists but no AI assessment yet */}
      {!loading && healthProfile && !hasAIAssessment && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-2xl p-8 shadow-lg">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-400 rounded-xl shadow-lg shadow-blue-500/30">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#2D3142] mb-1">
                  {t('home.healthProfileCreated')}
                </h3>
                <p className="text-[#2D3142]/70">
                  {t('home.aiAssessmentGenerating')}
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-5 space-y-3 shadow-sm border border-blue-50">
              <h4 className="font-bold text-[#2D3142] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                {t('home.yourBasicInfo')}
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {healthProfile.current_weight && (
                  <div className="p-3 bg-[#F4F7F5] rounded-lg">
                    <p className="text-xs text-[#2D3142]/60 uppercase tracking-wide">{t('home.weight')}</p>
                    <p className="font-bold text-[#2D3142] text-lg">
                      {healthProfile.current_weight} <span className="text-sm font-normal">{t('units.kg')}</span>
                    </p>
                  </div>
                )}
                {healthProfile.height && (
                  <div className="p-3 bg-[#F4F7F5] rounded-lg">
                    <p className="text-xs text-[#2D3142]/60 uppercase tracking-wide">{t('home.height')}</p>
                    <p className="font-bold text-[#2D3142] text-lg">
                      {healthProfile.height} <span className="text-sm font-normal">{t('units.cm')}</span>
                    </p>
                  </div>
                )}
                {healthProfile.age && (
                  <div className="p-3 bg-[#F4F7F5] rounded-lg">
                    <p className="text-xs text-[#2D3142]/60 uppercase tracking-wide">{t('home.age')}</p>
                    <p className="font-bold text-[#2D3142] text-lg">
                      {healthProfile.age} <span className="text-sm font-normal">{t('home.years')}</span>
                    </p>
                  </div>
                )}
                {healthProfile.goal && (
                  <div className="p-3 bg-[#F4F7F5] rounded-lg">
                    <p className="text-xs text-[#2D3142]/60 uppercase tracking-wide">{t('home.goal')}</p>
                    <p className="font-bold text-[#2D3142] text-sm">{healthProfile.goal}</p>
                  </div>
                )}
              </div>
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="mt-6 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-400 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? t('common.loading') : t('home.refreshToSeeAssessment')}
            </button>
          </div>
        </div>
      )}

      {/* AI Assessment Display */}
      {!loading && hasAIAssessment && (
        <AssessmentDisplayEnhanced healthProfile={healthProfile} />
      )}
    </Layout>
  );
}
