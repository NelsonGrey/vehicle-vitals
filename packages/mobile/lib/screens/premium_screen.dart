import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../services/premium_service.dart';

class PremiumScreen extends StatefulWidget {
  const PremiumScreen({super.key});

  @override
  State<PremiumScreen> createState() => _PremiumScreenState();
}

class _PremiumScreenState extends State<PremiumScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Plans and Billing')),
      body: Consumer<PremiumService>(
        builder: (context, premiumService, child) {
          if (premiumService.isPremium) {
            return _buildPremiumActiveView(premiumService);
          } else {
            return _buildPremiumPurchaseView(premiumService);
          }
        },
      ),
    );
  }

  Widget _buildPremiumActiveView(PremiumService premiumService) {
    final features = premiumService.getPremiumFeatures();
    final tierLabel = _tierDisplayName(premiumService.subscriptionTier);

    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Card(
            color: Colors.green.shade50,
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                children: [
                  const Icon(Icons.check_circle, color: Colors.green, size: 32),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Premium Active',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Colors.green,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Current tier: $tierLabel • Vehicle limit: ${premiumService.vehicleLimit}',
                          style: TextStyle(color: Colors.green.shade700),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
          _buildPlanCatalog(premiumService),
          const SizedBox(height: 24),
          const Text(
            'Your Premium Benefits',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          _buildFeatureItem(
            icon: Icons.block,
            title: 'Ad-Free Experience',
            description: 'No more banner or interstitial ads',
            isActive: features['adFree'] ?? false,
          ),
          _buildFeatureItem(
            icon: Icons.analytics,
            title: 'Advanced Analytics',
            description: 'Detailed maintenance insights and trends',
            isActive: features['advancedAnalytics'] ?? false,
          ),
          _buildFeatureItem(
            icon: Icons.file_download,
            title: 'Unlimited Exports',
            description: 'Export data as CSV or PDF without limits',
            isActive: features['unlimitedExports'] ?? false,
          ),
          _buildFeatureItem(
            icon: Icons.support_agent,
            title: 'Priority Support',
            description: 'Get help faster with premium support',
            isActive: features['prioritySupport'] ?? false,
          ),
          const Spacer(),
          const Text(
            'Premium features are active across all your devices.',
            style: TextStyle(fontSize: 12, color: Colors.grey),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildPremiumPurchaseView(PremiumService premiumService) {
    final tierLabel = _tierDisplayName(premiumService.subscriptionTier);

    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: ListView(
        children: [
          const SizedBox(height: 8),
          Icon(Icons.star, size: 56, color: Theme.of(context).primaryColor),
          const SizedBox(height: 12),
          const Text(
            'Choose the plan that fits your garage',
            style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            'Current tier: $tierLabel • Vehicle limit: ${premiumService.vehicleLimit}',
            style: const TextStyle(fontSize: 15, color: Colors.grey),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 20),
          _buildPlanCatalog(premiumService),
          const SizedBox(height: 16),
          _buildFeatureComparisonTable(),
          const SizedBox(height: 12),
          TextButton(
            onPressed: () => _restorePurchases(premiumService),
            child: const Text('Restore Previous Purchase'),
          ),
          const SizedBox(height: 8),
          const Text(
            'Payment is processed through in-app purchase for Premium. Enterprise plans are handled through direct sales support.',
            style: TextStyle(fontSize: 12, color: Colors.grey),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildPlanCatalog(PremiumService premiumService) {
    return PremiumPlanCatalog(
      currentTier: premiumService.subscriptionTier,
      isLoading: premiumService.isLoading,
      premiumPrice: premiumService.premiumProduct?.price,
      onChoosePremium: () => _purchasePremium(premiumService),
      onContactSales: () => context.push('/app/contact'),
    );
  }

  Widget _buildFeatureComparisonTable() {
    final List<Map<String, dynamic>> rows = <Map<String, dynamic>>[
      {
        'feature': 'Calendar Sync',
        'free': false,
        'pro': true,
        'premium': true,
        'enterprise': true,
      },
      {
        'feature': 'PDF and Excel Export',
        'free': false,
        'pro': true,
        'premium': true,
        'enterprise': true,
      },
      {
        'feature': 'AI Analysis',
        'free': false,
        'pro': true,
        'premium': true,
        'enterprise': true,
      },
      {
        'feature': 'Ad-Free Experience',
        'free': false,
        'pro': false,
        'premium': true,
        'enterprise': true,
      },
      {
        'feature': 'Priority Support',
        'free': false,
        'pro': true,
        'premium': true,
        'enterprise': true,
      },
      {
        'feature': 'API Access',
        'free': false,
        'pro': false,
        'premium': true,
        'enterprise': true,
      },
    ];

    DataCell availabilityCell(bool available) {
      return DataCell(
        Icon(
          available ? Icons.check_circle : Icons.cancel,
          color: available ? Colors.green : Colors.grey,
          size: 18,
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Feature comparison',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: DataTable(
            columns: const [
              DataColumn(label: Text('Feature')),
              DataColumn(label: Text('Free')),
              DataColumn(label: Text('Pro')),
              DataColumn(label: Text('Premium')),
              DataColumn(label: Text('Enterprise')),
            ],
            rows: rows.map((row) {
              return DataRow(
                cells: [
                  DataCell(Text(row['feature'] as String)),
                  availabilityCell(row['free'] as bool),
                  availabilityCell(row['pro'] as bool),
                  availabilityCell(row['premium'] as bool),
                  availabilityCell(row['enterprise'] as bool),
                ],
              );
            }).toList(),
          ),
        ),
      ],
    );
  }

  String _tierDisplayName(String tier) {
    switch (tier) {
      case 'pro':
        return 'Pro';
      case 'premium':
        return 'Premium';
      case 'enterprise':
        return 'Enterprise';
      case 'free':
      default:
        return 'Free';
    }
  }

  Widget _buildFeatureItem({
    required IconData icon,
    required String title,
    required String description,
    required bool isActive,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        children: [
          Icon(icon, color: isActive ? Colors.green : Colors.grey, size: 24),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                    color: isActive ? Colors.black : Colors.grey,
                  ),
                ),
                Text(
                  description,
                  style: TextStyle(fontSize: 14, color: Colors.grey.shade600),
                ),
              ],
            ),
          ),
          if (isActive) const Icon(Icons.check_circle, color: Colors.green),
        ],
      ),
    );
  }

  Future<void> _purchasePremium(PremiumService premiumService) async {
    try {
      await premiumService.purchasePremium();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Purchase failed: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _restorePurchases(PremiumService premiumService) async {
    try {
      await premiumService.restorePurchases();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Purchase restored successfully!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Restore failed: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
}

class PremiumPlanCatalog extends StatelessWidget {
  const PremiumPlanCatalog({
    super.key,
    required this.currentTier,
    required this.isLoading,
    required this.premiumPrice,
    required this.onChoosePremium,
    required this.onContactSales,
  });

  final String currentTier;
  final bool isLoading;
  final String? premiumPrice;
  final VoidCallback onChoosePremium;
  final VoidCallback onContactSales;

  static const List<String> _tierOrder = <String>[
    'free',
    'pro',
    'premium',
    'enterprise',
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Plan options',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        ..._tierOrder.map((tier) => _buildPlanCard(tier)),
      ],
    );
  }

  Widget _buildPlanCard(String tier) {
    final bool isCurrent = currentTier == tier;
    final bool isEnterprise = tier == 'enterprise';
    final bool isPremiumTier = tier == 'premium';

    final Color accentColor = isCurrent ? Colors.teal : Colors.blueGrey;
    final String priceLabel = _tierPriceLabel(tier, premiumPrice);

    String buttonLabel;
    VoidCallback? onPressed;

    if (isCurrent) {
      buttonLabel = 'Current Plan';
      onPressed = null;
    } else if (isEnterprise) {
      buttonLabel = 'Contact Sales';
      onPressed = onContactSales;
    } else if (isPremiumTier) {
      buttonLabel = 'Choose Premium';
      onPressed = isLoading ? null : onChoosePremium;
    } else {
      buttonLabel = 'Included';
      onPressed = null;
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  _tierDisplayName(tier),
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: accentColor,
                  ),
                ),
                Text(
                  priceLabel,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              _tierVehicleLimitLabel(tier),
              style: const TextStyle(fontSize: 14, color: Colors.black54),
            ),
            const SizedBox(height: 12),
            Align(
              alignment: Alignment.centerRight,
              child: ElevatedButton(
                onPressed: onPressed,
                child: isLoading && isPremiumTier
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Text(buttonLabel),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _tierDisplayName(String tier) {
    switch (tier) {
      case 'pro':
        return 'Pro';
      case 'premium':
        return 'Premium';
      case 'enterprise':
        return 'Enterprise';
      case 'free':
      default:
        return 'Free';
    }
  }

  String _tierVehicleLimitLabel(String tier) {
    switch (tier) {
      case 'pro':
        return 'Up to 10 vehicles';
      case 'premium':
        return 'Up to 25 vehicles';
      case 'enterprise':
        return '25+ vehicles (contract)';
      case 'free':
      default:
        return 'Up to 2 vehicles';
    }
  }

  String _tierPriceLabel(String tier, String? currentPremiumPrice) {
    switch (tier) {
      case 'pro':
        return '\$5/mo';
      case 'premium':
        return currentPremiumPrice ?? '\$4.99';
      case 'enterprise':
        return 'Contact sales';
      case 'free':
      default:
        return '\$0';
    }
  }
}
