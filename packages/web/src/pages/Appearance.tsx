import { PALETTE_IDS, PALETTES, type PaletteId } from '../theme/palettes';
import { useTheme } from '../shared/ThemeContext';

function PaletteSwatch({ id }: { id: PaletteId }) {
  const palette = PALETTES[id];
  return (
    <div
      className="grid grid-cols-3 gap-0.5 rounded-md overflow-hidden border border-slate-200 dark:border-slate-700"
      style={{ width: 56, height: 40 }}
    >
      <div
        className="col-span-3"
        style={{ backgroundColor: palette.header, height: 20 }}
      />
      <div style={{ backgroundColor: palette.primary }} />
      <div style={{ backgroundColor: palette.brandAccent }} />
      <div style={{ backgroundColor: palette.bg }} />
    </div>
  );
}

export function AppearanceContent() {
  const { paletteId, linked, setPalette, setLinked } = useTheme();

  return (
    <div className="space-y-4">
      <div>
        <h3 className="ui-h3 mb-1">Color Palette</h3>
        <p className="ui-hint">
          Choose a look for the app. Health-score colors (green, amber, red)
          always stay the same no matter which palette you pick.
        </p>
      </div>

      <div className="space-y-2">
        {PALETTE_IDS.map(id => {
          const palette = PALETTES[id];
          const isSelected = id === paletteId;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setPalette(id)}
              aria-current={isSelected}
              className={`w-full flex items-center gap-3 text-left rounded-lg border p-3 transition-colors ${
                isSelected
                  ? 'border-slate-500 bg-slate-100 dark:border-slate-300 dark:bg-slate-700'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/70'
              }`}
            >
              <PaletteSwatch id={id} />
              <span className="flex-1 font-medium text-slate-900 dark:text-slate-100">
                {palette.label}
              </span>
              {isSelected && (
                <span
                  className="text-sm font-medium"
                  style={{ color: palette.primary }}
                >
                  Selected
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
        <label className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200">
          <span>
            Keep web and mobile in sync
            <span className="block ui-hint mt-0.5">
              When on, changing the palette here also updates it on the
              mobile app, and vice versa.
            </span>
          </span>
          <input
            type="checkbox"
            checked={linked}
            onChange={event => setLinked(event.target.checked)}
          />
        </label>
      </div>
    </div>
  );
}
