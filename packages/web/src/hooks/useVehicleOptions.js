import { useEffect, useMemo, useState } from 'react';
import { fetchAllMakes, fetchModelsForMakeYear, getYearOptions } from '../utils/vpicService';

export default function useVehicleOptions({ year, make }) {
  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);
  const [loadingMakes, setLoadingMakes] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [error, setError] = useState('');

  const years = useMemo(() => getYearOptions(), []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoadingMakes(true);
        const list = await fetchAllMakes();
        if (alive) setMakes(list);
      } catch (e) {
        if (alive) setError(e?.message || 'Failed to load makes');
      } finally {
        if (alive) setLoadingMakes(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    if (!year || !make) {
      setModels([]);
      return () => { alive = false; };
    }
    (async () => {
      try {
        setLoadingModels(true);
        const list = await fetchModelsForMakeYear(make, year);
        if (alive) setModels(list);
      } catch (e) {
        if (alive) setError(e?.message || 'Failed to load models');
      } finally {
        if (alive) setLoadingModels(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [year, make]);

  return { years, makes, models, loadingMakes, loadingModels, error };
}
