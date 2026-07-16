import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../services/feature_flags_service.dart';
import '../services/premium_service.dart';
import '../theme/design_tokens.dart';
import '../utils/user_facing_error.dart';

class PremiumScreen extends StatefulWidget {
  const PremiumScreen({super.key});

  @override
  State<PremiumScreen> createState() => _PremiumScreenState();
}

class _PremiumScreenState extends State<PremiumScreen> {
  String _billingPeriod = 'monthly';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Subscriptions and Billing')),
      body: Consumer<PremiumService>(
        builder: (context, premiumService, child) {
          if (premiumService.subscriptionTier != FeatureFlagsService.freeTier) {
            return _buildPremiumActiveView(premiumService);
          } else {
            return _buildPremiumPurchaseView(premiumService);
          }
        },
      ),
    );
  }

  Widget _buildBillingPeriodToggle() {
    Widget periodButton(String period, String label) {
      final bool isSelected = _billingPeriod == period;
      return Expanded(
        child: TextButton(
          onPressed: () => setState(() => _billingPeriod = period),
          style: TextButton.styleFrom(
            backgroundColor: isSelected
                ? Theme.of(context).primaryColor
                : Colors.transparent,
            foregroundColor: isSelected ? Colors.white : Colors.black87,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
          child: Text(label),
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey.shade400),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          periodButton('monthly', 'Monthly'),
          periodButton('annual', 'Annual'),
        ],
      ),
    );
  }

  Widget _buildPremiumActiveView(PremiumService premiumService) {
    final features = premiumService.getPremiumFeatures();
    final tierLabel = _tierDisplayName(premiumService.subscriptionTier);

    return ListView(
      padding: const EdgeInsets.all(16.0),
      children: [
        Card(
          color: AppDesignTokens.success.withValues(alpha: 0.08),
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              children: [
                Icon(
                  Icons.check_circle,
                  color: AppDesignTokens.success,
                  size: 32,
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '$tierLabel Active',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          color: AppDesignTokens.success,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Current tier: $tierLabel • Vehicle limit: ${premiumService.vehicleLimit}',
                        style: TextStyle(color: AppDesignTokens.success),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),
        _buildBillingPeriodToggle(),
        const SizedBox(height: 16),
        _buildPlanCatalog(premiumService),
        const SizedBox(height: 24),
        Text(
          'Your $tierLabel benefits',
          style: Theme.of(context).textTheme.titleMedium,
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
          title: 'Document Analysis',
          description: 'Analyze supported maintenance documents and receipts',
          isActive: features['advancedAnalytics'] ?? false,
        ),
        _buildFeatureItem(
          icon: Icons.file_download,
          title: 'PDF Export',
          description: 'Export maintenance records as PDF',
          isActive: features['unlimitedExports'] ?? false,
        ),
        _buildFeatureItem(
          icon: Icons.support_agent,
          title: 'Priority Support Entitlement',
          description: 'Support routing follows the terms for your tier',
          isActive: features['prioritySupport'] ?? false,
        ),
        Text(
          '$tierLabel entitlements synchronize across supported devices.',
          style: TextStyle(fontSize: 12, color: Colors.grey),
          textAlign: TextAlign.center,
        ),
      ],
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
            'Choose the subscription tier that fits your garage',
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
          _buildBillingPeriodToggle(),
          const SizedBox(height: 16),
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
            'Payment is processed through Apple in-app purchase for Pro and Premium. Enterprise inquiries are handled through Support.',
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
      billingPeriod: _billingPeriod,
      proPrice: premiumService.productFor('pro', _billingPeriod)?.price,
      premiumPrice: premiumService.productFor('premium', _billingPeriod)?.price,
      onChoosePro: () => _purchase(premiumService, 'pro'),
      onChoosePremium: () => _purchase(premiumService, 'premium'),
      onContactSales: () => context.push('/app/support'),
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
          color: available ? AppDesignTokens.success : Colors.grey,
          size: 18,
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Feature comparison',
          style: Theme.of(context).textTheme.titleMedium,
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
          Icon(
            icon,
            color: isActive ? AppDesignTokens.success : Colors.grey,
            size: 24,
          ),
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
          if (isActive)
            Icon(Icons.check_circle, color: AppDesignTokens.success),
        ],
      ),
    );
  }

  Future<void> _purchase(PremiumService premiumService, String tier) async {
    try {
      await premiumService.purchase(tier, _billingPeriod);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              userFacingError(
                e,
                fallback:
                    'The purchase could not be completed. No subscription change was made.',
              ),
            ),
            backgroundColor: Theme.of(context).colorScheme.error,
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
            backgroundColor: AppDesignTokens.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              userFacingError(
                e,
                fallback:
                    'Purchases could not be restored. Please try again later.',
              ),
            ),
            backgroundColor: Theme.of(context).colorScheme.error,
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
    required this.billingPeriod,
    required this.proPrice,
    required this.premiumPrice,
    required this.onChoosePro,
    required this.onChoosePremium,
    required this.onContactSales,
  });

  final String currentTier;
  final bool isLoading;
  final String billingPeriod;
  final String? proPrice;
  final String? premiumPrice;
  final VoidCallback onChoosePro;
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
        Text(
          'Subscription options',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 12),
        ..._tierOrder.map((tier) => _buildPlanCard(tier)),
      ],
    );
  }

  Widget _buildPlanCard(String tier) {
    final bool isCurrent = currentTier == tier;
    final bool isEnterprise = tier == 'enterprise';
    final bool isProTier = tier == 'pro';
    final bool isPremiumTier = tier == 'premium';

    final Color accentColor = isCurrent ? Colors.teal : Colors.blueGrey;
    final String priceLabel = _tierPriceLabel(
      tier,
      tier == 'pro' ? proPrice : premiumPrice,
    );

    String buttonLabel;
    VoidCallback? onPressed;

    if (isCurrent) {
      buttonLabel = 'Current Subscription';
      onPressed = null;
    } else if (isEnterprise) {
      buttonLabel = 'Contact Sales';
      onPressed = onContactSales;
    } else if (isProTier) {
      buttonLabel = 'Choose Pro';
      onPressed = isLoading ? null : onChoosePro;
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
            const SizedBox(height: 2),
            Text(
              _tierTagline(tier),
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                fontStyle: FontStyle.italic,
                color: Colors.black54,
              ),
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
                child: isLoading && (isProTier || isPremiumTier)
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

  // Matches the marketing/web tier taglines (packages/web/src/shared/featureFlags.ts,
  // docs/APP_ALIGNMENT_PLAN.md) so the story is consistent end-to-end.
  String _tierTagline(String tier) {
    switch (tier) {
      case 'pro':
        return 'Plan and coordinate';
      case 'premium':
        return 'Forecast and automate';
      case 'enterprise':
        return 'Govern and integrate';
      case 'free':
      default:
        return 'Learn and document';
    }
  }

  String _tierPriceLabel(String tier, String? livePrice) {
    final bool isAnnual = billingPeriod == 'annual';
    final String suffix = isAnnual ? '/yr' : '/mo';

    // Matches the web TIER_PRICING constant (featureFlags.ts) until the
    // live App Store price loads.
    String fallbackFor(String monthly, String annual) =>
        isAnnual ? annual : monthly;

    switch (tier) {
      case 'pro':
        if (livePrice == null) return fallbackFor('\$2.99/mo', '\$29.99/yr');
        return livePrice.contains('/mo') || livePrice.contains('/yr')
            ? livePrice
            : '$livePrice$suffix';
      case 'premium':
        if (livePrice == null) return fallbackFor('\$6.99/mo', '\$69.99/yr');
        return livePrice.contains('/mo') || livePrice.contains('/yr')
            ? livePrice
            : '$livePrice$suffix';
      case 'enterprise':
        return 'Contact sales';
      case 'free':
      default:
        return '\$0';
    }
  }
}
