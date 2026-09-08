import 'package:flutter/material.dart';

import 'brand_ad_card.dart';
import 'brand_app_bar.dart';

/// Standard screen chrome: a [BrandAppBar] plus the [BrandAdCard] anchored
/// directly beneath it, outside the body's own scrolling -- so the ad slot
/// stays in the same place on every screen that uses it. Mirrors the
/// AppScaffold pattern from the sibling wishlist-wizard app: the ad lives in
/// the body (natural sizing, easy per-screen opt-out) rather than inside the
/// AppBar's `bottom`, which is really meant for compact, fixed-height
/// controls like a TabBar.
///
/// Set [showAd] to false for screens where an ad would detract (payment,
/// auth, the subscription upsell itself).
class BrandScaffold extends StatelessWidget {
  const BrandScaffold({
    super.key,
    this.title,
    this.actions,
    this.leading,
    this.automaticallyImplyLeading = true,
    this.bottom,
    required this.body,
    this.bottomNavigationBar,
    this.showAd = true,
  });

  final Widget? title;
  final List<Widget>? actions;
  final Widget? leading;
  final bool automaticallyImplyLeading;

  /// A screen-specific AppBar bottom, e.g. a TabBar. Rendered below the
  /// title row, above the ad card.
  final PreferredSizeWidget? bottom;

  final Widget body;
  final Widget? bottomNavigationBar;
  final bool showAd;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: BrandAppBar(
        title: title,
        actions: actions,
        leading: leading,
        automaticallyImplyLeading: automaticallyImplyLeading,
        bottom: bottom,
      ),
      body: Column(
        children: [
          if (showAd) const BrandAdCard(),
          Expanded(child: body),
        ],
      ),
      bottomNavigationBar: bottomNavigationBar,
    );
  }
}
