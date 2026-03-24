export type WebAdPlacement = 'header' | 'inlineAuth' | 'inlineContent';

const fallbackSlot = String(import.meta.env.VITE_ADSENSE_SLOT || '').trim();

const placementSlotMap: Record<WebAdPlacement, string> = {
  header: String(import.meta.env.VITE_ADSENSE_SLOT_HEADER || '').trim(),
  inlineAuth: String(
    import.meta.env.VITE_ADSENSE_SLOT_INLINE_AUTH || ''
  ).trim(),
  inlineContent: String(
    import.meta.env.VITE_ADSENSE_SLOT_INLINE_CONTENT || ''
  ).trim(),
};

export function getAdSlot(placement: WebAdPlacement): string {
  return placementSlotMap[placement] || fallbackSlot;
}
