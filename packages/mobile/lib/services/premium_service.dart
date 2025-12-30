import 'package:flutter/material.dart';
// import 'package:in_app_purchase/in_app_purchase.dart';
// import 'package:shared_preferences/shared_preferences.dart';

// Stub ProductDetails class for TestFlight
class ProductDetails {
  final String id;
  final String title;
  final String description;
  final String price;

  ProductDetails({
    required this.id,
    required this.title,
    required this.description,
    required this.price,
  });
}

class PremiumService extends ChangeNotifier {
  // static const String _premiumStatusKey = 'premium_status';
  // static const String _premiumProductId =
  //     'premium_ad_free'; // iOS/Android product ID

  bool _isPremium = false; // Mock: always free for TestFlight
  final bool _isLoading = false;
  ProductDetails? _premiumProduct;

  bool get isPremium => _isPremium;
  bool get isLoading => _isLoading;
  ProductDetails? get premiumProduct => _premiumProduct;

  PremiumService() {
    _loadPremiumStatus();
    // _initializeInAppPurchase(); // DISABLED FOR TESTFLIGHT
  }

  Future<void> _loadPremiumStatus() async {
    // Mock: always free tier for TestFlight
    _isPremium = false;
    // Mock premium product for TestFlight
    _premiumProduct = ProductDetails(
      id: 'premium_ad_free',
      title: 'Premium Ad-Free',
      description: 'Remove ads and unlock premium features',
      price: '\$4.99',
    );
    notifyListeners();
  }

  // Future<void> _savePremiumStatus(bool status) async {
  //   final prefs = await SharedPreferences.getInstance();
  //   await prefs.setBool(_premiumStatusKey, status);
  //   _isPremium = status;
  //   notifyListeners();
  // }

  // Future<void> _initializeInAppPurchase() async {
  //   final bool available = await InAppPurchase.instance.isAvailable();
  //   if (!available) {
  //     debugPrint('In-app purchase not available');
  //     return;
  //   }

  //   // Query product details
  //   const Set<String> productIds = {_premiumProductId};
  //   final ProductDetailsResponse response = await InAppPurchase.instance
  //       .queryProductDetails(productIds);

  //   if (response.productDetails.isNotEmpty) {
  //     _premiumProduct = response.productDetails.first;
  //     notifyListeners();
  //   }

  //   // Listen for purchase updates
  //   final Stream<List<PurchaseDetails>> purchaseUpdated =
  //       InAppPurchase.instance.purchaseStream;

  //   purchaseUpdated.listen((purchaseDetailsList) {
  //     _listenToPurchaseUpdated(purchaseDetailsList);
  //   });
  // }

  // void _listenToPurchaseUpdated(List<PurchaseDetails> purchaseDetailsList) {
  //   for (final PurchaseDetails purchaseDetails in purchaseDetailsList) {
  //     if (purchaseDetails.productID == _premiumProductId) {
  //       if (purchaseDetails.status == PurchaseStatus.pending) {
  //         _isLoading = true;
  //         notifyListeners();
  //       } else {
  //         if (purchaseDetails.status == PurchaseStatus.error) {
  //           debugPrint('Purchase error: ${purchaseDetails.error}');
  //           _isLoading = false;
  //           notifyListeners();
  //         } else if (purchaseDetails.status == PurchaseStatus.purchased ||
  //             purchaseDetails.status == PurchaseStatus.restored) {
  //           _deliverProduct(purchaseDetails);
  //         }

  //         if (purchaseDetails.pendingCompletePurchase) {
  //           InAppPurchase.instance.completePurchase(purchaseDetails);
  //         }
  //       }
  //     }
  //   }
  // }

  // Future<void> _deliverProduct(PurchaseDetails purchaseDetails) async {
  //   // Verify purchase (in production, verify with server)
  //   await _savePremiumStatus(true);
  //   _isLoading = false;
  //   notifyListeners();
  // }

  Future<void> purchasePremium() async {
    // Mock: do nothing for TestFlight
    debugPrint('Mock premium purchase - TestFlight build');
  }

  Future<void> restorePurchases() async {
    // Mock: do nothing for TestFlight
    debugPrint('Mock restore purchases - TestFlight build');
  }

  // Check if ads should be shown (false if premium)
  bool shouldShowAds() {
    return !_isPremium; // Always show ads for TestFlight
  }

  // Get premium features status
  Map<String, bool> getPremiumFeatures() {
    return {
      'adFree': _isPremium, // Always false for TestFlight
      'advancedAnalytics': _isPremium,
      'unlimitedExports': _isPremium,
      'prioritySupport': _isPremium,
    };
  }
}
