import { FiTag } from "react-icons/fi";

const placeholderImage =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=60";

const formatPrice = (price) => {
  if (price === null || price === undefined) return "—";
  const numeric = Number(price);
  if (Number.isNaN(numeric)) return price;
  return `$${numeric.toFixed(2)}`;
};

const capitalize = (value) => value?.charAt(0)?.toUpperCase() + value?.slice(1) || "";

const MealCard = ({ meal, isProviderOpen = false, onOrder, t }) => {
  const imageUrl = meal.image_url || placeholderImage;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="h-44 w-full bg-gray-100">
        <img
          src={imageUrl}
          alt={meal.name}
          className="h-44 w-full object-cover"
          onError={(e) => {
            e.currentTarget.src = placeholderImage;
          }}
        />
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
              {meal.name}
            </h3>
            <p className="text-sm text-gray-500 line-clamp-2">
              {meal.description || (t ? t("providerDetails.noDescription") : "No description provided.")}
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-100 rounded-full px-2 py-1">
            <FiTag /> {capitalize(meal.category)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{formatPrice(meal.price)}</span>
            {meal.calories ? <span>{meal.calories} {t ? t("units.kcal") : "kcal"}</span> : null}
          </div>
          {meal.protein || meal.carbs || meal.fats ? (
            <div className="flex items-center gap-3 text-xs text-gray-600">
              {meal.protein ? <span>{t ? t("providerDetails.protein") : "Protein"} {meal.protein}g</span> : null}
              {meal.carbs ? <span>{t ? t("providerDetails.carbs") : "Carbs"} {meal.carbs}g</span> : null}
              {meal.fats ? <span>{t ? t("providerDetails.fats") : "Fats"} {meal.fats}g</span> : null}
            </div>
          ) : null}
        </div>

        <button
          onClick={isProviderOpen ? onOrder : undefined}
          disabled={!isProviderOpen}
          className="w-full mt-2 bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isProviderOpen ? (t ? t("providerDetails.order") : "Order") : (t ? t("providerDetails.closed") : "Closed")}
        </button>
      </div>
    </div>
  );
};

export default MealCard;
