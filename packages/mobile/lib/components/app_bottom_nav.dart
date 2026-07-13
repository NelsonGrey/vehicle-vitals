import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class AppBottomNav extends StatelessWidget {
  final int currentIndex;

  const AppBottomNav({super.key, required this.currentIndex});

  void _onTap(BuildContext context, int index) {
    switch (index) {
      case 0:
        context.go('/app');
        break;
      case 1:
        context.go('/app/upcoming');
        break;
      case 2:
        context.go('/app/timeline');
        break;
      case 3:
        context.go('/app/profile');
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    return BottomNavigationBar(
      type: BottomNavigationBarType.fixed,
      currentIndex: currentIndex,
      onTap: (index) => _onTap(context, index),
      items: const [
        BottomNavigationBarItem(
          icon: Icon(Icons.directions_car),
          label: 'Garage',
        ),
        BottomNavigationBarItem(icon: Icon(Icons.upcoming), label: 'Plan'),
        BottomNavigationBarItem(icon: Icon(Icons.timeline), label: 'History'),
        BottomNavigationBarItem(
          icon: Icon(Icons.account_circle),
          label: 'Account',
        ),
      ],
    );
  }
}
