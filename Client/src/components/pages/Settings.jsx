import { useState } from "react";
import Layout from "../layout/Layout";

import SettingsSidebar from "../Settings/SettingsSidebar";
import ProfileTab from "../Settings/ProfileTab";
import SecurityTab from "../Settings/SecurityTab";
import NotificationsTab from "../Settings/NotificationsTab";
import PreferencesTab from "../Settings/PreferencesTab";

export default function Settings() {
  const [tab, setTab] = useState("profile");

  const renderContent = () => {
    switch (tab) {
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
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Settings</h1>

      <div className="flex gap-6">
        <SettingsSidebar tab={tab} setTab={setTab} />
        <div className="flex-1">{renderContent()}</div>
      </div>
    </Layout>
  );
}
