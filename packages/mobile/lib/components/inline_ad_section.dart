import 'package:flutter/material.dart';

import '../theme/design_tokens.dart';
import 'ad_banner.dart';

enum MobileAdPlacement { inlineAuth, inlineContent }

class InlineAdSection extends StatelessWidget {
  final MobileAdPlacement placement;
  final String label;
  final EdgeInsets? margin;

  const InlineAdSection({
    super.key,
    this.placement = MobileAdPlacement.inlineContent,
    this.label = 'Sponsored',
    this.margin,
  });

  static const String _inlineAuthAdUnitId = String.fromEnvironment(
    'ADMOB_INLINE_AUTH_UNIT_ID',
    defaultValue: '',
  );

  static const String _inlineContentAdUnitId = String.fromEnvironment(
    'ADMOB_INLINE_CONTENT_UNIT_ID',
    defaultValue: '',
  );

  String? _adUnitForPlacement() {
    switch (placement) {
      case MobileAdPlacement.inlineAuth:
        return _inlineAuthAdUnitId.isNotEmpty ? _inlineAuthAdUnitId : null;
      case MobileAdPlacement.inlineContent:
        return _inlineContentAdUnitId.isNotEmpty
            ? _inlineContentAdUnitId
            : null;
    }
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = AppDesignTokens.colorScheme(
      Theme.of(context).brightness,
    );

    return Container(
      margin: margin ?? const EdgeInsets.only(bottom: AppDesignTokens.space4),
      padding: const EdgeInsets.all(AppDesignTokens.space3),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(AppDesignTokens.radiusLg),
        border: Border.all(color: colorScheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: colorScheme.muted,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.6,
            ),
          ),
          const SizedBox(height: AppDesignTokens.space2),
          AdBanner(adUnitId: _adUnitForPlacement(), margin: EdgeInsets.zero),
        ],
      ),
    );
  }
}
