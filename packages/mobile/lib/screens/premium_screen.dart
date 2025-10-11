import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:in_app_purchase/in_app_purchase.dart';
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
      appBar: AppBar(title: const Text('Premium Features')),
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
                          'Thank you for supporting Vehicle Vitals!',
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
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          const SizedBox(height: 24),
          Icon(Icons.star, size: 64, color: Theme.of(context).primaryColor),
          const SizedBox(height: 16),
          const Text(
            'Upgrade to Premium',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          const Text(
            'Unlock advanced features and enjoy an ad-free experience',
            style: TextStyle(fontSize: 16, color: Colors.grey),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 32),
          Card(
            elevation: 4,
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                children: [
                  const Text(
                    'Premium Features',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),
                  _buildFeatureItem(
                    icon: Icons.block,
                    title: 'Ad-Free Experience',
                    description: 'Remove all banner and interstitial ads',
                    isActive: false,
                  ),
                  _buildFeatureItem(
                    icon: Icons.analytics,
                    title: 'Advanced Analytics',
                    description: 'Detailed maintenance insights and trends',
                    isActive: false,
                  ),
                  _buildFeatureItem(
                    icon: Icons.file_download,
                    title: 'Unlimited Exports',
                    description: 'Export data without any restrictions',
                    isActive: false,
                  ),
                  _buildFeatureItem(
                    icon: Icons.support_agent,
                    title: 'Priority Support',
                    description: 'Get faster responses to your questions',
                    isActive: false,
                  ),
                  const SizedBox(height: 24),
                  if (premiumService.premiumProduct != null) ...[
                    Text(
                      premiumService.premiumProduct!.price,
                      style: const TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFFF59E0B),
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'One-time purchase',
                      style: TextStyle(fontSize: 14, color: Colors.grey),
                    ),
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: premiumService.isLoading
                            ? null
                            : () => _purchasePremium(premiumService),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFF59E0B),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        child: premiumService.isLoading
                            ? const SizedBox(
                                width: 24,
                                height: 24,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(
                                    Colors.white,
                                  ),
                                ),
                              )
                            : const Text(
                                'Upgrade to Premium',
                                style: TextStyle(fontSize: 16),
                              ),
                      ),
                    ),
                  ] else ...[
                    const CircularProgressIndicator(),
                    const SizedBox(height: 16),
                    const Text(
                      'Loading pricing...',
                      style: TextStyle(color: Colors.grey),
                    ),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          TextButton(
            onPressed: () => _restorePurchases(premiumService),
            child: const Text('Restore Previous Purchase'),
          ),
          const Spacer(),
          const Text(
            'Payment will be charged to your account upon confirmation. Subscription automatically renews unless cancelled.',
            style: TextStyle(fontSize: 12, color: Colors.grey),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
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
