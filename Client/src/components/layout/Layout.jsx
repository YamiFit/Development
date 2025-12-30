import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { useSelector } from "react-redux";
import { useAuth } from "@/hooks/useAuthRedux";
import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import HealthProfileModal from "../HealthProfileModal";
import YamiFitChatbot from "../Chatbot/YamiFitChatbot";

export default function Layout({ children }) {
  const sidebarOpen = useSelector((state) => state.ui.sidebarOpen);
  const { user, healthProfile, loading, role, profile } = useAuth();
  const { isRTL } = useLanguage();
  const [showHealthModal, setShowHealthModal] = useState(false);

  // Check if user has PRO plan
  const isPro = profile?.plan === 'PRO';

  useEffect(() => {
    // Only show health profile modal for regular users, NOT for coaches, providers, or admins
    // Coaches have their own coach profile, providers have their own provider profile
    const isRegularUser = role === 'user';
    
    // Check if user is logged in and doesn't have a complete health profile
    // A complete health profile should have at least weight, height, and age
    const hasCompleteProfile =
      healthProfile &&
      healthProfile.current_weight &&
      healthProfile.height &&
      healthProfile.age;

    if (!loading && user && isRegularUser && !hasCompleteProfile) {
      setShowHealthModal(true);
    } else if (hasCompleteProfile || !isRegularUser) {
      // Close modal if complete health profile exists or user is not a regular user
      setShowHealthModal(false);
    }
  }, [loading, user, healthProfile, role]);

  const handleCloseModal = () => {
    setShowHealthModal(false);
  };

  // Determine margin class based on RTL and sidebar state
  const getContentMarginClass = () => {
    // On mobile, never add margin (sidebar is overlay)
    // On desktop (lg+), add margin when sidebar is open
    return isRTL ? "lg:mr-64" : "lg:ml-64";
  };

  return (
    <div className="flex min-h-screen bg-background overflow-x-hidden transition-colors" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Sidebar */}
      <Sidebar />

      {/* Content - Always full width on mobile, respects sidebar on desktop */}
      <div
        className={`flex-1 min-w-0 w-full transition-all duration-300 ${getContentMarginClass()}`}
      >
        <Navbar />
        <div className="p-3 sm:p-4 md:p-6 w-full min-w-0">{children}</div>
      </div>

      {/* Health Profile Modal - Only shows for regular users on first login if no profile exists */}
      <HealthProfileModal open={showHealthModal} onClose={handleCloseModal} />

      {/* YamiFit Chatbot - Available for PRO users only */}
      {isPro && <YamiFitChatbot />}
    </div>
  );
}
