import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../theme/design_tokens.dart';

/// Standard header for every screen. Uses AppBar's default behavior of
/// painting its background through the status bar safe area as well as the
/// toolbar row, so the whole top band -- status bar plus title row -- reads
/// as one continuous brand-colored surface.
///
/// Pure navigation chrome only -- no ad logic here. Use [BrandScaffold]
/// rather than constructing this directly; it pairs this with the ad card
/// in the body, where variable-height content belongs.
class BrandAppBar extends StatelessWidget implements PreferredSizeWidget {
  const BrandAppBar({
    super.key,
    this.title,
    this.actions,
    this.leading,
    this.automaticallyImplyLeading = true,
    this.bottom,
  });

  final Widget? title;
  final List<Widget>? actions;
  final Widget? leading;
  final bool automaticallyImplyLeading;
  final PreferredSizeWidget? bottom;

  @override
  Size get preferredSize => Size.fromHeight(
    AppDesignTokens.headerToolbarHeight + (bottom?.preferredSize.height ?? 0),
  );

  @override
  Widget build(BuildContext context) {
    return AppBar(
      title: title,
      actions: actions,
      leading: leading,
      automaticallyImplyLeading: automaticallyImplyLeading,
      bottom: bottom,
      toolbarHeight: AppDesignTokens.headerToolbarHeight,
      backgroundColor: AppDesignTokens.headerColor,
      foregroundColor: Colors.white,
      elevation: 0,
      // headerColor is a fixed dark navy in both app themes, so white
      // status bar icons stay legible against it either way.
      systemOverlayStyle: SystemUiOverlayStyle.light,
    );
  }
}
