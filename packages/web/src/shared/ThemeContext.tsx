import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { PaletteId, paletteIdFromValue } from '../theme/palettes';
import { useAuth } from './AuthContext';

async function loadFirestore() {
  const [{ db }, firestore] = await Promise.all([
    import('./firebaseConfig'),
    import('firebase/firestore'),
  ]);
  return { db, ...firestore };
}

interface ThemeContextType {
  paletteId: PaletteId;
  linked: boolean;
  setPalette: (id: PaletteId) => void;
  setLinked: (value: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  paletteId: 'current',
  linked: false,
  setPalette: () => {},
  setLinked: () => {},
});

interface ThemeProviderProps {
  children: React.ReactNode;
}

// Mirrors AuthContext's provider shape and PaletteService's (mobile)
// read/write semantics: every read is always "read my own platform's
// field" (`paletteWeb`) -- this never branches on `linked`. `linked` only
// changes what a *write* does: while linked, picking a palette here also
// writes `paletteMobile` to the same value in the same call, so the two
// platforms' fields never drift out of sync silently. See
// project-global-stylesheet-todo memory for the full data-model rationale.
export function ThemeProvider({ children }: ThemeProviderProps) {
  const { user } = useAuth();
  const [paletteId, setPaletteIdState] = useState<PaletteId>('current');
  const [linked, setLinkedState] = useState(false);
  const lastSyncedUidRef = useRef<string | null | undefined>(undefined);
  // Set as soon as the user makes a local edit, so a slower in-flight
  // initial-sync read can't resolve afterward and clobber it with stale
  // server data (setPalette/setLinked have already queued the write that
  // will make the server catch up).
  const hasLocalEditRef = useRef(false);

  // Signing out drops back to the baseline palette. Done while rendering (the
  // React-recommended way to reset state on a prop change) rather than in an
  // effect, which would cause a cascading re-render.
  const currentUid = user?.uid ?? null;
  const [prevUid, setPrevUid] = useState(currentUid);
  if (prevUid !== currentUid) {
    setPrevUid(currentUid);
    if (!currentUid) {
      setPaletteIdState('current');
      setLinkedState(false);
    }
  }

  useEffect(() => {
    document.documentElement.dataset.palette = paletteId;
  }, [paletteId]);

  useEffect(() => {
    const uid = user?.uid ?? null;
    if (uid === lastSyncedUidRef.current) {
      return;
    }
    lastSyncedUidRef.current = uid;
    hasLocalEditRef.current = false;

    if (!uid) {
      return;
    }

    let isActive = true;
    void (async () => {
      try {
        const { db, doc, getDoc } = await loadFirestore();
        const snap = await getDoc(doc(db, `users/${uid}`));
        if (!isActive || hasLocalEditRef.current) return;
        const data = snap.data() ?? {};
        setPaletteIdState(paletteIdFromValue(data.paletteWeb));
        setLinkedState(Boolean(data.paletteLinked));
      } catch {
        // Non-fatal: keep showing the baseline palette rather than
        // blocking the page on a failed read.
      }
    })();

    return () => {
      isActive = false;
    };
  }, [user]);

  const setPalette = useCallback(
    (id: PaletteId) => {
      hasLocalEditRef.current = true;
      setPaletteIdState(id);

      const uid = user?.uid;
      if (!uid) return;

      void (async () => {
        const { db, doc, serverTimestamp, setDoc } = await loadFirestore();
        const update: Record<string, unknown> = {
          paletteWeb: id,
          updatedAt: serverTimestamp(),
        };
        if (linked) {
          update.paletteMobile = id;
        }
        await setDoc(doc(db, `users/${uid}`), update, { merge: true });
      })();
    },
    [user, linked]
  );

  const setLinked = useCallback(
    (value: boolean) => {
      hasLocalEditRef.current = true;
      setLinkedState(value);

      const uid = user?.uid;
      if (!uid) return;

      void (async () => {
        const { db, doc, serverTimestamp, setDoc } = await loadFirestore();
        const update: Record<string, unknown> = {
          paletteLinked: value,
          updatedAt: serverTimestamp(),
        };
        if (value) {
          update.paletteMobile = paletteId;
        }
        await setDoc(doc(db, `users/${uid}`), update, { merge: true });
      })();
    },
    [user, paletteId]
  );

  const value = useMemo(
    () => ({ paletteId, linked, setPalette, setLinked }),
    [paletteId, linked, setPalette, setLinked]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
