import * as logger from "firebase-functions/logger";
import { onDocumentCreated } from "firebase-functions/v2/firestore";

// Self-heals a newly-created vehicle's documentPortfolio against the
// canonical template (packages/shared/src/vehiclePortfolio.js) so both
// client-side copies (packages/shared's own, and mobile's
// firestore_service.dart._createStandardVehiclePortfolio) only need to
// serve as an optimistic offline-create seed — any category/item they're
// missing or have wrong gets reconciled here once the create syncs,
// rather than requiring a synced release across both apps whenever the
// template changes.
//
// Reconciliation is additive-only: an existing category/item is left
// exactly as the client wrote it (never overwritten), and only a
// completely absent category/item gets filled in from the canonical
// template. This is deliberate — onDocumentCreated only fires once per
// document, so in practice there's rarely any existing user progress to
// preserve at this point, but merging defensively means this can never
// destroy uploaded files/notes/status even if that assumption changes.

interface PortfolioItem {
  id: string;
  [key: string]: unknown;
}

interface PortfolioCategory {
  key: string;
  items: PortfolioItem[];
  [key: string]: unknown;
}

interface Portfolio {
  categories: PortfolioCategory[];
  [key: string]: unknown;
}

/**
 * Merges a vehicle's existing documentPortfolio against the canonical
 * template, adding any category/item the existing portfolio is missing
 * without touching anything that's already there.
 * @param {Portfolio | undefined} existing The vehicle's current
 *   documentPortfolio, if any.
 * @param {Portfolio} canonical The canonical template.
 * @return {{ changed: boolean; portfolio: Portfolio }} Whether a
 *   reconciliation was needed, and the resulting portfolio either way.
 */
function reconcilePortfolio(
  existing: Portfolio | undefined,
  canonical: Portfolio
): { changed: boolean; portfolio: Portfolio } {
  if (!existing || !Array.isArray(existing.categories)) {
    return { changed: true, portfolio: canonical };
  }

  let changed = false;
  const existingCategoriesByKey = new Map(
    existing.categories.map((category) => [category.key, category])
  );

  const categories = canonical.categories.map((canonicalCategory) => {
    const existingCategory = existingCategoriesByKey.get(
      canonicalCategory.key
    );
    if (!existingCategory) {
      changed = true;
      return canonicalCategory;
    }

    const existingItemsById = new Map(
      (existingCategory.items || []).map((item) => [item.id, item])
    );
    const items = canonicalCategory.items.map((canonicalItem) => {
      const existingItem = existingItemsById.get(canonicalItem.id);
      if (!existingItem) {
        changed = true;
        return canonicalItem;
      }
      return existingItem;
    });

    return { ...existingCategory, items };
  });

  return {
    changed,
    portfolio: changed ? { ...existing, categories } : existing,
  };
}

/**
 * Reconciles a single vehicle doc's documentPortfolio against the
 * canonical template, writing back only if something was actually
 * missing.
 * @param {FirebaseFirestore.DocumentReference | undefined} vehicleRef
 *   Vehicle doc ref.
 * @return {Promise<void>}
 */
export async function selfHealPortfolio(
  vehicleRef: FirebaseFirestore.DocumentReference | undefined
): Promise<void> {
  if (!vehicleRef) return;

  const snap = await vehicleRef.get();
  if (!snap.exists) return;
  const data = snap.data() || {};

  const { createStandardVehiclePortfolio } = await import(
    "@vehicle-vitals/shared/vehiclePortfolio"
  );
  const canonical = createStandardVehiclePortfolio();
  const { changed, portfolio } = reconcilePortfolio(
    data.documentPortfolio,
    canonical
  );

  if (!changed) return;

  await vehicleRef.set(
    { documentPortfolio: JSON.parse(JSON.stringify(portfolio)) },
    { merge: true }
  );

  logger.info("Vehicle document portfolio self-healed", {
    path: vehicleRef.path,
  });
}

export const onUserVehicleCreatedPortfolioSelfHeal = onDocumentCreated(
  "users/{userId}/vehicles/{vin}",
  async (event) => {
    await selfHealPortfolio(event.data?.ref);
  }
);

export const onOrgVehicleCreatedPortfolioSelfHeal = onDocumentCreated(
  "orgs/{orgId}/vehicles/{vin}",
  async (event) => {
    await selfHealPortfolio(event.data?.ref);
  }
);
