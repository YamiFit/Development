export default function SettingsSidebar({ tab, setTab }) {
  const items = [
    { id: "profile", label: "Profile" },
    { id: "security", label: "Security" },
    { id: "notifications", label: "Notifications" },
    { id: "preferences", label: "Preferences" },
  ];

  return (
    <div className="w-64 bg-white rounded-xl border shadow p-4 h-fit">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => setTab(item.id)}
          className={`block w-full text-left px-4 py-3 mb-2 rounded-lg ${
            tab === item.id
              ? "bg-green-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
