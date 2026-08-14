import 'package:app_tracking_transparency/app_tracking_transparency.dart';
import 'package:flutter/foundation.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';

/// Gates AdMob ad personalization on the user's App Tracking Transparency
/// decision (iOS) so ads never request tracking-based personalization
/// without consent. On platforms with no ATT concept, ads stay
/// non-personalized by default.
class AdConsentService {
  static bool _personalizedAdsAllowed = false;

  static bool get personalizedAdsAllowed => _personalizedAdsAllowed;

  static Future<void> requestConsent() async {
    if (defaultTargetPlatform != TargetPlatform.iOS) {
      _personalizedAdsAllowed = false;
      return;
    }

    var status = await AppTrackingTransparency.trackingAuthorizationStatus;
    if (status == TrackingStatus.notDetermined) {
      status = await AppTrackingTransparency.requestTrackingAuthorization();
    }
    _personalizedAdsAllowed = status == TrackingStatus.authorized;
  }

  static AdRequest buildAdRequest() {
    return AdRequest(nonPersonalizedAds: !_personalizedAdsAllowed);
  }
}
