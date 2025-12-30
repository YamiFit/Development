import { useState } from "react";
import Layout from "../layout/Layout";
import { 
  User, Shield, Bell, Sliders, 
  ChevronRight, Sparkles 
} from "lucide-react";

import ProfileTab from "../Settings/ProfileTab";
import SecurityTab from "../Settings/SecurityTab";
import NotificationsTab from "../Settings/NotificationsTab";
import PreferencesTab from "../Settings/PreferencesTab";
import { useTranslation } from "react-i18next";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const { t } = useTranslation();

  const tabs = [
    {
      id: "profile",
      label: t('settings.profile'),
      icon: User,
      description: t('settings.profileDesc'),
      color: "emerald",
      gradient: "from-emerald-500 to-teal-500"
    },
    {
      id: "security",
      label: t('settings.security'),
      icon: Shield,
      description: t('settings.securityDesc'),
      color: "blue",
      gradient: "from-blue-500 to-indigo-500"
    },
    {
      id: "notifications",
      label: t('settings.notifications'),
      icon: Bell,
      description: t('settings.notificationsDesc'),
      color: "purple",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      id: "preferences",
      label: t('settings.preferences'),
      icon: Sliders,
      description: t('settings.preferencesDesc'),
      color: "orange",
      gradient: "from-orange-500 to-red-500"
    }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return <ProfileTab />;
      case "security":
        return <SecurityTab />;
      case "notifications":
        return <NotificationsTab />;
      case "preferences":
        return <PreferencesTab />;
      default:
        return <ProfileTab />;
    }
  };

  return (
    <Layout>
      {/* Premium Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl shadow-lg shadow-emerald-500/30">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('settings.title')}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{t('settings.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Premium Navigation Sidebar */}
        <aside className="lg:w-72 space-y-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  w-full group relative overflow-hidden rounded-2xl p-4 text-left
                  transition-all duration-300 ease-out
                  ${isActive 
                    ? 'bg-white shadow-lg shadow-gray-200/50 scale-[1.02]' 
                    : 'bg-white/50 hover:bg-white hover:shadow-md'
                  }
                `}
              >
                {/* Gradient Accent Bar */}
                <div 
                  className={`
                    absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${tab.gradient}
                    transition-all duration-300
                    ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}
                  `}
                />
                
                {/* Content */}
                <div className="flex items-center gap-4">
                  {/* Icon Container */}
                  <div 
                    className={`
                      relative p-3 rounded-xl transition-all duration-300
                      ${isActive 
                        ? `bg-gradient-to-br ${tab.gradient} shadow-lg shadow-${tab.color}-500/30` 
                        : `bg-gray-100 group-hover:bg-gradient-to-br group-hover:${tab.gradient}`
                      }
                    `}
                  >
                    <Icon 
                      className={`
                        w-5 h-5 transition-colors duration-300
                        ${isActive ? 'text-white' : 'text-gray-600 group-hover:text-white'}
                      `} 
                    />
                  </div>
                  
                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <h3 className={`
                      font-semibold transition-colors duration-300
                      ${isActive ? 'text-gray-900' : 'text-gray-700 group-hover:text-gray-900'}
                    `}>
                      {tab.label}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {tab.description}
                    </p>
                  </div>
                  
                  {/* Arrow */}
                  <ChevronRight 
                    className={`
                      w-5 h-5 transition-all duration-300
                      ${isActive 
                        ? 'text-gray-900 translate-x-0 opacity-100' 
                        : 'text-gray-400 -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'
                      }
                    `}
                  />
                </div>

                {/* Hover Glow Effect */}
                {!isActive && (
                  <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none" 
                    style={{ backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }}
                  />
                )}
              </button>
            );
          })}

          {/* Premium Badge */}
          <div className="mt-6 p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200/50">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-amber-900 text-sm">{t('settings.premiumFeatures')}</h4>
                <p className="text-xs text-amber-700 mt-1">{t('settings.upgradeToUnlock')}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Content Area with Premium Animation */}
        <main className="flex-1 min-w-0">
          <div 
            key={activeTab}
            className="animate-fadeIn"
          >
            {renderContent()}
          </div>
        </main>
      </div>
    </Layout>
  );
}
