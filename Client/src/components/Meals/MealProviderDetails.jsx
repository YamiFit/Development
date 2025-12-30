import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiArrowLeft, FiAlertTriangle, FiPhone, FiMail, FiMessageCircle } from "react-icons/fi";
import { toast } from "sonner";
import MealsFilterTabs from "./MealsFilterTabs";
import MealCard from "./MealCard";
import { getMealsByProvider } from "@/services/api/meals.service";
import { getProviderById } from "@/services/api/providers.service";
import { getAvailability, formatShiftsForDisplay, normalizeWeekly } from "@/utils/time";
import { createOrderWithItems } from "@/services/api/orders.service";
import { useAuth } from "@/hooks/useAuthRedux";

const placeholderImage =
  "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1200&q=60";

const MealProviderDetails = ({ providerId }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [category, setCategory] = useState("all");
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [deliveryType, setDeliveryType] = useState("Delivery");
  const [placing, setPlacing] = useState(false);
  const { user } = useAuth();

  const {
    data: provider,
    isLoading: providerLoading,
    isError: providerError,
    error: providerErrorObj,
  } = useQuery({
    queryKey: ["meal-provider", providerId],
    enabled: Boolean(providerId),
    queryFn: async () => {
      const result = await getProviderById(providerId);
      if (result.error) throw result.error;
      return result.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: meals,
    isLoading: mealsLoading,
    isError: mealsError,
    error: mealsErrorObj,
    refetch: refetchMeals,
  } = useQuery({
    queryKey: ["provider-meals", providerId, category],
    enabled: Boolean(providerId),
    queryFn: async () => {
      const result = await getMealsByProvider(providerId, {
        category,
        availability: "available",
      });
      if (result.error) throw result.error;
      return result.data;
    },
  });

  const displayName = useMemo(() => {
    return provider?.business_name || provider?.provider_name || "Meal Provider";
  }, [provider]);

  const headerImage = provider?.profile_image_url || placeholderImage;
  const location = provider?.address || "Location not provided";

  const availability = useMemo(() => {
    const base = getAvailability(provider?.working_hours);
    const isTemporarilyDisabled = provider?.is_temporarily_disabled === true;
    const isActive = provider?.is_active !== false;
    return {
      ...base,
      isOpen: base.isOpen && isActive && !isTemporarilyDisabled,
    };
  }, [provider]);

  const weeklyHours = useMemo(() => normalizeWeekly(provider?.working_hours), [provider]);

  const filteredMeals = useMemo(() => {
    if (!meals) return [];
    if (category === "all") return meals;
    return meals.filter((meal) => meal.category === category);
  }, [meals, category]);

  const renderHeader = () => {
    if (providerLoading) {
      return (
        <div className="animate-pulse">
          <div className="h-48 w-full rounded-2xl bg-gray-200" />
          <div className="mt-4 h-6 w-1/3 bg-gray-200 rounded" />
          <div className="mt-2 h-4 w-1/4 bg-gray-200 rounded" />
        </div>
      );
    }

    if (providerError || !provider) {
      return (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <FiAlertTriangle />
          <div>
            <p className="font-semibold">{t("providerDetails.failedToLoad")}</p>
            <p className="text-sm">{providerErrorObj?.message || t("common.tryAgain")}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="h-52 w-full bg-gray-100 relative">
          <img
            src={headerImage}
            alt={displayName}
            className="h-52 w-full object-cover"
            onError={(e) => {
              e.currentTarget.src = placeholderImage;
            }}
          />
          <span
            className={`absolute top-3 end-3 text-xs font-semibold px-3 py-1 rounded-full border ${
              availability.isOpen
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-gray-100 text-gray-600 border-gray-200"
            }`}
          >
            {availability.isOpen ? t("providerDetails.openNow") : t("providerDetails.closedNow")}
          </span>
        </div>
        <div className="p-5 space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
          <p className="text-gray-600">{location}</p>
          {!availability.todayShifts?.length ? (
            <p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 inline-block mt-2">
              {t("providerDetails.scheduleUnavailable")}
            </p>
          ) : null}
        </div>
      </div>
    );
  };

  const renderMeals = () => {
    if (mealsLoading) {
      return (
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="animate-pulse bg-white border border-gray-200 rounded-xl overflow-hidden"
            >
              <div className="h-44 bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (mealsError) {
      return (
        <div className="flex flex-col gap-3 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <p className="font-semibold">{t("providerDetails.failedToLoadMeals")}</p>
          <p className="text-sm">{mealsErrorObj?.message || t("common.tryAgain")}</p>
          <button
            onClick={() => refetchMeals()}
            className="inline-flex w-fit px-3 py-2 bg-white border border-red-200 text-red-700 rounded-md hover:bg-red-100 transition-colors"
          >
            {t("common.retry")}
          </button>
        </div>
      );
    }

    if (!filteredMeals.length) {
      return (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-600">
          <p className="font-semibold text-lg">{t("providerDetails.noMealsCategory")}</p>
          <p className="text-sm mt-1">{t("providerDetails.tryDifferentFilter")}</p>
        </div>
      );
    }

    return (
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {filteredMeals.map((meal) => (
          <MealCard
            key={meal.id}
            meal={meal}
            isProviderOpen={availability.isOpen}
            onOrder={() => handleOrderClick(meal)}
            t={t}
          />
        ))}
      </div>
    );
  };

  const handleOrderClick = (meal) => {
    if (!availability.isOpen) {
      toast.warning(t("providerDetails.restaurantClosed"));
      return;
    }
    setSelectedMeal(meal);
    setQuantity(1);
    setNotes("");
  };

  const handlePlaceOrder = async () => {
    if (!selectedMeal || !user) {
      toast.error(t("providerDetails.mustBeLoggedIn"));
      return;
    }

    if (!availability.isOpen) {
      toast.error(t("providerDetails.restaurantClosedTryLater"));
      return;
    }

    const qty = Number(quantity) || 1;
    if (qty <= 0) {
      toast.error(t("providerDetails.quantityAtLeast1"));
      return;
    }

    setPlacing(true);
    const totalPrice = selectedMeal.price ? Number(selectedMeal.price) * qty : null;

    const { error } = await createOrderWithItems({
      userId: user.id,
      providerId,
      notes,
      deliveryType,
      totalPrice,
      items: [
        {
          mealId: selectedMeal.id,
          mealName: selectedMeal.name,
          quantity: qty,
          unitPrice: selectedMeal.price ?? null,
        },
      ],
    });

    setPlacing(false);

    if (error) {
      toast.error(error.message || t("providerDetails.couldNotPlaceOrder"));
      return;
    }

    toast.success(t("providerDetails.orderPlaced"));
    setSelectedMeal(null);
    navigate("/orders");
  };

  const renderWorkingHours = () => {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">{t("providerDetails.workingHours")}</h3>
          <p className="text-sm text-gray-600">
            {t("providerDetails.today")}: {formatShiftsForDisplay(availability.todayShifts)}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
          {weeklyHours.map(({ day, shifts }) => (
            <div
              key={day}
              className="flex items-start justify-between border border-gray-100 rounded-lg px-3 py-2"
            >
              <span className="font-medium capitalize">{t(`dateTime.daysOfWeek.${day}`)}</span>
              <span className="text-gray-600 text-right">
                {shifts.length ? formatShiftsForDisplay(shifts) : t("providerDetails.closed")}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderContacts = () => {
    if (!provider) return null;
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
        <h3 className="font-semibold text-gray-900">{t("providerDetails.contact")}</h3>
        <div className="text-sm text-gray-700 space-y-2">
          {provider.phone ? (
            <div className="flex items-center gap-2">
              <FiPhone className="text-green-600" />
              <span>{provider.phone}</span>
            </div>
          ) : null}
          {provider.whatsapp ? (
            <div className="flex items-center gap-2">
              <FiMessageCircle className="text-green-600" />
              <span>{provider.whatsapp}</span>
            </div>
          ) : null}
          {provider.email ? (
            <div className="flex items-center gap-2">
              <FiMail className="text-green-600" />
              <span>{provider.email}</span>
            </div>
          ) : null}
          {provider.address ? (
            <p className="text-gray-600">{provider.address}</p>
          ) : null}
          {!provider.phone && !provider.whatsapp && !provider.email ? (
            <p className="text-gray-500">{t("providerDetails.noContactInfo")}</p>
          ) : null}
        </div>
      </div>
    );
  };

  const renderOrderModal = () => {
    if (!selectedMeal) return null;
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{t("providerDetails.order")}</p>
              <h3 className="text-lg font-semibold text-gray-900">{selectedMeal.name}</h3>
            </div>
            <button
              onClick={() => setSelectedMeal(null)}
              className="text-gray-500 hover:text-gray-700 text-sm font-semibold"
            >
              {t("common.close")}
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">{t("providerDetails.quantity")}</label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">{t("providerDetails.notesOptional")}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder={t("providerDetails.notesPlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">{t("providerDetails.deliveryType")}</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: t("providerDetails.delivery"), value: "Delivery" },
                { label: t("providerDetails.pickup"), value: "Pickup" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDeliveryType(opt.value)}
                  className={`border rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    deliveryType === opt.value
                      ? "border-green-600 bg-green-50 text-green-700"
                      : "border-gray-200 bg-white text-gray-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-700">
            <span>{t("providerDetails.total")}</span>
            <span className="font-semibold text-gray-900">
              {selectedMeal.price
                ? `$${(Number(selectedMeal.price || 0) * (Number(quantity) || 1)).toFixed(2)}`
                : "—"}
            </span>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setSelectedMeal(null)}
              className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={handlePlaceOrder}
              disabled={placing}
              className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-60"
            >
              {placing ? t("providerDetails.placing") : t("providerDetails.confirmOrder")}
            </button>
          </div>

          {!availability.isOpen ? (
            <p className="text-sm text-red-600">{t("providerDetails.closedOrderingDisabled")}</p>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <FiArrowLeft /> {t("common.back")}
        </button>
        <p className="text-sm text-gray-500">{t("providerDetails.providerMenu")}</p>
      </div>

      {renderHeader()}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between mt-2">
            <h2 className="text-xl font-semibold text-gray-900">{t("providerDetails.meals")}</h2>
            <MealsFilterTabs value={category} onChange={setCategory} t={t} />
          </div>

          {!availability.isOpen ? (
            <div className="border border-yellow-200 bg-yellow-50 text-yellow-800 rounded-lg px-4 py-3 text-sm">
              {t("providerDetails.closedBrowseMenu")}
            </div>
          ) : null}

          {renderMeals()}
        </div>

        <div className="space-y-4">
          {renderWorkingHours()}
          {renderContacts()}
        </div>
      </div>

      {renderOrderModal()}
    </div>
  );
};

export default MealProviderDetails;
