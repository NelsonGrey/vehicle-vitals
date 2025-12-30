// Simple VPIC client with in-memory caching

const makesCache = { list: null, fetchedAt: 0 };
const modelsCache = new Map(); // key: `${make}|${year}` -> { list, fetchedAt }

const VPIC_BASE = 'https://vpic.nhtsa.dot.gov/api/vehicles';

function normalizeName(s) {
  return (s || '').trim();
}

export function clearCache() {
  makesCache.list = null;
  makesCache.fetchedAt = 0;
  modelsCache.clear();
}

export async function fetchAllMakes() {
  if (
    makesCache.list &&
    Date.now() - makesCache.fetchedAt < 24 * 60 * 60 * 1000
  ) {
    return makesCache.list;
  }
  const url = `${VPIC_BASE}/GetAllMakes?format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load makes');
  const data = await res.json();
  const list = (data?.Results || [])
    .map(r => normalizeName(r?.Make_Name))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
  makesCache.list = list;
  makesCache.fetchedAt = Date.now();
  return list;
}

export async function fetchModelsForMakeYear(make, year) {
  const m = normalizeName(make);
  const y = String(year || '').trim();
  if (!m || !y) return [];
  const key = `${m}|${y}`;
  const cached = modelsCache.get(key);
  if (cached && Date.now() - cached.fetchedAt < 24 * 60 * 60 * 1000)
    return cached.list;

  const url = `${VPIC_BASE}/GetModelsForMakeYear/make/${encodeURIComponent(m)}/modelyear/${encodeURIComponent(y)}?format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load models');
  const data = await res.json();
  const list = Array.from(
    new Set(
      (data?.Results || [])
        .map(r => normalizeName(r?.Model_Name))
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));
  modelsCache.set(key, { list, fetchedAt: Date.now() });
  return list;
}

export function getYearOptions(start = 1980) {
  const now = new Date().getFullYear();
  const years = [];
  for (let y = now; y >= start; y--) years.push(String(y));
  return years;
}
