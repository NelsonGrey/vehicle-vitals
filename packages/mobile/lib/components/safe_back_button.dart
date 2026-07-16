import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// AppBar leading button for form/task screens: pops when there's a
/// screen to return to, otherwise falls back to a known-safe route.
/// Using this instead of the default back arrow means the screen can
/// never strand the user, even if it's ever reached without a prior
/// push (e.g. a deep link) rather than the deep link scenario.
class SafeBackButton extends StatelessWidget {
  final IconData icon;
  final String? tooltip;
  final String fallbackRoute;

  const SafeBackButton({
    super.key,
    this.icon = Icons.close,
    this.tooltip,
    this.fallbackRoute = '/app',
  });

  @override
  Widget build(BuildContext context) {
    return IconButton(
      icon: Icon(icon),
      tooltip: tooltip ?? (icon == Icons.close ? 'Cancel' : null),
      onPressed: () {
        if (context.canPop()) {
          context.pop();
        } else {
          context.go(fallbackRoute);
        }
      },
    );
  }
}
