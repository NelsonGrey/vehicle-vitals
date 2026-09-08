import 'package:flutter/material.dart';

import '../theme/design_tokens.dart';
import 'ad_banner.dart';

const bool _screenshotMode = bool.fromEnvironment('VV_SCREENSHOT_MODE');

/// The ad slot every [BrandScaffold] screen anchors directly beneath its
/// header. A plain body widget (not an AppBar `bottom`), so it sizes to
/// whatever the ad actually needs -- loading spinner, placeholder text, or
/// the loaded ad -- instead of a fixed height guessed up front. The padding
/// on all sides keeps it visually its own boxed section rather than bleeding
/// into the header above or the screen content below.
class BrandAdCard extends StatelessWidget {
  const BrandAdCard({super.key});

  @override
  Widget build(BuildContext context) {
    if (_screenshotMode) return const SizedBox.shrink();
    final colors = AppDesignTokens.colorScheme(Theme.of(context).brightness);
    return Container(
      color: colors.background,
      padding: const EdgeInsets.symmetric(
        vertical: 10,
        horizontal: AppDesignTokens.space3,
      ),
      child: Container(
        decoration: BoxDecoration(
          color: colors.surface,
          borderRadius: BorderRadius.circular(AppDesignTokens.radiusBase),
          border: Border.all(color: colors.border),
        ),
        alignment: Alignment.center,
        clipBehavior: Clip.antiAlias,
        padding: const EdgeInsets.all(8),
        child: const AdBanner(margin: EdgeInsets.zero),
      ),
    );
  }
}
