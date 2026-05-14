class FeatureFlagsService {
  static const String freeTier = 'free';
  static const String proTier = 'pro';
  static const String premiumTier = 'premium';
  static const String enterpriseTier = 'enterprise';

  static const Map<String, Map<String, bool>> _tierFeatures = {
    freeTier: {
      'vehicle_limit': true,
      'calendar_sync': false,
      'pdf_export': false,
      'excel_export': false,
      'ai_analysis': false,
      'ad_free': false,
      'priority_support': false,
      'phone_support': false,
      'api_access': false,
    },
    proTier: {
      'vehicle_limit': true,
      'calendar_sync': true,
      'pdf_export': true,
      'excel_export': true,
      'ai_analysis': true,
      'ad_free': false,
      'priority_support': true,
      'phone_support': false,
      'api_access': false,
    },
    premiumTier: {
      'vehicle_limit': true,
      'calendar_sync': true,
      'pdf_export': true,
      'excel_export': true,
      'ai_analysis': true,
      'ad_free': true,
      'priority_support': true,
      'phone_support': true,
      'api_access': true,
    },
    enterpriseTier: {
      'vehicle_limit': true,
      'calendar_sync': true,
      'pdf_export': true,
      'excel_export': true,
      'ai_analysis': true,
      'ad_free': true,
      'priority_support': true,
      'phone_support': true,
      'api_access': true,
    },
  };

  static String normalizeTier(String? tier) {
    final normalized = (tier ?? freeTier).trim().toLowerCase();
    if (_tierFeatures.containsKey(normalized)) {
      return normalized;
    }

    return freeTier;
  }

  static int getVehicleLimit(String? tier) {
    switch (normalizeTier(tier)) {
      case proTier:
        return 10;
      case premiumTier:
        return 25;
      case enterpriseTier:
        return 250;
      case freeTier:
      default:
        return 2;
    }
  }

  static bool isFeatureEnabled(String featureName, String? tier) {
    final normalizedTier = normalizeTier(tier);
    return _tierFeatures[normalizedTier]?[featureName] ?? false;
  }

  static Map<String, bool> getFeaturesForTier(String? tier) {
    final normalizedTier = normalizeTier(tier);
    return Map<String, bool>.from(_tierFeatures[normalizedTier] ?? const {});
  }
}
