import { useEffect, useState } from 'react';
import { useAuth } from '../shared/AuthContext';
import {
  getVehicle,
  getVehicles,
  updateVehicle,
} from '../shared/firestoreService';

// Declare Firebase global
declare global {
  interface Window {
    firebase: {
      app: any;
      auth: any;
      firestore: any;
      functions: any;
      messaging: any;
      storage: any;
    };
  }
}

interface AuthService {
  EmailAuthProvider: {
    credential: (email: string, password: string) => unknown;
  };
  reauthenticateWithCredential: (
    user: unknown,
    credential: unknown
  ) => Promise<void>;
  updatePassword: (user: unknown, newPassword: string) => Promise<void>;
  deleteUser: (user: unknown) => Promise<void>;
}

interface HomeAddress {
  street1: string;
  street2: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
}

interface LocalServiceProvider {
  id: string;
  type: 'repair_shop' | 'dealership';
  name: string;
  distanceMiles: number;
  address: string;
  phone: string;
  website: string;
  rating: number;
  specialties: string[];
}

interface VehicleSummary {
  make?: string;
}

type ProviderTypeFilter = 'all' | 'repair_shop' | 'dealership';
const UNDO_WINDOW_MS = 30_000;

interface ProviderLookupSnapshot {
  radiusMiles: number;
  providerType: ProviderTypeFilter;
  useVehicleMake: boolean;
  actionType: 'radius' | 'filters';
  capturedAt: number;
}

// Create async Firebase auth service using global Firebase objects
const createFirebaseAuthService = async () => {
  try {
    // Wait for global Firebase to be available
    const checkFirebase = () => {
      return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max

        const check = () => {
          attempts++;
          if (window.firebase && window.firebase.auth) {
            resolve(window.firebase);
          } else if (attempts >= maxAttempts) {
            reject(new Error('Firebase SDKs failed to load within timeout'));
          } else {
            setTimeout(check, 100);
          }
        };
        check();
      });
    };

    const firebase = (await checkFirebase()) as typeof window.firebase;
    return {
      EmailAuthProvider: firebase.auth.EmailAuthProvider,
      reauthenticateWithCredential: firebase.auth.reauthenticateWithCredential,
      updatePassword: firebase.auth.updatePassword,
      deleteUser: firebase.auth.deleteUser,
    };
  } catch (error) {
    console.warn('Firebase auth not available:', error);
    // Return mock service for build compatibility
    return {
      EmailAuthProvider: { credential: () => ({}) },
      reauthenticateWithCredential: async () => {},
      updatePassword: async () => {},
      deleteUser: async () => {},
    };
  }
};

export default function Profile() {
  const { user, signOut } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [authService, setAuthService] = useState<AuthService | null>(null);
  const [preferencesSaving, setPreferencesSaving] = useState(false);
  const [maintenanceAlertsEnabled, setMaintenanceAlertsEnabled] =
    useState(true);
  const [preferredReminderTimingDays, setPreferredReminderTimingDays] =
    useState(14);
  const [preferredDailyMiles, setPreferredDailyMiles] = useState(35);
  const [addressSaving, setAddressSaving] = useState(false);
  const [homeAddress, setHomeAddress] = useState<HomeAddress>({
    street1: '',
    street2: '',
    city: '',
    stateProvince: '',
    postalCode: '',
    country: 'US',
  });
  const [providerLookupLoading, setProviderLookupLoading] = useState(false);
  const [providerLookupSource, setProviderLookupSource] = useState('');
  const [preferredProviderRadiusMiles, setPreferredProviderRadiusMiles] =
    useState(25);
  const [preferredProviderType, setPreferredProviderType] =
    useState<ProviderTypeFilter>('all');
  const [preferredProviderUseVehicleMake, setPreferredProviderUseVehicleMake] =
    useState(true);
  const [preferredVehicleMake, setPreferredVehicleMake] = useState('');
  const [garageMakes, setGarageMakes] = useState<string[]>([]);
  const [hasProviderLookupRun, setHasProviderLookupRun] = useState(false);
  const [hasUsedBroadenAction, setHasUsedBroadenAction] = useState(false);
  const [lastRecoverySnapshot, setLastRecoverySnapshot] =
    useState<ProviderLookupSnapshot | null>(null);
  const [undoNow, setUndoNow] = useState(Date.now());
  const [nearbyProviders, setNearbyProviders] = useState<
    LocalServiceProvider[]
  >([]);

  useEffect(() => {
    createFirebaseAuthService().then(setAuthService);
  }, []);

  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return;
      try {
        const prefs = await getVehicle('__preferences__');
        const enabled = prefs?.maintenanceAlertsEnabled;
        const leadDays = Number(prefs?.preferredReminderTimingDays);
        const dailyMiles = Number(prefs?.preferredDailyMiles);
        const providerRadiusMiles = Number(prefs?.preferredProviderRadiusMiles);
        const providerType = (prefs?.preferredProviderType || 'all').toString();
        const useVehicleMakePreference =
          prefs?.preferredProviderUseVehicleMake !== false;
        const vehicleMakePreference = (
          prefs?.preferredVehicleMake || ''
        ).toString();
        const storedAddress = prefs?.homeAddress as Partial<HomeAddress> | null;

        if (typeof enabled === 'boolean') {
          setMaintenanceAlertsEnabled(enabled);
        }
        if (Number.isFinite(leadDays) && leadDays > 0) {
          setPreferredReminderTimingDays(Math.round(leadDays));
        }
        if (Number.isFinite(dailyMiles) && dailyMiles > 0) {
          setPreferredDailyMiles(Math.round(dailyMiles));
        }
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

        const vehicles = (await getVehicles()) as VehicleSummary[];
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
        if (
          vehicleMakePreference &&
          uniqueMakes.length > 0 &&
          !uniqueMakes.includes(vehicleMakePreference)
        ) {
          setPreferredVehicleMake(uniqueMakes[0]);
        }
      } catch (prefError) {
        console.warn('Unable to load reminder preferences', prefError);
      }
    };

    void loadPreferences();
  }, [user]);

  useEffect(() => {
    if (!lastRecoverySnapshot) return;

    const intervalId = window.setInterval(() => {
      setUndoNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [lastRecoverySnapshot]);

  useEffect(() => {
    if (!lastRecoverySnapshot) return;
    if (Date.now() - lastRecoverySnapshot.capturedAt > UNDO_WINDOW_MS) {
      setLastRecoverySnapshot(null);
    }
  }, [undoNow, lastRecoverySnapshot]);

  if (!user || !authService) return null;

  const savePreferences = async () => {
    setPreferencesSaving(true);
    setError('');
    setStatus('');
    try {
      await updateVehicle('__preferences__', {
        maintenanceAlertsEnabled,
        preferredReminderTimingDays,
        preferredDailyMiles,
        preferredProviderRadiusMiles,
        preferredProviderType,
        preferredProviderUseVehicleMake,
        preferredVehicleMake,
      });
      setStatus('Reminder preferences saved.');
    } catch (prefError) {
      setError(
        prefError instanceof Error
          ? prefError.message
          : 'Failed to save reminder preferences'
      );
    } finally {
      setPreferencesSaving(false);
    }
  };

  const reauth = async () => {
    if (!user.email) {
      throw new Error('User email is required for reauthentication');
    }
    const cred = authService.EmailAuthProvider.credential(
      user.email,
      currentPassword
    );
    await authService.reauthenticateWithCredential(user, cred);
  };

  const onAddressFieldChange = (field: keyof HomeAddress, value: string) => {
    setHomeAddress(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const normalizeAddress = (address: HomeAddress): HomeAddress => {
    const normalizeSimple = (value: string) => value.trim();
    return {
      street1: normalizeSimple(address.street1),
      street2: normalizeSimple(address.street2),
      city: normalizeSimple(address.city),
      stateProvince: normalizeSimple(address.stateProvince).toUpperCase(),
      postalCode: normalizeSimple(address.postalCode).toUpperCase(),
      country: normalizeSimple(address.country).toUpperCase(),
    };
  };

  const validateAddress = (address: HomeAddress): string | null => {
    if (!address.street1) return 'Street address is required.';
    if (!address.city) return 'City is required.';
    if (!address.stateProvince) return 'State or province is required.';
    if (!address.postalCode) return 'Postal code is required.';
    if (!address.country) return 'Country is required.';

    if (
      address.country === 'US' &&
      !/^\d{5}(-\d{4})?$/.test(address.postalCode)
    ) {
      return 'US ZIP code must be in 12345 or 12345-6789 format.';
    }

    if (
      address.country === 'CA' &&
      !/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/.test(address.postalCode)
    ) {
      return 'Canadian postal code must be in A1A 1A1 format.';
    }

    return null;
  };

  const buildLocationSearchQuery = (address: HomeAddress) =>
    [
      address.street1,
      address.street2,
      address.city,
      address.stateProvince,
      address.postalCode,
      address.country,
    ]
      .filter(Boolean)
      .join(', ');

  const saveHomeAddress = async () => {
    setAddressSaving(true);
    setError('');
    setStatus('');

    const normalizedAddress = normalizeAddress(homeAddress);
    const validationError = validateAddress(normalizedAddress);

    if (validationError) {
      setAddressSaving(false);
      setError(validationError);
      return;
    }

    const locationSearchQuery = buildLocationSearchQuery(normalizedAddress);

    try {
      await updateVehicle('__preferences__', {
        homeAddress: normalizedAddress,
        locationSearchQuery,
        preferredProviderRadiusMiles,
        preferredProviderType,
        preferredProviderUseVehicleMake,
        preferredVehicleMake,
        locationUpdatedAt: new Date().toISOString(),
      });
      setHomeAddress(normalizedAddress);
      setStatus('Home address saved for local service recommendations.');
    } catch (addressError) {
      setError(
        addressError instanceof Error
          ? addressError.message
          : 'Failed to save home address'
      );
    } finally {
      setAddressSaving(false);
    }
  };

  const findNearbyProviders = async (
    options?: Partial<{
      radiusMiles: number;
      providerType: ProviderTypeFilter;
      useVehicleMake: boolean;
      successStatus: string;
    }>
  ) => {
    setProviderLookupLoading(true);
    setError('');
    setStatus('');

    const normalizedAddress = normalizeAddress(homeAddress);
    const validationError = validateAddress(normalizedAddress);
    if (validationError) {
      setProviderLookupLoading(false);
      setError(validationError);
      return;
    }

    const locationSearchQuery = buildLocationSearchQuery(normalizedAddress);
    const effectiveRadiusMiles =
      options?.radiusMiles ?? preferredProviderRadiusMiles;
    const effectiveProviderType =
      options?.providerType ?? preferredProviderType;
    const effectiveUseVehicleMake =
      options?.useVehicleMake ?? preferredProviderUseVehicleMake;

    const vehicleMakeForLookup = effectiveUseVehicleMake
      ? preferredVehicleMake
      : '';

    try {
      const result = await getLocalServiceProviders({
        locationQuery: locationSearchQuery,
        radiusMiles: effectiveRadiusMiles,
        maxResults: 8,
        providerType: effectiveProviderType,
        vehicleMake: vehicleMakeForLookup,
      });

      setNearbyProviders(result.providers || []);
      setProviderLookupSource(result.source || 'unknown');
      setHasProviderLookupRun(true);
      setStatus(
        options?.successStatus ||
          'Nearby providers updated from your saved address.'
      );
    } catch (providerError) {
      setError(
        providerError instanceof Error
          ? providerError.message
          : 'Failed to find nearby providers'
      );
      setHasProviderLookupRun(true);
      setNearbyProviders([]);
    } finally {
      setProviderLookupLoading(false);
    }
  };

  const broadenSearchRadius = async () => {
    setHasUsedBroadenAction(true);
    setLastRecoverySnapshot({
      radiusMiles: preferredProviderRadiusMiles,
      providerType: preferredProviderType,
      useVehicleMake: preferredProviderUseVehicleMake,
      actionType: 'radius',
      capturedAt: Date.now(),
    });

    const nextRadius = Math.min(100, preferredProviderRadiusMiles + 15);
    setPreferredProviderRadiusMiles(nextRadius);
    try {
      await updateVehicle('__preferences__', {
        preferredProviderRadiusMiles: nextRadius,
      });
    } catch (persistError) {
      console.warn('Unable to persist broadened radius', persistError);
    }
    await findNearbyProviders({
      radiusMiles: nextRadius,
      successStatus: 'Search radius increased and saved as your default.',
    });
  };

  const broadenSearchFilters = async () => {
    setHasUsedBroadenAction(true);
    setLastRecoverySnapshot({
      radiusMiles: preferredProviderRadiusMiles,
      providerType: preferredProviderType,
      useVehicleMake: preferredProviderUseVehicleMake,
      actionType: 'filters',
      capturedAt: Date.now(),
    });

    const nextRadius = Math.min(100, preferredProviderRadiusMiles + 15);
    setPreferredProviderRadiusMiles(nextRadius);
    setPreferredProviderType('all');
    setPreferredProviderUseVehicleMake(false);
    try {
      await updateVehicle('__preferences__', {
        preferredProviderRadiusMiles: nextRadius,
        preferredProviderType: 'all',
        preferredProviderUseVehicleMake: false,
      });
    } catch (persistError) {
      console.warn('Unable to persist broadened filters', persistError);
    }
    await findNearbyProviders({
      radiusMiles: nextRadius,
      providerType: 'all',
      useVehicleMake: false,
      successStatus:
        'Broader search settings were applied and saved as your defaults.',
    });
  };

  const undoRecoveryChanges = async () => {
    if (!lastRecoverySnapshot) return;

    if (Date.now() - lastRecoverySnapshot.capturedAt > UNDO_WINDOW_MS) {
      setLastRecoverySnapshot(null);
      setStatus('Undo window expired.');
      return;
    }

    setPreferredProviderRadiusMiles(lastRecoverySnapshot.radiusMiles);
    setPreferredProviderType(lastRecoverySnapshot.providerType);
    setPreferredProviderUseVehicleMake(lastRecoverySnapshot.useVehicleMake);

    try {
      await updateVehicle('__preferences__', {
        preferredProviderRadiusMiles: lastRecoverySnapshot.radiusMiles,
        preferredProviderType: lastRecoverySnapshot.providerType,
        preferredProviderUseVehicleMake: lastRecoverySnapshot.useVehicleMake,
      });
    } catch (persistError) {
      console.warn('Unable to persist undo settings', persistError);
    }

    await findNearbyProviders({
      radiusMiles: lastRecoverySnapshot.radiusMiles,
      providerType: lastRecoverySnapshot.providerType,
      useVehicleMake: lastRecoverySnapshot.useVehicleMake,
      successStatus: 'Previous search settings restored and saved as defaults.',
    });

    setLastRecoverySnapshot(null);
  };

  const onChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setStatus('');
    if (!newPassword || newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      await reauth();
      await authService!.updatePassword(user, newPassword);
      setStatus('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update password'
      );
    } finally {
      setBusy(false);
    }
  };

  const onDeleteAccount = async () => {
    const sure = window.confirm(
      'This will permanently delete your account and all your vehicles. Continue?'
    );
    if (!sure) return;
    setError('');
    setStatus('');
    setBusy(true);
    try {
      await reauth();
      await authService!.deleteUser(user);
      setStatus('Account deleted.');
      // Optionally sign out cleanup
      await signOut();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
    } finally {
      setBusy(false);
    }
  };

  const providerTypeLabel =
    preferredProviderType === 'all'
      ? 'all types'
      : preferredProviderType === 'repair_shop'
        ? 'repair shops'
        : 'dealerships';

  const garageContextLabel = preferredProviderUseVehicleMake
    ? preferredVehicleMake
      ? `Matching dealerships for ${preferredVehicleMake}`
      : 'Vehicle make matching is enabled (select a make to target dealers)'
    : 'Vehicle make matching is disabled';

  const undoSecondsRemaining = lastRecoverySnapshot
    ? Math.max(
        0,
        Math.ceil(
          (UNDO_WINDOW_MS - (undoNow - lastRecoverySnapshot.capturedAt)) / 1000
        )
      )
    : 0;

  const undoActionLabel = lastRecoverySnapshot
    ? lastRecoverySnapshot.actionType === 'filters'
      ? 'Undo Last Broaden Filters'
      : 'Undo Last Radius Increase'
    : 'Undo Last Broaden';

  return (
    <div className="w-full max-w-7xl mx-auto px-5 py-5">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif font-bold text-4xl text-slate-900 dark:text-slate-100 m-0">
            Profile
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mt-2 mb-0">
            Signed in as{' '}
            <strong className="text-slate-900 dark:text-slate-100">
              {user.email}
            </strong>
          </p>
        </div>
      </div>

      {status && (
        <div
          className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6"
          role="alert"
        >
          {status}
        </div>
      )}
      {error && (
        <div
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6 space-y-6">
        <h2 className="font-serif font-bold text-2xl text-slate-900 dark:text-slate-100 m-0">
          Maintenance Alert Preferences
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 mt-0">
          Control whether maintenance reminders are generated and when they
          should appear before service is due.
        </p>

        <div className="space-y-4 border-t border-slate-200 dark:border-slate-700 pt-4">
          <label className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200">
            <span>Enable maintenance alerts</span>
            <input
              type="checkbox"
              checked={maintenanceAlertsEnabled}
              onChange={event =>
                setMaintenanceAlertsEnabled(event.target.checked)
              }
            />
          </label>

          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
            Preferred reminder lead time (days)
          </label>
          <input
            type="number"
            min={1}
            max={90}
            value={preferredReminderTimingDays}
            onChange={event => {
              const next = Number(event.target.value);
              if (Number.isFinite(next)) {
                setPreferredReminderTimingDays(Math.max(1, Math.min(90, next)));
              }
            }}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 dark:bg-slate-700 dark:text-slate-100"
          />

          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2 mt-4">
            Average driving distance (miles/day)
          </label>
          <input
            type="number"
            min={1}
            max={250}
            value={preferredDailyMiles}
            onChange={event => {
              const next = Number(event.target.value);
              if (Number.isFinite(next)) {
                setPreferredDailyMiles(
                  Math.max(1, Math.min(250, Math.round(next)))
                );
              }
            }}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 dark:bg-slate-700 dark:text-slate-100"
          />
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => void savePreferences()}
            disabled={preferencesSaving}
            className="bg-slate-600 hover:bg-slate-700 disabled:bg-slate-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
          >
            {preferencesSaving ? 'Saving…' : 'Save Alert Preferences'}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6 space-y-6">
        <h2 className="font-serif font-bold text-2xl text-slate-900 dark:text-slate-100 mb-3 mt-0">
          Home Address
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 mt-0">
          Save your home address so we can surface nearby repair shops and
          dealerships.
        </p>

        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
          <div className="space-y-3">
            <div>
              <label
                htmlFor="street1"
                className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2"
              >
                Street address
              </label>
              <input
                id="street1"
                type="text"
                autoComplete="address-line1"
                value={homeAddress.street1}
                onChange={e => onAddressFieldChange('street1', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 dark:bg-slate-700 dark:text-slate-100"
                placeholder="123 Main St"
              />
            </div>

            <div>
              <label
                htmlFor="street2"
                className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2"
              >
                Apt, suite, unit (optional)
              </label>
              <input
                id="street2"
                type="text"
                autoComplete="address-line2"
                value={homeAddress.street2}
                onChange={e => onAddressFieldChange('street2', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 dark:bg-slate-700 dark:text-slate-100"
                placeholder="Apt 4B"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="city"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2"
                >
                  City
                </label>
                <input
                  id="city"
                  type="text"
                  autoComplete="address-level2"
                  value={homeAddress.city}
                  onChange={e => onAddressFieldChange('city', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 dark:bg-slate-700 dark:text-slate-100"
                  placeholder="Nashville"
                />
              </div>

              <div>
                <label
                  htmlFor="stateProvince"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2"
                >
                  State / province
                </label>
                <input
                  id="stateProvince"
                  type="text"
                  autoComplete="address-level1"
                  value={homeAddress.stateProvince}
                  onChange={e =>
                    onAddressFieldChange('stateProvince', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 dark:bg-slate-700 dark:text-slate-100"
                  placeholder="TN"
                />
              </div>

              <div>
                <label
                  htmlFor="postalCode"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2"
                >
                  ZIP / postal code
                </label>
                <input
                  id="postalCode"
                  type="text"
                  autoComplete="postal-code"
                  value={homeAddress.postalCode}
                  onChange={e =>
                    onAddressFieldChange('postalCode', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 dark:bg-slate-700 dark:text-slate-100"
                  placeholder="37203"
                />
              </div>

              <div>
                <label
                  htmlFor="providerRadius"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2"
                >
                  Search radius (miles)
                </label>
                <input
                  id="providerRadius"
                  type="number"
                  min={5}
                  max={100}
                  value={preferredProviderRadiusMiles}
                  onChange={e => {
                    const next = Number(e.target.value);
                    if (Number.isFinite(next)) {
                      setPreferredProviderRadiusMiles(
                        Math.max(5, Math.min(100, Math.round(next)))
                      );
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 dark:bg-slate-700 dark:text-slate-100"
                  placeholder="25"
                />
              </div>

              <div>
                <label
                  htmlFor="providerType"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2"
                >
                  Service type
                </label>
                <select
                  id="providerType"
                  value={preferredProviderType}
                  onChange={e =>
                    setPreferredProviderType(
                      e.target.value as ProviderTypeFilter
                    )
                  }
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 dark:bg-slate-700 dark:text-slate-100"
                >
                  <option value="all">All providers</option>
                  <option value="repair_shop">Repair shops only</option>
                  <option value="dealership">Dealerships only</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200 mb-2">
                  <span>Use my vehicle make for dealership matching</span>
                  <input
                    type="checkbox"
                    checked={preferredProviderUseVehicleMake}
                    onChange={e =>
                      setPreferredProviderUseVehicleMake(e.target.checked)
                    }
                  />
                </label>
                <select
                  id="preferredVehicleMake"
                  value={preferredVehicleMake}
                  onChange={e => setPreferredVehicleMake(e.target.value)}
                  disabled={
                    !preferredProviderUseVehicleMake || garageMakes.length === 0
                  }
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 dark:bg-slate-700 dark:text-slate-100 disabled:opacity-60"
                >
                  {garageMakes.length === 0 ? (
                    <option value="">No vehicle makes found</option>
                  ) : (
                    garageMakes.map(make => (
                      <option key={make} value={make}>
                        {make}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label
                  htmlFor="country"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2"
                >
                  Country
                </label>
                <input
                  id="country"
                  type="text"
                  autoComplete="country"
                  value={homeAddress.country}
                  onChange={e =>
                    onAddressFieldChange('country', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 dark:bg-slate-700 dark:text-slate-100"
                  placeholder="US"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => void saveHomeAddress()}
            disabled={addressSaving}
            className="bg-slate-600 hover:bg-slate-700 disabled:bg-slate-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
          >
            {addressSaving ? 'Saving…' : 'Save Home Address'}
          </button>
          <button
            type="button"
            onClick={() => void findNearbyProviders()}
            disabled={providerLookupLoading}
            className="ml-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-medium py-2 px-4 rounded-md transition-colors duration-200 disabled:opacity-60"
          >
            {providerLookupLoading ? 'Finding…' : 'Find Nearby Services'}
          </button>
          {lastRecoverySnapshot && undoSecondsRemaining > 0 && (
            <button
              type="button"
              onClick={() => void undoRecoveryChanges()}
              disabled={providerLookupLoading}
              className="ml-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-medium py-2 px-4 rounded-md transition-colors duration-200 disabled:opacity-60"
            >
              {undoActionLabel} ({undoSecondsRemaining}s)
            </button>
          )}
        </div>
        {hasUsedBroadenAction && (
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Undo is available for 30 seconds after using a broaden search
            action.
          </div>
        )}

        {nearbyProviders.length > 0 && (
          <div className="mt-5 rounded-md border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <h6 className="font-semibold text-slate-900 dark:text-slate-100 m-0">
                Nearby Services ({preferredProviderRadiusMiles} mi,{' '}
                {providerTypeLabel})
              </h6>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Source: {providerLookupSource || 'unknown'}
              </span>
            </div>
            <div className="mb-3 text-xs text-slate-500 dark:text-slate-400">
              Garage context: {garageContextLabel}
            </div>
            <div className="space-y-3">
              {nearbyProviders.map(provider => (
                <div
                  key={provider.id}
                  className="rounded-md border border-slate-200 dark:border-slate-700 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {provider.name}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        {provider.type === 'dealership'
                          ? 'Dealership'
                          : 'Repair Shop'}{' '}
                        • {provider.distanceMiles} miles away
                      </div>
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Rating {provider.rating.toFixed(1)}
                    </div>
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                    {provider.address}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {provider.phone}
                  </div>
                  <div className="text-sm mt-1">
                    <a
                      href={provider.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-700 dark:text-slate-200 underline"
                    >
                      Visit website
                    </a>
                  </div>
                  {provider.specialties.length > 0 && (
                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      Specialties: {provider.specialties.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {hasProviderLookupRun &&
          nearbyProviders.length === 0 &&
          !providerLookupLoading && (
            <div className="mt-5 rounded-md border border-dashed border-slate-300 dark:border-slate-600 p-4 text-sm text-slate-600 dark:text-slate-400">
              No providers found within {preferredProviderRadiusMiles} miles.
              Try increasing the search radius.
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Garage context: {garageContextLabel}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void broadenSearchRadius()}
                  disabled={providerLookupLoading}
                  className="border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-medium py-1.5 px-3 rounded-md transition-colors duration-200 disabled:opacity-60"
                >
                  Search +15 miles
                </button>
                <button
                  type="button"
                  onClick={() => void broadenSearchFilters()}
                  disabled={providerLookupLoading}
                  className="border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-medium py-1.5 px-3 rounded-md transition-colors duration-200 disabled:opacity-60"
                >
                  Broaden all filters
                </button>
              </div>
            </div>
          )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="font-serif font-bold text-2xl text-slate-900 dark:text-slate-100 m-0">
          Change Password
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 mb-4">
          Update your password to keep your account secure.
        </p>
        <form onSubmit={onChangePassword} className="space-y-4">
          <div>
            <label
              htmlFor="currentPassword"
              className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2"
            >
              Current password
            </label>
            <input
              id="currentPassword"
              type="password"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 dark:bg-slate-700 dark:text-slate-100"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2"
            >
              New password
            </label>
            <input
              id="newPassword"
              type="password"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 dark:bg-slate-700 dark:text-slate-100"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2"
            >
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              type="password"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 dark:bg-slate-700 dark:text-slate-100"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <button
              type="submit"
              className="bg-slate-600 hover:bg-slate-700 disabled:bg-slate-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
              disabled={busy}
            >
              {busy ? 'Updating…' : 'Update password'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6 border-l-4 border-red-500 space-y-6">
        <h2 className="font-serif font-bold text-2xl text-red-700 dark:text-red-400 m-0">
          Delete Account
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-0 mb-0">
          Delete your account and all associated data. This action cannot be undone.
        </p>
        <div>
          <label
            htmlFor="currentPasswordDelete"
            className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2"
          >
            Confirm current password
          </label>
          <input
            id="currentPasswordDelete"
            type="password"
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-slate-700 dark:text-slate-100"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
          />
        </div>
        <div>
          <button
            className="bg-red-600 hover:bg-red-700 disabled:bg-slate-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
            onClick={onDeleteAccount}
            disabled={busy}
          >
            Delete account
          </button>
        </div>
      </div>
    </div>
  );
}
