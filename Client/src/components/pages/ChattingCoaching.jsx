/**
 * Chatting Coaching Page - PRO Feature (Placeholder)
 * Replaces the old Coaching page
 * Route: /coaching
 */

import Layout from "../layout/Layout";
import { FiMessageCircle, FiUsers, FiStar, FiZap, FiUser } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectSelectedCoachId } from "@/store/selectors";
import { ROUTES } from "@/config/constants";
import { useTranslation } from "react-i18next";

export default function ChattingCoaching() {
  const selectedCoachId = useSelector(selectSelectedCoachId);
  const { t } = useTranslation();

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <FiMessageCircle className="text-4xl text-green-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-3">
            {t('coaching.chatting')}
          </h1>
          
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-4">
            <FiStar />
            <span>{t('coaching.proFeature')}</span>
          </div>
          
          <p className="text-gray-600 text-lg max-w-xl mx-auto">
            {t('coaching.connectWithCoach')}
          </p>
        </div>

        {/* Coach Status */}
        {selectedCoachId ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
              <FiUser className="text-xl text-green-600" />
            </div>
            <h3 className="font-semibold text-green-800 mb-2">{t('coaching.coachConnected')}</h3>
            <p className="text-green-700 mb-4">
              {t('coaching.chatComingSoonWithCoach')}
            </p>
            <Link
              to={`${ROUTES.TRACKER_COACH}/${selectedCoachId}`}
              className="inline-flex px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              {t('coaching.viewMyCoach')}
            </Link>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mb-4">
              <FiUsers className="text-xl text-yellow-600" />
            </div>
            <h3 className="font-semibold text-yellow-800 mb-2">{t('coaching.noCoach')}</h3>
            <p className="text-yellow-700 mb-4">
              {t('coaching.selectCoachFirst')}
            </p>
            <Link
              to={ROUTES.TRACKER}
              className="inline-flex px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors"
            >
              {t('coaching.findCoach')}
            </Link>
          </div>
        )}

        {/* Coming Soon Card */}
        <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl p-8 text-white text-center mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            <FiMessageCircle className="text-5xl mx-auto mb-4 text-green-200" />
            <h2 className="text-2xl font-bold mb-3">{t('coaching.chatComingSoon')}</h2>
            <p className="text-green-100 mb-6 max-w-md mx-auto">
              {t('coaching.chatUnderDevelopment')}
            </p>
          </div>
        </div>

        {/* Features Preview */}
        <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
          {t('coaching.coachingFeatures')}
        </h3>
        
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <FeatureCard 
            icon="🏋️"
            title={t('coaching.workoutGuidance')}
            description={t('coaching.workoutGuidanceDesc')}
          />
          <FeatureCard 
            icon="🥗"
            title={t('coaching.nutritionAdvice')}
            description={t('coaching.nutritionAdviceDesc')}
          />
          <FeatureCard 
            icon="📈"
            title={t('coaching.progressTracking')}
            description={t('coaching.progressTrackingDesc')}
          />
          <FeatureCard 
            icon="💪"
            title={t('coaching.motivationSupport')}
            description={t('coaching.motivationSupportDesc')}
          />
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            to={ROUTES.TRACKER}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900 transition-colors"
          >
            <FiUsers />
            {t('coaching.browseAllCoaches')}
          </Link>
        </div>
      </div>
    </Layout>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-start gap-4">
      <span className="text-3xl">{icon}</span>
      <div>
        <h4 className="font-semibold text-gray-800 mb-1">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
}
