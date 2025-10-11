import 'package:flutter/material.dart';
import 'package:in_app_purchase/in_app_purchase.dart';
import 'package:shared_preferences/shared_preferences.dart';

class PremiumService extends ChangeNotifier {
  static const String _premiumStatusKey = 'premium_status';
  static const String _premiumProductId =
      'premium_ad_free'; // iOS/Android product ID

  bool _isPremium = false;
  bool _isLoading = false;
  ProductDetails? _premiumProduct;

  bool get isPremium => _isPremium;
  bool get isLoading => _isLoading;
  ProductDetails? get premiumProduct => _premiumProduct;

  PremiumService() {
    _loadPremiumStatus();
    _initializeInAppPurchase();
  }

  Future<void> _loadPremiumStatus() async {
    final prefs = await SharedPreferences.getInstance();
    _isPremium = prefs.getBool(_premiumStatusKey) ?? false;
    notifyListeners();
  }

  Future<void> _savePremiumStatus(bool status) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_premiumStatusKey, status);
    _isPremium = status;
    notifyListeners();
  }

  Future<void> _initializeInAppPurchase() async {
    final bool available = await InAppPurchase.instance.isAvailable();
    if (!available) {
      debugPrint('In-app purchase not available');
      return;
    }

    // Query product details
    const Set<String> productIds = {_premiumProductId};
    final ProductDetailsResponse response = await InAppPurchase.instance
        .queryProductDetails(productIds);

    if (response.productDetails.isNotEmpty) {
      _premiumProduct = response.productDetails.first;
      notifyListeners();
    }

    // Listen for purchase updates
    final Stream<List<PurchaseDetails>> purchaseUpdated =
        InAppPurchase.instance.purchaseStream;

    purchaseUpdated.listen((purchaseDetailsList) {
      _listenToPurchaseUpdated(purchaseDetailsList);
    });
  }

  void _listenToPurchaseUpdated(List<PurchaseDetails> purchaseDetailsList) {
    for (final PurchaseDetails purchaseDetails in purchaseDetailsList) {
      if (purchaseDetails.productID == _premiumProductId) {
        if (purchaseDetails.status == PurchaseStatus.pending) {
          _isLoading = true;
          notifyListeners();
        } else {
          if (purchaseDetails.status == PurchaseStatus.error) {
            debugPrint('Purchase error: ${purchaseDetails.error}');
            _isLoading = false;
            notifyListeners();
          } else if (purchaseDetails.status == PurchaseStatus.purchased ||
              purchaseDetails.status == PurchaseStatus.restored) {
            _deliverProduct(purchaseDetails);
          }

          if (purchaseDetails.pendingCompletePurchase) {
            InAppPurchase.instance.completePurchase(purchaseDetails);
          }
        }
      }
    }
  }

  Future<void> _deliverProduct(PurchaseDetails purchaseDetails) async {
    // Verify purchase (in production, verify with server)
    await _savePremiumStatus(true);
    _isLoading = false;
    notifyListeners();
  }

  Future<void> purchasePremium() async {
    if (_premiumProduct == null) {
      throw Exception('Premium product not available');
    }

    final PurchaseParam purchaseParam = PurchaseParam(
      productDetails: _premiumProduct!,
    );

    await InAppPurchase.instance.buyNonConsumable(purchaseParam: purchaseParam);
  }

  Future<void> restorePurchases() async {
    await InAppPurchase.instance.restorePurchases();
  }

  // Check if ads should be shown (false if premium)
  bool shouldShowAds() {
    return !_isPremium;
  }

  // Get premium features status
  Map<String, bool> getPremiumFeatures() {
    return {
      'adFree': _isPremium,
      'advancedAnalytics': _isPremium,
      'unlimitedExports': _isPremium,
      'prioritySupport': _isPremium,
    };
  }
}
