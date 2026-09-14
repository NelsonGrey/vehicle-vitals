# Vehicle-Vitals — Design System & Color Palettes

Status as of **2026-09-14**: shipped and deployed on both web and mobile —
a shared typography/spacing/component vocabulary, plus a 5-palette color
switcher with a picker UI on both platforms. A short list of deliberate
scope limits is called out in §6, and §7 documents a real, unrelated
Firestore rules bug this work found and fixed along the way (deployed to
dev/staging/prod the same day, re-verified live).

This doc is the reference for how it's built and *why* — several of the
decisions below only look obvious in hindsight because a live bug proved
the alternative wrong. Where that happened, the reasoning is kept, not
just the conclusion, so the same mistake doesn't get re-made.

---

## 1. Typography & spacing scale

### Web (`packages/web/src/styles.css`)

Two parallel type scales, deliberately different, not the same rules
applied inconsistently:

| Class | Use | Style |
|---|---|---|
| `.content-h1/h2/h3` | Long-form marketing/help/legal pages | Serif (Playfair Display), roomier |
| `.content-body` / `.content-caption` | Same pages' body copy / captions | Serif context, sans body |
| `.ui-h1/h2/h3` | Authenticated app screens (cards, forms, dense lists) | Sans-serif (Inter), tighter |
| `.ui-label` | Small bold uppercase eyebrow labels | Sans, `text-xs font-semibold uppercase` |
| `.ui-body` | App-screen body text | Sans, `text-sm` |
| `.ui-hint` | App-screen captions/secondary text | Sans, `text-xs`, more muted |

Both scales share color tokens (headings `slate-900`/dark:`slate-100`,
secondary text `slate-600`/dark:`slate-400`) so hierarchy reads
consistently across both contexts.

**A real bug lived here for a while**: `.ui-h1/h2/h3` never set
`font-family`, so a global `h1,h2,h3,h4 { font-family: Playfair Display }`
rule silently won by default — every "ui" (sans-serif) heading, including
ones already shipped on `Profile.tsx`, was rendering in the serif
marketing font. Fixed 2026-09-14 by adding `font-sans` to those three
classes. Also found and fixed the same symptom baked directly into
`EditVehicle.tsx`'s `MaintenanceList` component (4 headings hardcoded
`font-serif` inside an otherwise-sans app screen).

Applied across `Home.tsx`, `Records.tsx`, `UpcomingTasks.tsx`,
`ServiceProviders.tsx`, `EditVehicle.tsx` — the classes existed before this
pass but were used piecemeal; call sites that didn't cleanly match one of
these classes (one-off microcopy, form `<label>`s, mini-card titles smaller
than `.ui-h3`) were deliberately left as literals rather than force-fit.

### Mobile (`packages/mobile/lib/theme/design_tokens.dart`)

`AppDesignTokens.space1` (4px) through `space20` (80px), `radiusBase/Lg/Xl`.
Screens now consistently use these constants instead of raw numeric
literals — 174 call sites across all 33 screen files were converted
2026-09-14 (only exact scale matches; off-scale custom values like 14, 10,
6, 2 were left as literals rather than forced onto the nearest token,
since that would change actual rendered spacing, not just code hygiene).

---

## 2. The 5 color palettes

Curated set, not an open picker — chosen by Mark from a
[published mockup canvas](https://claude.ai/code/artifact/c33697ec-ce29-4de3-8ab8-5beacf137d4f)
built from the mobile app's real Garage/Service History/Vehicle Detail
screens.

| id | Label | header | primary | brandAccent | bg | border | text | muted |
|---|---|---|---|---|---|---|---|---|
| `current` | Current (Slate & Blue) | `#334155` | `#334155` | `#2563EB` | `#F8FAFC` | `#E2E8F0` | `#0F172A` | `#64748B` |
| `cyanTeal` | Brand Cyan & Teal | `#020617` | `#0E7490` | `#0D9488` | `#FFFAF3` | `#DDEEF0` | `#0F172A` | `#64748B` |
| `indigo` | Deep Indigo | `#1E1B4B` | `#4338CA` | `#7C3AED` | `#F6F5FF` | `#E1DFF7` | `#1E1B2E` | `#6B6B85` |
| `forestCopper` | Workshop Forest & Copper | `#14532D` | `#166534` | `#C2410C` | `#F7F5F0` | `#E5E0D5` | `#1C1917` | `#766F6A`\* |
| `warmGraphite` | Warm Graphite & Copper | `#292524` | `#44403C` | `#C2703D` | `#FAFAF9` | `#E7E5E4` | `#1C1917` | `#78716C` |

`surface` is `#FFFFFF` for all 5 (that's why it's not in a mockup field
that varies — see §6 for the one place it does).

\* forestCopper's `muted` was nudged 2 units darker per channel from the
mockup's `#78716C` — that exact value measured 4.40:1 against this
palette's `bg`, just under WCAG AA's 4.5:1 floor for text. Imperceptible
visually, confirmed by a real contrast calculation, not a rounding guess.

**Semantic status colors never vary**: `danger #EF4444` / `warning #F59E0B`
/ `success #22C55E` (mobile: `AppDesignTokens.danger/warning/success`; web:
Tailwind's `danger`/`warning`/`accent` scales) carry meaning — vehicle
health-score thresholds, alert severity — and must render identically no
matter which palette is active. They are not part of a `PaletteDefinition`
at all.

**Source of truth, kept in lockstep by hand** (see §8 for why not a
generator):
- `packages/mobile/lib/theme/palettes.dart`
- `packages/web/src/theme/palettes.ts`
- `packages/web/src/styles.css`'s CSS variable blocks (light-mode values
  only — dark values are fixed, see §5)

---

## 3. Architecture

### Mobile

- `AppDesignTokens.currentPaletteId` — a mutable static holding "the
  active palette right now." `AppDesignTokens.colorScheme(brightness,
  [paletteId])` takes an *optional* palette id defaulting to this static.
  This exists because 7 files besides `app_theme.dart` call
  `AppDesignTokens.colorScheme(brightness)` directly (ad components,
  `marketing_welcome_screen.dart`, `home_screen.dart`,
  `upcoming_tasks_screen.dart`, `tailwind_utilities.dart`) — rather than
  thread an explicit `PaletteId` through all of them, the optional-default
  pattern makes them automatically palette-aware for free. `main.dart`'s
  `MaterialApp` is the one caller that passes the palette explicitly
  (sourced from `PaletteService` via Provider), which is both the
  authoritative path and what keeps the static in sync.
- `AppColorScheme.light(palette)` — reflects the **full** palette:
  background, surface, border, text, muted, primary, secondary
  (brandAccent) all come from `palette`. Each of the 5 reads as genuinely
  distinct, not just a different button color.
- `AppColorScheme.dark(palette)` — reflects the palette in **name only**;
  every field it returns is a fixed, pre-palette value. See §5 for why.
- `AppDesignTokens.headerColor` — a *getter* (`kPalettes[currentPaletteId]!.header`),
  not a constant, so the 3 existing call sites (`app_theme.dart` ×2,
  `brand_app_bar.dart`) needed zero changes to become palette-aware.
- `PaletteService` (`packages/mobile/lib/services/palette_service.dart`) —
  a `ChangeNotifier` mirroring `EmailReminderService`'s direct Firestore
  read/write and `PremiumService`'s `ChangeNotifierProxyProvider`/
  `syncForAuthUser(uid)` registration pattern in `main.dart`.

### Web

- CSS custom properties in `styles.css`, repointed via
  `tailwind.config.js`'s `theme.extend.colors` (`slate.50/200/500/600/700/900`
  and a new `blue.600/700` override — every other step stays literal
  Tailwind, unaffected). This achieves full palette theming with **zero
  call-site changes** across the ~2,772 existing `slate-*` utility class
  usages.
- **The collision that made this non-trivial**: those same slate step
  numbers are independently reused inside `dark:` variants for unrelated
  purposes — `dark:border-slate-700` alone appears 222 times,
  `dark:bg-slate-700` 89 times, `dark:text-slate-300` ~135 times — none of
  which have anything to do with the palette's primary color. The fix:
  each CSS variable has a *different* value inside
  `@media (prefers-color-scheme: dark)` than at `:root`, so the light-mode
  (palette-driven) and dark-mode (fixed) values coexist without touching a
  single component file.
- **A genuine gotcha found here**: `@media` only gates *whether* a rule is
  a cascade candidate — it does not win cascade ties on its own. The first
  version of the dark-mode "pin" block was declared *before* the
  `[data-palette="X"]` blocks in source order and silently lost every
  time (confirmed via a live browser check, not assumed). The fix was
  purely reordering: the dark-mode pin block must be declared **last**.
- `ThemeContext.tsx` (`packages/web/src/shared/`) — mirrors
  `AuthContext.tsx`'s provider shape; sets `document.documentElement.dataset.palette`
  and reads/writes the Firestore fields below.

---

## 4. Data model

One flat addition to the existing `users/{uid}` document (no new
subcollection — see §7's note on why that document needed its own rule
fix, and why scattering preferences elsewhere was a mistake not worth
repeating):

```
{
  paletteLinked: boolean,
  paletteWeb: 'current' | 'cyanTeal' | 'indigo' | 'forestCopper' | 'warmGraphite',
  paletteMobile: 'current' | 'cyanTeal' | 'indigo' | 'forestCopper' | 'warmGraphite',
}
```

**Reads never branch** — each platform always reads only its own field
(`paletteWeb` / `paletteMobile`). `paletteLinked` only changes what a
*write* does: while linked, picking a palette on either platform writes
**both** fields to the same value in one call; while unlinked, it writes
only that platform's field. Toggling `paletteLinked` **on** immediately
snaps both fields to the toggling platform's current value, so linking
never leaves them silently mismatched until the next manual pick.

Reads happen once at sign-in (mirrors `EmailReminderService`), not via a
live listener — this is cosmetic state with one low-cost concurrent-edit
scenario (two open sessions), unlike vehicle data where a listener earns
its keep.

---

## 5. Dark mode: 100% fixed regardless of palette

This is the one rule worth internalizing before touching this system:
**in dark mode, nothing varies by palette except mobile's AppBar header.**
Not a starting assumption — the result of two independent bugs found via
direct verification during implementation, not by inspection:

1. **The slate-700 collision** (§3, web) — making that step vary in dark
   mode repainted 300+ unrelated structural usages elsewhere.
2. **A WCAG contrast failure** (mobile, but the same root cause hit web) —
   `primary`/`secondary` were briefly made palette-aware in dark mode too
   (buttons, links, badges), which looked reasonable and initially passed
   review. A real contrast audit caught that `primary` doubles as both a
   button-background color (fine, paired with white — 10.35:1) **and** a
   bare heading-text color rendered directly on `background` in
   `AppTheme`'s `textTheme` (not fine — measured as low as **1.72:1**
   where normal text needs 4.5:1). A color dark/saturated enough to work
   as a button fill is, by definition, often too dark to read as text on
   an equally-dark background. Untangling "used as a fill" from "used as
   bare text" would need call-site changes beyond a palette-plumbing pass,
   so both platforms revert dark mode to its exact pre-palette values
   instead. `packages/mobile/test/palette_theme_test.dart` has a
   permanent WCAG-contrast regression test for this.

Mobile's `AppBar` header is the one verified-safe exception: it's a
surface, always paired with fixed white foreground text (measured
5.17:1–20.17:1 across all 5 palettes), never used as bare text — so
`headerColor` still varies by palette in dark mode. Web has no equivalent
colored header surface at all (its nav bar is neutral `bg-slate-50
dark:bg-slate-900` even today), so web's dark mode is fully
palette-invariant with no exception.

---

## 6. Known limitations / deliberately deferred

- **Dark-mode primary buttons don't vary by palette** (either platform).
  On web this is because buttons use `dark:bg-slate-300`, a step reused
  ~135 times elsewhere for ordinary muted text (its own, separately
  collision-prone case). On mobile it's the §5 contrast finding. Fixing
  this needs a small, bounded call-site migration of just the button
  pattern — not attempted here.
- **White-on-solid-`brandAccent` contrast is borderline for 2 of 5
  palettes** — cyanTeal and warmGraphite measure 3.70–3.74:1 (need 4.5:1
  for small text; both clear the 3:1 floor for large text/icons). Left
  as-is rather than re-editing already-approved mockup colors, since the
  accent is used mostly as a low-opacity tint in this app, not a solid
  fill with white text — the practical impact looks low, but it's a real,
  measured gap worth knowing about if a future feature adds a solid-accent
  button or badge.
- **Border-vs-background contrast (~1.2:1) is below the WCAG 3:1
  UI-component guideline** — true for every palette *including* the
  "Current" baseline, so this is a pre-existing app characteristic, not
  something the palette work introduced or regressed.
- **Mobile has no supported web build target** — `flutter run -d
  web-server` fails at `MobileAds.instance.initialize()` (the Google
  Mobile Ads plugin has no web implementation), so the mobile Appearance
  screen could not be visually screenshotted the way every other UI change
  this session was. It's covered by `flutter analyze` + widget/unit tests
  + pattern-matching against already-proven UI (`ChoiceChip` selection,
  `SwitchListTile`), not by an actual rendered screenshot.
- **Web's `.ui-*`/`.content-*` scale wasn't force-applied everywhere** —
  one-off microcopy, form `<label>`s, and mini-card titles smaller than
  `.ui-h3` were deliberately left as literal Tailwind classes rather than
  bent to fit a class that doesn't quite match, on both platforms.

---

## 7. A real, pre-existing bug was found, fixed, and deployed

While wiring the web palette picker, saving a preference failed with
`FirebaseError: Missing or insufficient permissions`. Root cause, verified
against a real Firestore emulator run (not inferred):
`firebase/firestore.rules`' rule for `users/{userId}/{document=**}` calls
`document.size()` — and that wildcard capture is **empty** for the exact
`users/{userId}` document itself, which throws a runtime "Function not
found" error that **denies the write outright** rather than merely
skipping the quota/subscription check it was meant to gate.

**This is not new** — it silently broke *every* direct write to that
document, including the already-shipped
`EmailReminderService.updateEmailPreferences` toggle. It had simply never
been caught because nothing had exercised it under test before.

Fixed by splitting `users/{userId}` into its own unconditional rule,
separate from the recursive rule that still correctly protects
`quotas`/`subscription`:

```
match /users/{userId} {
  allow read, write: if isSelf(userId);
}
match /users/{userId}/{document=**} {
  allow read: if isSelf(userId);
  allow write: if isSelf(userId)
    && !(document.size() > 0 && document[0] in ['quotas', 'subscription']);
}
```

Verified via `@firebase/rules-unit-testing` against the real rules file:
`packages/web/tests/firestoreRules.topLevelUserDoc.test.js` (5 new tests)
plus the pre-existing `firestoreRules.quotaSubscription.test.js` (5 tests,
confirming no regression to the protection those carve-outs exist for).

**Deployed to dev, staging, and prod on 2026-09-14**
(`firebase deploy --only firestore:rules`) and re-verified live against
the real `vehicle-vitals-dev` project immediately after — signed up a
fresh test account, saved a palette preference through the actual running
app, zero permission errors.

---

## 8. Extending: adding a 6th palette

1. Design it (mockup, get it approved — don't skip this; every value in
   the current 5 was reviewed, not generated).
2. Add the id + hex values to **both**
   `packages/mobile/lib/theme/palettes.dart` and
   `packages/web/src/theme/palettes.ts` — identical id string, identical
   hex.
3. Add a `[data-palette="newId"] { --vv-slate-50: ...; }` block to
   `packages/web/src/styles.css`, placed with the other palette blocks
   (i.e. *before* the trailing `@media (prefers-color-scheme: dark)` pin
   block — order matters, see §3).
4. Run `flutter test test/palette_theme_test.dart` — it iterates
   `PaletteId.values` automatically and will WCAG-contrast-check the new
   palette's light-mode values for free. Fix any failure the way §2's
   footnote did, don't lower the test's threshold.
5. No codegen step exists on purpose: 5 (soon 6) palettes, each a
   deliberate design decision, isn't worth a JSON→Dart/TS build pipeline
   for a solo maintainer. The two files are the source of truth; keep them
   in lockstep by hand and by review, not by generator.
