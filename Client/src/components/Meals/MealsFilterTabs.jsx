const MealsFilterTabs = ({ value, onChange, t }) => {
  const categories = [
    { value: "all", label: t ? t("providerDetails.allMeals") : "All" },
    { value: "breakfast", label: t ? t("providerDetails.breakfast") : "Breakfast" },
    { value: "lunch", label: t ? t("providerDetails.lunch") : "Lunch" },
    { value: "dinner", label: t ? t("providerDetails.dinner") : "Dinner" },
  ];

  return (
    <div className="inline-flex items-center rounded-full bg-gray-100 p-1 gap-1">
      {categories.map((cat) => (
        <button
          key={cat.value}
          onClick={() => onChange(cat.value)}
          className={`px-4 py-2 text-sm rounded-full transition-colors border ${
            value === cat.value
              ? "bg-white text-green-700 border-green-200 shadow-sm"
              : "text-gray-700 border-transparent hover:bg-white"
          }`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
};

export default MealsFilterTabs;
