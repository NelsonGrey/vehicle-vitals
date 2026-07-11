import { useEffect, useMemo, useState } from 'react';
import {
  getMaintenanceEntries,
  getVehicle,
  getVehicles,
  updateVehicle,
} from '../shared/firestoreService';
import { getLocalServiceProviders } from '../utils/localServiceProviders';

type ProviderTypeFilter =
  | 'all'
  | 'repair_shop'
  | 'dealership'
  | 'body_shop'
  | 'car_wash'
  | 'detailer';

type HomeAddress = {
  street1: string;
  street2: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
};

type LocalServiceProvider = {
  id: string;
  type: 'repair_shop' | 'dealership' | 'body_shop' | 'car_wash' | 'detailer';
  name: string;
  distanceMiles: number;
  address: string;
  phone?: string;
  website?: string;
  rating?: number;
  specialties?: string[];
};

type PreferredProvider = {
  id: string;
  name: string;
  type: ProviderTypeFilter;
  address?: string;
  phone?: string;
  website?: string;
};

type PastProvider = {
  name: string;
  serviceCount: number;
  lastServiceDate?: string;
};

const providerTypeLabels: Record<ProviderTypeFilter, string> = {
  all: 'All provider types',
  repair_shop: 'Repair shop',
  dealership: 'Dealership',
  body_shop: 'Body shop',
  car_wash: 'Car wash',
  detailer: 'Detailer',
};

const emptyAddress: HomeAddress = {
  street1: '',
  street2: '',
  city: '',
  stateProvince: '',
  postalCode: '',
  country: 'US',
};

function normalizeAddress(address: HomeAddress): HomeAddress {
  return {
    street1: address.street1.trim(),
    street2: address.street2.trim(),
    city: address.city.trim(),
    stateProvince: address.stateProvince.trim(),
    postalCode: address.postalCode.trim(),
    country: address.country.trim() || 'US',
  };
}

function validateAddress(address: HomeAddress): string {
  if (!address.street1 || !address.city || !address.stateProvince) {
    return 'Street, city, and state are required to find nearby providers.';
  }
  return '';
}

function buildLocationSearchQuery(address: HomeAddress): string {
  return [
    address.street1,
    address.street2,
    address.city,
    address.stateProvince,
    address.postalCode,
    address.country,
  ]
    .map(value => value.trim())
    .filter(Boolean)
    .join(', ');
}

export default function ServiceProviders() {
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<LocalServiceProvider[]>([]);
  const [lookupSource, setLookupSource] = useState('unknown');

  const [homeAddress, setHomeAddress] = useState<HomeAddress>(emptyAddress);
  const [preferredProviderRadiusMiles, setPreferredProviderRadiusMiles] =
    useState(25);
  const [preferredProviderType, setPreferredProviderType] =
    useState<ProviderTypeFilter>('all');
  const [preferredProviderUseVehicleMake, setPreferredProviderUseVehicleMake] =
    useState(true);
  const [preferredVehicleMake, setPreferredVehicleMake] = useState('');
  const [garageMakes, setGarageMakes] = useState<string[]>([]);

  const [preferredProviders, setPreferredProviders] = useState<
    PreferredProvider[]
  >([]);
  const [savingPreferredId, setSavingPreferredId] = useState<string | null>(
    null
  );

  const [pastProviders, setPastProviders] = useState<PastProvider[]>([]);
  const [loadingPastProviders, setLoadingPastProviders] = useState(true);
  const [activeTab, setActiveTab] = useState<'search' | 'preferred'>('search');

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const prefs = await getVehicle('preferences');

        const providerRadiusMiles = Number(prefs?.preferredProviderRadiusMiles);
        const providerType = (prefs?.preferredProviderType || 'all').toString();
        const useVehicleMakePreference =
          prefs?.preferredProviderUseVehicleMake !== false;
        const vehicleMakePreference = (
          prefs?.preferredVehicleMake || ''
        ).toString();
        const storedAddress = prefs?.homeAddress as Partial<HomeAddress> | null;

        if (Number.isFinite(providerRadiusMiles) && providerRadiusMiles >= 5) {
          setPreferredProviderRadiusMiles(
            Math.max(5, Math.min(100, Math.round(providerRadiusMiles)))
          );
        }
        if (
          providerType === 'all' ||
          providerType === 'repair_shop' ||
          providerType === 'dealership' ||
          providerType === 'body_shop' ||
          providerType === 'car_wash' ||
          providerType === 'detailer'
        ) {
          setPreferredProviderType(providerType as ProviderTypeFilter);
        }
        setPreferredProviderUseVehicleMake(useVehicleMakePreference);
        setPreferredVehicleMake(vehicleMakePreference);

        const storedPreferredProviders = Array.isArray(
          prefs?.preferredProviders
        )
          ? (prefs.preferredProviders as PreferredProvider[])
          : [];
        setPreferredProviders(storedPreferredProviders);

        if (storedAddress && typeof storedAddress === 'object') {
          setHomeAddress({
            street1: storedAddress.street1 || '',
            street2: storedAddress.street2 || '',
            city: storedAddress.city || '',
            stateProvince: storedAddress.stateProvince || '',
            postalCode: storedAddress.postalCode || '',
            country: storedAddress.country || 'US',
          });
        }

        const vehicles = (await getVehicles()) as Array<{ make?: string }>;
        const uniqueMakes = Array.from(
          new Set(
            vehicles
              .map(vehicle => (vehicle?.make || '').trim())
              .filter(Boolean)
          )
        ).sort((a, b) => a.localeCompare(b));

        setGarageMakes(uniqueMakes);
        if (!vehicleMakePreference && uniqueMakes.length > 0) {
          setPreferredVehicleMake(uniqueMakes[0]);
        }

        const normalizedAddress = normalizeAddress({
          street1: storedAddress?.street1 || '',
          street2: storedAddress?.street2 || '',
          city: storedAddress?.city || '',
          stateProvince: storedAddress?.stateProvince || '',
          postalCode: storedAddress?.postalCode || '',
          country: storedAddress?.country || 'US',
        });
        const shouldAutoLookup = !validateAddress(normalizedAddress);

        if (!shouldAutoLookup) {
          return;
        }

        const resolvedProviderType =
          providerType === 'all' ||
          providerType === 'repair_shop' ||
          providerType === 'dealership' ||
          providerType === 'body_shop' ||
          providerType === 'car_wash' ||
          providerType === 'detailer'
            ? (providerType as ProviderTypeFilter)
            : 'all';

        const resolvedRadiusMiles =
          Number.isFinite(providerRadiusMiles) && providerRadiusMiles >= 5
            ? Math.max(5, Math.min(100, Math.round(providerRadiusMiles)))
            : 25;

        const resolvedVehicleMake =
          vehicleMakePreference || uniqueMakes[0] || '';

        setLoading(true);
        const result = await getLocalServiceProviders({
          locationQuery: buildLocationSearchQuery(normalizedAddress),
          radiusMiles: resolvedRadiusMiles,
          maxResults: 8,
          providerType: resolvedProviderType,
          vehicleMake: useVehicleMakePreference ? resolvedVehicleMake : '',
        });

        setProviders(result.providers || []);
        setLookupSource(result.source || 'unknown');
        setStatus('Loaded nearby providers from your saved preferences.');
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load provider preferences'
        );
      } finally {
        setLoading(false);
      }
    };

    void loadPreferences();
  }, []);

  useEffect(() => {
    const loadPastProviders = async () => {
      try {
        const vehicles = (await getVehicles()) as Array<{ vin: string }>;
        const byName = new Map<string, PastProvider>();

        for (const vehicle of vehicles) {
          const entries = (await getMaintenanceEntries(vehicle.vin)) as Array<{
            providerName?: string;
            date?: string;
          }>;

          for (const entry of entries || []) {
            const name = (entry.providerName || '').trim();
            if (!name) continue;

            const existing = byName.get(name);
            const entryDate = entry.date;
            if (existing) {
              existing.serviceCount += 1;
              if (
                entryDate &&
                (!existing.lastServiceDate ||
                  entryDate > existing.lastServiceDate)
              ) {
                existing.lastServiceDate = entryDate;
              }
            } else {
              byName.set(name, {
                name,
                serviceCount: 1,
                lastServiceDate: entryDate,
              });
            }
          }
        }

        setPastProviders(
          Array.from(byName.values()).sort(
            (a, b) => b.serviceCount - a.serviceCount
          )
        );
      } catch {
        // Non-critical — past providers is a nice-to-have summary
      } finally {
        setLoadingPastProviders(false);
      }
    };

    void loadPastProviders();
  }, []);

  const savePreferredProviders = async (next: PreferredProvider[]) => {
    setPreferredProviders(next);
    try {
      await updateVehicle('preferences', { preferredProviders: next });
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Failed to save preferred providers'
      );
    }
  };

  const addPreferredProvider = async (candidate: PreferredProvider) => {
    if (preferredProviders.some(p => p.id === candidate.id)) return;
    setSavingPreferredId(candidate.id);
    try {
      await savePreferredProviders([...preferredProviders, candidate]);
    } finally {
      setSavingPreferredId(null);
    }
  };

  const removePreferredProvider = async (id: string) => {
    setSavingPreferredId(id);
    try {
      await savePreferredProviders(
        preferredProviders.filter(p => p.id !== id)
      );
    } finally {
      setSavingPreferredId(null);
    }
  };

  const locationSearchQuery = useMemo(
    () => buildLocationSearchQuery(normalizeAddress(homeAddress)),
    [homeAddress]
  );

  const runLookup = async () => {
    setError('');
    setStatus('');
    const normalizedAddress = normalizeAddress(homeAddress);
    const validationError = validateAddress(normalizedAddress);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const result = await getLocalServiceProviders({
        locationQuery: buildLocationSearchQuery(normalizedAddress),
        radiusMiles: preferredProviderRadiusMiles,
        maxResults: 8,
        providerType: preferredProviderType,
        vehicleMake: preferredProviderUseVehicleMake
          ? preferredVehicleMake
          : '',
      });

      setProviders(result.providers || []);
      setLookupSource(result.source || 'unknown');
      setStatus('Nearby providers updated.');

      await updateVehicle('preferences', {
        homeAddress: normalizedAddress,
        preferredProviderRadiusMiles,
        preferredProviderType,
        preferredProviderUseVehicleMake,
        preferredVehicleMake,
      });
    } catch (lookupError) {
      setProviders([]);
      setError(
        lookupError instanceof Error
          ? lookupError.message
          : 'Failed to find nearby providers'
      );
    } finally {
      setLoading(false);
    }
  };

  const navItems: Array<{
    key: 'search' | 'preferred';
    title: string;
    description: string;
  }> = [
    {
      key: 'search',
      title: 'Search',
      description:
        'Find nearby repair shops, dealerships, body shops, car washes, and detailers.',
    },
    {
      key: 'preferred',
      title: `Preferred${preferredProviders.length ? ` (${preferredProviders.length})` : ''}`,
      description:
        "Providers you've pinned, plus shops from your service history.",
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-5 py-5">
      <h1 className="font-serif font-bold text-4xl text-slate-900 dark:text-slate-100 m-0">
        Mechanics
      </h1>
      <p className="text-slate-600 dark:text-slate-300 mt-2 mb-6">
        Find nearby repair shops, dealerships, body shops, car washes, and
        detailers, and keep track of the ones you trust.
      </p>

      {status && (
        <div
          className="bg-accent-50 border border-accent-200 text-accent-700 px-4 py-3 rounded-lg mb-4"
          role="alert"
        >
          {status}
        </div>
      )}
      {error && (
        <div
          className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg mb-4"
          role="alert"
        >
          {error}
        </div>
      )}

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:items-start">
        <div className="lg:col-span-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
          <h2 className="font-semibold text-lg text-slate-900 dark:text-slate-100 mt-0 mb-3 px-1">
            Menu
          </h2>
          <div className="space-y-2">
            {navItems.map(item => {
              const isSelected = item.key === activeTab;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveTab(item.key)}
                  aria-current={isSelected}
                  className={`w-full text-left rounded-lg border p-3 transition-colors ${
                    isSelected
                      ? 'border-slate-500 bg-slate-100 dark:border-slate-300 dark:bg-slate-700'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/70'
                  }`}
                >
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    {item.title}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {item.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-8 space-y-4">
          {activeTab === 'search' ? (
            <>
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <h2 className="font-semibold text-xl text-slate-900 dark:text-slate-100 mt-0 mb-4">
                  Search Preferences
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-0 mb-4">
                  Save your home-area search settings here, then rerun the
                  lookup any time you want a fresh nearby-provider list.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="text-sm text-slate-700 dark:text-slate-300">
                    Street
                    <input
                      className="w-full mt-1 rounded-md border border-slate-300 px-3 py-2 bg-white dark:bg-slate-700"
                      value={homeAddress.street1}
                      onChange={event =>
                        setHomeAddress(current => ({
                          ...current,
                          street1: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="text-sm text-slate-700 dark:text-slate-300">
                    City
                    <input
                      className="w-full mt-1 rounded-md border border-slate-300 px-3 py-2 bg-white dark:bg-slate-700"
                      value={homeAddress.city}
                      onChange={event =>
                        setHomeAddress(current => ({
                          ...current,
                          city: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="text-sm text-slate-700 dark:text-slate-300">
                    State
                    <input
                      className="w-full mt-1 rounded-md border border-slate-300 px-3 py-2 bg-white dark:bg-slate-700"
                      value={homeAddress.stateProvince}
                      onChange={event =>
                        setHomeAddress(current => ({
                          ...current,
                          stateProvince: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="text-sm text-slate-700 dark:text-slate-300">
                    Radius (miles)
                    <input
                      type="number"
                      min={5}
                      max={100}
                      className="w-full mt-1 rounded-md border border-slate-300 px-3 py-2 bg-white dark:bg-slate-700"
                      value={preferredProviderRadiusMiles}
                      onChange={event =>
                        setPreferredProviderRadiusMiles(
                          Math.max(
                            5,
                            Math.min(100, Number(event.target.value) || 25)
                          )
                        )
                      }
                    />
                  </label>
                  <label className="text-sm text-slate-700 dark:text-slate-300">
                    Provider Type
                    <select
                      className="w-full mt-1 rounded-md border border-slate-300 px-3 py-2 bg-white dark:bg-slate-700"
                      value={preferredProviderType}
                      onChange={event =>
                        setPreferredProviderType(
                          event.target.value as ProviderTypeFilter
                        )
                      }
                    >
                      <option value="all">All</option>
                      <option value="repair_shop">Repair shops</option>
                      <option value="dealership">Dealerships</option>
                      <option value="body_shop">Body shops</option>
                      <option value="car_wash">Car washes</option>
                      <option value="detailer">Detailers</option>
                    </select>
                  </label>
                  <label className="text-sm text-slate-700 dark:text-slate-300">
                    Vehicle Make
                    <select
                      className="w-full mt-1 rounded-md border border-slate-300 px-3 py-2 bg-white dark:bg-slate-700"
                      value={preferredVehicleMake}
                      onChange={event =>
                        setPreferredVehicleMake(event.target.value)
                      }
                      disabled={
                        !garageMakes.length || !preferredProviderUseVehicleMake
                      }
                    >
                      {!garageMakes.length && (
                        <option value="">No saved makes</option>
                      )}
                      {garageMakes.map(make => (
                        <option key={make} value={make}>
                          {make}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="inline-flex items-center gap-2 mt-4 text-sm text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={preferredProviderUseVehicleMake}
                    onChange={event =>
                      setPreferredProviderUseVehicleMake(event.target.checked)
                    }
                  />
                  Prioritize my saved vehicle make for dealership results
                </label>

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => void runLookup()}
                    disabled={loading}
                    className="bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-md disabled:opacity-60"
                  >
                    {loading ? 'Searching...' : 'Find Nearby Providers'}
                  </button>
                </div>

                <p className="text-xs text-slate-500 mt-3 mb-0">
                  Query: {locationSearchQuery || 'Enter address to search'}
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-semibold text-xl text-slate-900 dark:text-slate-100 mt-0 mb-4">
                    Results
                  </h2>
                  <span className="text-xs text-slate-500 mb-4">
                    Source: {lookupSource}
                  </span>
                </div>

                {providers.length === 0 ? (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-0">
                    No providers yet. Run a search to view local options.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {providers.map(provider => (
                      <article
                        key={provider.id}
                        className="rounded-lg border border-slate-200 dark:border-slate-700 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-base m-0 text-slate-900 dark:text-slate-100">
                              {provider.name}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 mb-0">
                              {provider.address}
                            </p>
                          </div>
                          <span className="text-xs rounded-full px-2 py-1 bg-slate-100 dark:bg-slate-700">
                            {providerTypeLabels[provider.type] ||
                              'Service provider'}
                          </span>
                        </div>
                        <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                          <p className="m-0">
                            {provider.distanceMiles} miles away
                          </p>
                          {provider.rating ? (
                            <p className="m-0">Rating: {provider.rating}</p>
                          ) : null}
                          {provider.phone ? (
                            <p className="m-0">Phone: {provider.phone}</p>
                          ) : null}
                          {provider.specialties?.length ? (
                            <p className="m-0">
                              Specialties: {provider.specialties.join(', ')}
                            </p>
                          ) : null}
                        </div>
                        <div className="mt-3 flex items-center gap-3">
                          {provider.website ? (
                            <a
                              href={provider.website}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm text-teal-700 hover:text-teal-800"
                            >
                              Visit website
                            </a>
                          ) : null}
                          <button
                            type="button"
                            onClick={() =>
                              void addPreferredProvider({
                                id: provider.id,
                                name: provider.name,
                                type: provider.type,
                                address: provider.address,
                                phone: provider.phone,
                                website: provider.website,
                              })
                            }
                            disabled={
                              savingPreferredId === provider.id ||
                              preferredProviders.some(
                                p => p.id === provider.id
                              )
                            }
                            className="text-xs px-2 py-1 rounded-md border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 disabled:opacity-60"
                          >
                            {preferredProviders.some(
                              p => p.id === provider.id
                            )
                              ? '★ Preferred'
                              : '☆ Save as Preferred'}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <h2 className="font-semibold text-xl text-slate-900 dark:text-slate-100 mt-0 mb-1">
                  Preferred Providers
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-0 mb-4">
                  Pin providers you trust from search results or your service
                  history so they're easy to find next time.
                </p>

                {preferredProviders.length === 0 ? (
                  <p className="text-sm text-slate-600 dark:text-slate-400 m-0">
                    No preferred providers saved yet. Search for nearby
                    providers or check your service history below to pin one.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {preferredProviders.map(provider => (
                      <div
                        key={provider.id}
                        className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 dark:border-slate-700 p-3"
                      >
                        <div>
                          <div className="font-medium text-slate-900 dark:text-slate-100">
                            ★ {provider.name}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {providerTypeLabels[provider.type] ||
                              'Service provider'}
                            {provider.address ? ` • ${provider.address}` : ''}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            void removePreferredProvider(provider.id)
                          }
                          disabled={savingPreferredId === provider.id}
                          className="text-xs px-2 py-1 rounded-md border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 disabled:opacity-60"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <h2 className="font-semibold text-xl text-slate-900 dark:text-slate-100 mt-0 mb-1">
                  Providers You've Used
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-0 mb-4">
                  Built from the shop/mechanic name saved on maintenance
                  records across your garage.
                </p>

                {loadingPastProviders ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0">
                    Loading service history…
                  </p>
                ) : pastProviders.length === 0 ? (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-0">
                    No past providers yet. Add a "Shop / mechanic name" the
                    next time you log a maintenance record.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {pastProviders.map(provider => {
                      const isPreferred = preferredProviders.some(
                        p =>
                          p.name.toLowerCase() === provider.name.toLowerCase()
                      );
                      return (
                        <div
                          key={provider.name}
                          className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 dark:border-slate-700 p-3"
                        >
                          <div>
                            <div className="font-medium text-slate-900 dark:text-slate-100">
                              {provider.name}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {provider.serviceCount} service
                              {provider.serviceCount === 1 ? '' : 's'}
                              {provider.lastServiceDate
                                ? ` • Last ${new Date(provider.lastServiceDate).toLocaleDateString()}`
                                : ''}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              void addPreferredProvider({
                                id: `used-${provider.name.toLowerCase().replace(/\s+/g, '-')}`,
                                name: provider.name,
                                type: 'repair_shop',
                              })
                            }
                            disabled={isPreferred}
                            className="text-xs px-2 py-1 rounded-md border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 disabled:opacity-60"
                          >
                            {isPreferred ? 'Preferred' : 'Save as Preferred'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
