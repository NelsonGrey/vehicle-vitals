import { useEffect, useMemo, useState } from 'react';
import {
  getVehicle,
  getVehicles,
  updateVehicle,
} from '../shared/firestoreService';
import { getLocalServiceProviders } from '../utils/localServiceProviders';

type ProviderTypeFilter = 'all' | 'repair_shop' | 'dealership';

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
  type: 'repair_shop' | 'dealership';
  name: string;
  distanceMiles: number;
  address: string;
  phone?: string;
  website?: string;
  rating?: number;
  specialties?: string[];
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
          providerType === 'dealership'
        ) {
          setPreferredProviderType(providerType as ProviderTypeFilter);
        }
        setPreferredProviderUseVehicleMake(useVehicleMakePreference);
        setPreferredVehicleMake(vehicleMakePreference);

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
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load provider preferences'
        );
      }
    };

    void loadPreferences();
  }, []);

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

  return (
    <div className="w-full max-w-7xl mx-auto px-5 py-5">
      <h1 className="font-serif font-bold text-4xl text-slate-900 dark:text-slate-100 m-0">
        Service Providers
      </h1>
      <p className="text-slate-600 dark:text-slate-300 mt-2 mb-6">
        Find local repair shops and dealerships using your saved profile
        preferences.
      </p>

      {status && (
        <div
          className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4"
          role="alert"
        >
          {status}
        </div>
      )}
      {error && (
        <div
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="font-semibold text-xl text-slate-900 dark:text-slate-100 mt-0 mb-4">
          Search Preferences
        </h2>

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
                  Math.max(5, Math.min(100, Number(event.target.value) || 25))
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
            </select>
          </label>
          <label className="text-sm text-slate-700 dark:text-slate-300">
            Vehicle Make
            <select
              className="w-full mt-1 rounded-md border border-slate-300 px-3 py-2 bg-white dark:bg-slate-700"
              value={preferredVehicleMake}
              onChange={event => setPreferredVehicleMake(event.target.value)}
              disabled={!garageMakes.length || !preferredProviderUseVehicleMake}
            >
              {!garageMakes.length && <option value="">No saved makes</option>}
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

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
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
                    {provider.type === 'dealership'
                      ? 'Dealership'
                      : 'Repair Shop'}
                  </span>
                </div>
                <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  <p className="m-0">{provider.distanceMiles} miles away</p>
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
                {provider.website ? (
                  <a
                    href={provider.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block mt-2 text-sm text-teal-700 hover:text-teal-800"
                  >
                    Visit website
                  </a>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
