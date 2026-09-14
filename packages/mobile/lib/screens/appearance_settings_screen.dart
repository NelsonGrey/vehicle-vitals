import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../components/brand_scaffold.dart';
import '../services/palette_service.dart';
import '../theme/design_tokens.dart';
import '../theme/palettes.dart';

class AppearanceSettingsScreen extends StatelessWidget {
  const AppearanceSettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final paletteService = context.watch<PaletteService>();
    final colorScheme = Theme.of(context).colorScheme;

    return BrandScaffold(
      title: const Text('Appearance'),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppDesignTokens.space4),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Color Palette',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: AppDesignTokens.space2),
              Text(
                'Choose a look for the app. Health-score colors (green, '
                'amber, red) always stay the same no matter which palette '
                'you pick.',
                style: TextStyle(
                  fontSize: 13,
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: AppDesignTokens.space4),
              for (final id in PaletteId.values) ...[
                _PaletteOptionCard(
                  id: id,
                  selected: paletteService.paletteId == id,
                  onTap: () => paletteService.setPalette(id),
                ),
                const SizedBox(height: AppDesignTokens.space3),
              ],
              const SizedBox(height: AppDesignTokens.space2),
              Card(
                child: SwitchListTile(
                  title: const Text('Keep web and mobile in sync'),
                  subtitle: const Text(
                    'When on, changing the palette here also updates it on '
                    'vehicle-vitals.com, and vice versa.',
                  ),
                  value: paletteService.linked,
                  onChanged: (value) => paletteService.setLinked(value),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PaletteOptionCard extends StatelessWidget {
  const _PaletteOptionCard({
    required this.id,
    required this.selected,
    required this.onTap,
  });

  final PaletteId id;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final palette = kPalettes[id]!;
    final colorScheme = Theme.of(context).colorScheme;

    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppDesignTokens.radiusLg),
        side: BorderSide(
          color: selected ? colorScheme.primary : colorScheme.outline,
          width: selected ? 2 : 1,
        ),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(AppDesignTokens.radiusLg),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(AppDesignTokens.space3),
          child: Row(
            children: [
              _SwatchStrip(palette: palette),
              const SizedBox(width: AppDesignTokens.space3),
              Expanded(
                child: Text(
                  palette.label,
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
              ),
              Icon(
                selected ? Icons.check_circle : Icons.radio_button_unchecked,
                color: selected ? colorScheme.primary : colorScheme.outline,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// A small preview of a palette's header/primary/brandAccent/bg colors,
/// so a user can tell the options apart without applying each one.
class _SwatchStrip extends StatelessWidget {
  const _SwatchStrip({required this.palette});

  final PaletteDefinition palette;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(AppDesignTokens.radiusBase),
      child: SizedBox(
        width: 56,
        height: 40,
        child: Column(
          children: [
            Expanded(child: Container(color: palette.header)),
            Expanded(
              child: Row(
                children: [
                  Expanded(child: Container(color: palette.primary)),
                  Expanded(child: Container(color: palette.brandAccent)),
                  Expanded(child: Container(color: palette.bg)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
