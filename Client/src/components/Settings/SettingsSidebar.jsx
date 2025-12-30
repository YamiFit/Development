export default function SettingsSidebar({ tab, setTab }) {
  const items = [
    { id: "profile", label: "Profile" },
    { id: "security", label: "Security" },
    { id: "notifications", label: "Notifications" },
    { id: "preferences", label: "Preferences" },
  ];

  return (
    <div className="w-full lg:w-64 bg-white rounded-xl border shadow p-3 sm:p-4 h-fit">
      {/* Mobile: Horizontal scrollable tabs */}
      <div className="flex lg:hidden gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
              tab === item.id
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Desktop: Vertical sidebar */}
      <div className="hidden lg:block">
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
    </div>
  );
}
