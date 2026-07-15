import 'package:flutter/material.dart';

/// Ports the web app's StackedVLogo (src/components/StackedVLogo.tsx) so
/// the brand mark is visually identical on both platforms. There's no
/// vector source for the mark anywhere in the repo -- it's raster artwork
/// on web too -- so this bundles the same PNGs and reproduces the same
/// layout logic rather than drawing new art.
class AppLogo extends StatelessWidget {
  const AppLogo({
    super.key,
    this.size = 32,
    this.compact = false,
    this.showText = true,
    this.isLight = false,
    this.wordmarkColor,
    this.full = false,
  });

  final double size;
  final bool compact;
  final bool showText;

  /// Uses the complete square app icon (roof, gauge, road, and document
  /// badge) instead of the cropped header/footer nav mark. The nav mark
  /// is deliberately cropped for tight header/footer space (see below);
  /// full-screen contexts like login/signup have room to show the whole
  /// icon and shouldn't look cut off.
  final bool full;

  /// Selects the light-background vs. dark-background mark variant.
  /// Explicit on mobile rather than sniffing a color string, since Dart
  /// doesn't need the same implicit-color-detection trick the web
  /// component uses.
  final bool isLight;
  final Color? wordmarkColor;

  // The mark is a simplified crop of the master icon (roof + gauge only),
  // not square -- this is its fixed source aspect ratio, matching
  // StackedVLogo.tsx's MARK_ASPECT_RATIO exactly.
  static const double _markAspectRatio = 569 / 340;

  @override
  Widget build(BuildContext context) {
    final assetPath = full
        ? 'assets/branding/vehicle-vitals-icon-full.png'
        : isLight
            ? 'assets/branding/vehicle-vitals-header-mark-light.png'
            : 'assets/branding/vehicle-vitals-header-mark.png';
    final width = full ? size : size * _markAspectRatio;

    final mark = Image.asset(
      assetPath,
      width: width,
      height: size,
      fit: BoxFit.contain,
    );

    if (!showText) return mark;

    final resolvedWordmarkColor = wordmarkColor ?? const Color(0xFF64748B);
    final compactFontSize = size * 0.3 < 14
        ? 14.0
        : (size * 0.3).round().toDouble();

    final wordmark = compact
        ? Text(
            'Vehicle-Vitals',
            style: TextStyle(
              color: resolvedWordmarkColor,
              fontSize: compactFontSize,
              fontWeight: FontWeight.w700,
              letterSpacing: compactFontSize * -0.025,
            ),
          )
        : Text(
            'VEHICLE\nVITALS',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: resolvedWordmarkColor,
              fontWeight: FontWeight.w700,
              letterSpacing: 1.2,
            ),
          );

    return compact
        ? Row(
            mainAxisSize: MainAxisSize.min,
            children: [mark, const SizedBox(width: 8), wordmark],
          )
        : Column(
            mainAxisSize: MainAxisSize.min,
            children: [mark, const SizedBox(height: 4), wordmark],
          );
  }
}
