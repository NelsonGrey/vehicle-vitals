import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../models/vehicle.dart';
import '../services/auth_service.dart';
import '../services/firestore_service.dart';
import '../theme/design_tokens.dart';
import '../theme/tailwind_utilities.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final authService = Provider.of<AuthService>(context);
    final firestoreService = FirestoreService();

    // If not authenticated, show welcome screen
    if (authService.currentUser == null) {
      return Scaffold(
        body: TwContainer(
          padding: EdgeInsets.all(TwSpace.s6),
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // App icon placeholder (you can replace with actual logo)
                Container(
                  width: 96,
                  height: 96,
                  decoration: BoxDecoration(
                    color: AppDesignTokens.colorScheme(
                      Theme.of(context).brightness,
                    ).primary,
                    borderRadius: BorderRadius.circular(TwRadius.xl),
                  ),
                  child: const Icon(
                    Icons.directions_car,
                    size: 48,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'Vehicle Vitals',
                  style: Theme.of(context).textTheme.displayMedium,
                ),
                const SizedBox(height: 8),
                Text(
                  'Track your vehicles, log maintenance, and stay on schedule.',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: AppDesignTokens.colorScheme(
                      Theme.of(context).brightness,
                    ).muted,
                  ),
                ),
                const SizedBox(height: 32),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    ElevatedButton(
                      onPressed: () => context.go('/auth/login'),
                      child: const Text('Log in'),
                    ),
                    const SizedBox(width: 16),
                    ElevatedButton(
                      onPressed: () => context.go('/auth/signup'),
                      child: const Text('Sign up'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      );
    }

    // Authenticated user - show vehicle garage
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'My Garage',
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700),
        ),
        actions: [
          PopupMenuButton<String>(
            onSelected: (value) {
              switch (value) {
                case 'upcoming':
                  context.push('/app/upcoming');
                  break;
                case 'account':
                  context.push('/app/account');
                  break;
                case 'instructions':
                  context.push('/app/instructions');
                  break;
                case 'contact':
                  context.push('/app/contact');
                  break;
                case 'privacy':
                  context.push('/app/privacy');
                  break;
                case 'terms':
                  context.push('/app/terms');
                  break;
                case 'signout':
                  authService.signOut();
                  break;
              }
            },
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'upcoming',
                child: Row(
                  children: [
                    Icon(Icons.upcoming),
                    SizedBox(width: 8),
                    Text('Upcoming Tasks'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'account',
                child: Row(
                  children: [
                    Icon(Icons.account_circle),
                    SizedBox(width: 8),
                    Text('Account'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'instructions',
                child: Row(
                  children: [
                    Icon(Icons.help),
                    SizedBox(width: 8),
                    Text('Instructions'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'contact',
                child: Row(
                  children: [
                    Icon(Icons.contact_support),
                    SizedBox(width: 8),
                    Text('Contact'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'privacy',
                child: Row(
                  children: [
                    Icon(Icons.privacy_tip),
                    SizedBox(width: 8),
                    Text('Privacy Policy'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'terms',
                child: Row(
                  children: [
                    Icon(Icons.description),
                    SizedBox(width: 8),
                    Text('Terms of Service'),
                  ],
                ),
              ),
              const PopupMenuDivider(),
              const PopupMenuItem(
                value: 'signout',
                child: Row(
                  children: [
                    Icon(Icons.logout),
                    SizedBox(width: 8),
                    Text('Sign Out'),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          // Add Vehicle button
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => context.push('/app/add-vehicle'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFF59E0B),
                  foregroundColor: Colors.white,
                ),
                child: const Text('Add Vehicle'),
              ),
            ),
          ),
          // Vehicle list
          Expanded(
            child: StreamBuilder<List<Vehicle>>(
              stream: firestoreService.getVehiclesStream(),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }

                final vehicles = snapshot.data ?? [];

                if (vehicles.isEmpty) {
                  return const Center(
                    child: Padding(
                      padding: EdgeInsets.all(16.0),
                      child: Text(
                        'No vehicles yet. Add your first vehicle.',
                        style: TextStyle(
                          color: Color(0xFF7A6F66),
                          fontSize: 16,
                        ),
                      ),
                    ),
                  );
                }

                return ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: vehicles.length,
                  itemBuilder: (context, index) {
                    final vehicle = vehicles[index];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      color: const Color(0xFFFFF6E6),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${vehicle.year} ${vehicle.make} ${vehicle.model}',
                              style: const TextStyle(
                                fontWeight: FontWeight.w700,
                                fontSize: 16,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'VIN: ${vehicle.vin}',
                              style: const TextStyle(
                                color: Color(0xFF7A6F66),
                                fontSize: 12,
                              ),
                            ),
                            if (vehicle.mileage > 0) ...[
                              const SizedBox(height: 4),
                              Text(
                                'Mileage: ${vehicle.mileage.toStringAsFixed(0)} miles',
                                style: const TextStyle(
                                  color: Color(0xFF7A6F66),
                                  fontSize: 12,
                                ),
                              ),
                            ],
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                Expanded(
                                  child: OutlinedButton.icon(
                                    onPressed: () => context.push(
                                      '/app/edit-vehicle/${vehicle.vin}',
                                    ),
                                    icon: const Icon(Icons.edit, size: 16),
                                    label: const Text('Edit'),
                                    style: OutlinedButton.styleFrom(
                                      foregroundColor: const Color(0xFFF59E0B),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: ElevatedButton.icon(
                                    onPressed: () => context.push(
                                      '/app/maintenance/${vehicle.vin}',
                                    ),
                                    icon: const Icon(Icons.build, size: 16),
                                    label: const Text('Maintenance'),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFFF59E0B),
                                      foregroundColor: Colors.white,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
