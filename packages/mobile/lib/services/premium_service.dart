import 'dart:async';

import 'package:cloud_functions/cloud_functions.dart';
import 'package:flutter/material.dart';
import 'package:in_app_purchase/in_app_purchase.dart' as iap;
import 'package:shared_preferences/shared_preferences.dart';

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
  static const String _premiumStatusKey = 'premium_status';
  static const String _premiumProductId = 'premium_ad_free';

  bool _isPremium = false;
  bool _isLoading = false;
  final FirebaseFunctions _functions = FirebaseFunctions.instance;
  iap.ProductDetails? _storePremiumProduct;
  StreamSubscription<List<iap.PurchaseDetails>>? _purchaseSubscription;
  ProductDetails? _premiumProduct;

  bool get isPremium => _isPremium;
  bool get isLoading => _isLoading;
  ProductDetails? get premiumProduct => _premiumProduct;

  PremiumService() {
    _initialize();
  }

  Future<void> _initialize() async {
    await _loadPremiumStatus();
    await _initializeInAppPurchase();
    await _refreshPremiumStatusFromBackend();
  }

  Future<void> _loadPremiumStatus() async {
    final prefs = await SharedPreferences.getInstance();
    _isPremium = prefs.getBool(_premiumStatusKey) ?? false;

    _premiumProduct = ProductDetails(
      id: _premiumProductId,
      title: 'Premium Ad-Free',
      description: 'Remove ads and unlock premium features',
      price: '\$4.99',
    );
    notifyListeners();
  }

  Future<void> _savePremiumStatus(bool status) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_premiumStatusKey, status);
    _isPremium = status;
    notifyListeners();
  }

  Future<void> _initializeInAppPurchase() async {
    final available = await iap.InAppPurchase.instance.isAvailable();
    if (!available) {
      debugPrint('In-app purchase not available');
      return;
    }

    final response = await iap.InAppPurchase.instance.queryProductDetails({
      _premiumProductId,
    });

    if (response.productDetails.isNotEmpty) {
      _storePremiumProduct = response.productDetails.first;
      _premiumProduct = ProductDetails(
        id: _storePremiumProduct!.id,
        title: _storePremiumProduct!.title,
        description: _storePremiumProduct!.description,
        price: _storePremiumProduct!.price,
      );
      notifyListeners();
    }

    _purchaseSubscription?.cancel();
    _purchaseSubscription = iap.InAppPurchase.instance.purchaseStream.listen(
      _listenToPurchaseUpdated,
      onError: (error) {
        debugPrint('Purchase stream error: $error');
        _isLoading = false;
        notifyListeners();
      },
    );
  }

  Future<void> _listenToPurchaseUpdated(
    List<iap.PurchaseDetails> purchaseDetailsList,
  ) async {
    for (final purchaseDetails in purchaseDetailsList) {
      if (purchaseDetails.productID != _premiumProductId) continue;

      if (purchaseDetails.status == iap.PurchaseStatus.pending) {
        _isLoading = true;
        notifyListeners();
        continue;
      }

      if (purchaseDetails.status == iap.PurchaseStatus.error) {
        debugPrint('Purchase error: ${purchaseDetails.error}');
        _isLoading = false;
        notifyListeners();
      } else if (purchaseDetails.status == iap.PurchaseStatus.purchased ||
          purchaseDetails.status == iap.PurchaseStatus.restored) {
        final verified = await _verifyPurchaseWithBackend(purchaseDetails);
        if (verified) {
          await _deliverProduct();
        } else {
          _isLoading = false;
          notifyListeners();
          debugPrint('Purchase verification failed');
        }
      }

      if (purchaseDetails.pendingCompletePurchase) {
        iap.InAppPurchase.instance.completePurchase(purchaseDetails);
      }
    }
  }

  Future<bool> _verifyPurchaseWithBackend(
    iap.PurchaseDetails purchaseDetails,
  ) async {
    try {
      final normalizedSource = _normalizePurchaseSource(
        purchaseDetails.verificationData.source,
      );
      final callable = _functions.httpsCallable('verifyPremiumPurchase');
      final response = await callable.call({
        'productId': purchaseDetails.productID,
        'purchaseId': purchaseDetails.purchaseID,
        'verificationData':
            purchaseDetails.verificationData.serverVerificationData,
        'source': normalizedSource,
      });

      final data = Map<String, dynamic>.from(response.data as Map? ?? {});
      if (data['success'] != true) return false;

      final entitlement = Map<String, dynamic>.from(
        data['entitlement'] as Map? ?? <String, dynamic>{},
      );
      return entitlement['premium'] == true;
    } on FirebaseFunctionsException catch (error) {
      debugPrint('Purchase verification function error: ${error.message}');
      return false;
    } catch (error) {
      debugPrint('Purchase verification failed: $error');
      return false;
    }
  }

  String _normalizePurchaseSource(String source) {
    final normalized = source.trim().toLowerCase();

    if (normalized == 'google_play' ||
        normalized == 'playstore' ||
        normalized == 'play_store') {
      return 'play_store';
    }

    if (normalized == 'apple_app_store' ||
        normalized == 'appstore' ||
        normalized == 'app_store') {
      return 'app_store';
    }

    return normalized.isEmpty ? 'unknown' : normalized;
  }

  Future<void> _refreshPremiumStatusFromBackend() async {
    try {
      final callable = _functions.httpsCallable('getPremiumEntitlement');
      final response = await callable.call();
      final data = Map<String, dynamic>.from(response.data as Map? ?? {});
      if (data['success'] != true) return;

      final entitlement = Map<String, dynamic>.from(
        data['entitlement'] as Map? ?? <String, dynamic>{},
      );
      final backendPremium = entitlement['premium'] == true;

      if (backendPremium != _isPremium) {
        await _savePremiumStatus(backendPremium);
      }
    } on FirebaseFunctionsException catch (error) {
      debugPrint('Entitlement refresh function error: ${error.message}');
    } catch (error) {
      debugPrint('Entitlement refresh failed: $error');
    }
  }

  Future<void> _deliverProduct() async {
    await _savePremiumStatus(true);
    _isLoading = false;
    notifyListeners();
  }

  Future<void> purchasePremium() async {
    if (_storePremiumProduct == null) {
      throw Exception('Premium product is not available');
    }

    _isLoading = true;
    notifyListeners();

    final purchaseParam = iap.PurchaseParam(
      productDetails: _storePremiumProduct!,
    );
    final launched = await iap.InAppPurchase.instance.buyNonConsumable(
      purchaseParam: purchaseParam,
    );

    if (!launched) {
      _isLoading = false;
      notifyListeners();
      throw Exception('Unable to start premium purchase');
    }
  }

  Future<void> restorePurchases() async {
    _isLoading = true;
    notifyListeners();
    await iap.InAppPurchase.instance.restorePurchases();
    _isLoading = false;
    notifyListeners();
  }

  bool shouldShowAds() {
    return !_isPremium;
  }

  Map<String, bool> getPremiumFeatures() {
    return {
      'adFree': _isPremium,
      'advancedAnalytics': _isPremium,
      'unlimitedExports': _isPremium,
      'prioritySupport': _isPremium,
    };
  }

  @override
  void dispose() {
    _purchaseSubscription?.cancel();
    super.dispose();
  }
}
