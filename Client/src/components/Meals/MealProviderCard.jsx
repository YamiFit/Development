import { FiMapPin } from "react-icons/fi";

const placeholderImage =
  "https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=800&q=60";

const MealProviderCard = ({ provider, onSelect, isOpen, statusText }) => {
  const displayName = provider.business_name || provider.provider_name || "Meal Provider";
  const imageUrl = provider.profile_image_url || placeholderImage;
  const location = provider.address || "Location not provided";

  return (
    <button
      onClick={() => (isOpen ? onSelect(provider.id) : null)}
      className={`relative text-left bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
        isOpen ? "hover:shadow-md" : "cursor-not-allowed opacity-70"
      }`}
      aria-disabled={!isOpen}
    >
      <div className="relative h-40 w-full bg-gray-100">
        <img
          src={imageUrl}
          alt={displayName}
          className={`h-40 w-full object-cover ${isOpen ? "" : "blur-sm"}`}
          onError={(e) => {
            e.currentTarget.src = placeholderImage;
          }}
        />
        {!isOpen ? (
          <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
            <span className="text-white text-sm font-semibold">Closed now</span>
          </div>
        ) : null}
      </div>
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 line-clamp-1">{displayName}</h3>
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full border ${
              isOpen
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-gray-100 text-gray-600 border-gray-200"
            }`}
          >
            {statusText || (isOpen ? "Open now" : "Closed")}
          </span>
        </div>
        <div className="flex items-start text-sm text-gray-600 gap-2">
          <FiMapPin className="mt-0.5 text-green-600" />
          <span className="line-clamp-2">{location}</span>
        </div>
      </div>
    </button>
  );
};

export default MealProviderCard;
