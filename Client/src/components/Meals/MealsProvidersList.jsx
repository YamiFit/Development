import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FiSearch, FiRefreshCw } from "react-icons/fi";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import MealProviderCard from "./MealProviderCard";
import { getActiveProviders } from "@/services/api/providers.service";
import { getAvailability } from "@/utils/time";

const skeletonItems = Array.from({ length: 6 }, (_, i) => i);

const MealsProvidersList = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("az");

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["meal-providers"],
    queryFn: async () => {
      const result = await getActiveProviders();
      if (result.error) throw result.error;
      return result.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const filteredProviders = useMemo(() => {
    const providers = (data || []).map((p) => {
      const availability = getAvailability(p.working_hours);
      const isTemporarilyDisabled = p.is_temporarily_disabled === true;
      const isActive = p.is_active !== false;
      const isOpen = availability.isOpen && isActive && !isTemporarilyDisabled;
      return {
        ...p,
        isOpen,
        statusText: isTemporarilyDisabled
          ? t('provider.unavailable')
          : isActive
          ? availability.isOpen
            ? t('provider.openNow')
            : t('provider.closedNow')
          : t('provider.inactive'),
      };
    });

    const trimmedSearch = search.trim().toLowerCase();

    const searched = trimmedSearch
      ? providers.filter((p) =>
          (p.business_name || p.provider_name || "")
            .toLowerCase()
            .includes(trimmedSearch)
        )
      : providers;

    const sorted = [...searched].sort((a, b) => {
      const nameA = (a.business_name || a.provider_name || "").toLowerCase();
      const nameB = (b.business_name || b.provider_name || "").toLowerCase();

      // open first
      if (a.isOpen && !b.isOpen) return -1;
      if (!a.isOpen && b.isOpen) return 1;

      if (sort === "az") return nameA.localeCompare(nameB);
      if (sort === "za") return nameB.localeCompare(nameA);
      return 0;
    });

    return sorted;
  }, [data, search, sort, t]);

  const handleSelect = (provider) => {
    if (!provider.isOpen) {
      toast.warning(provider.statusText || t('provider.closedMessage'));
      return;
    }
    navigate(`/meals/providers/${provider.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-green-700 font-semibold">
            {t('meals.title')}
          </p>
          <h1 className="text-3xl font-bold text-gray-900">{t('provider.mealProviders')}</h1>
          <p className="text-gray-600 text-sm mt-1">
            {t('provider.browseDescription')}
          </p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <FiSearch className="absolute left-3 top-3 text-gray-400 rtl:left-auto rtl:right-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('provider.searchByName')}
              className="w-full px-10 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="az">{t('common.sortAZ')}</option>
            <option value="za">{t('common.sortZA')}</option>
          </select>
        </div>
      </div>

      {isLoading || isFetching ? (
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {skeletonItems.map((item) => (
            <div
              key={item}
              className="animate-pulse bg-white border border-gray-200 rounded-xl overflow-hidden"
            >
              <div className="h-40 bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {isError ? (
        <div className="flex flex-col items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <p className="font-semibold">{t('provider.loadFailed')}</p>
          <p className="text-sm">{error?.message || t('common.tryAgain')}</p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-red-200 text-red-700 rounded-md hover:bg-red-100 transition-colors"
          >
            <FiRefreshCw /> {t('common.retry')}
          </button>
        </div>
      ) : null}

      {!isLoading && !isError && filteredProviders.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-600">
          <p className="font-semibold text-lg">{t('provider.noProviders')}</p>
          <p className="text-sm mt-1">{t('provider.checkBackLater')}</p>
        </div>
      ) : null}

      {!isLoading && !isError && filteredProviders.length > 0 ? (
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProviders.map((provider) => (
            <MealProviderCard
              key={provider.id}
              provider={provider}
              isOpen={provider.isOpen}
              statusText={provider.statusText}
              onSelect={() => handleSelect(provider)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default MealsProvidersList;
