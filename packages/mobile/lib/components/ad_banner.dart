import 'package:flutter/material.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:provider/provider.dart';

import '../services/premium_service.dart';
import '../theme/design_tokens.dart';

const bool _screenshotMode = bool.fromEnvironment('VV_SCREENSHOT_MODE');

/// AdMob banner widget for mobile apps
/// Configure with environment variables or fallback to placeholder
class AdBanner extends StatefulWidget {
  final String? adUnitId;
  final AdSize adSize;
  final EdgeInsets? margin;

  const AdBanner({
    super.key,
    this.adUnitId,
    this.adSize = AdSize.banner,
    this.margin,
  });

  @override
  State<AdBanner> createState() => _AdBannerState();
}

class _AdBannerState extends State<AdBanner> {
  BannerAd? _bannerAd;
  bool _isLoaded = false;
  bool _showPlaceholder = false;

  // Test ad unit IDs - replace with your actual AdMob ad unit IDs
  static const String _testBannerAdUnitId =
      'ca-app-pub-3940256099942544/6300978111';

  // Production ad unit IDs (set via environment or configuration)
  static const String _prodBannerAdUnitId = String.fromEnvironment(
    'ADMOB_BANNER_UNIT_ID',
    defaultValue: '',
  );

  @override
  void initState() {
    super.initState();
    if (_screenshotMode) {
      return;
    }
    _loadAd();
  }

  void _loadAd() {
    // Use provided ad unit ID, or fall back to prod/test IDs
    final adUnitId =
        widget.adUnitId ??
        (_prodBannerAdUnitId.isNotEmpty
            ? _prodBannerAdUnitId
            : _testBannerAdUnitId);

    // If no valid ad unit ID, show placeholder
    if (adUnitId.isEmpty) {
      setState(() {
        _showPlaceholder = true;
      });
      return;
    }

    _bannerAd = BannerAd(
      adUnitId: adUnitId,
      request: const AdRequest(),
      size: widget.adSize,
      listener: BannerAdListener(
        onAdLoaded: (ad) {
          debugPrint('$ad loaded.');
          setState(() {
            _isLoaded = true;
          });
        },
        onAdFailedToLoad: (ad, err) {
          debugPrint('BannerAd failed to load: $err');
          ad.dispose();
          setState(() {
            _showPlaceholder = true;
          });
        },
      ),
    )..load();
  }

  @override
  void dispose() {
    _bannerAd?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = AppDesignTokens.colorScheme(
      Theme.of(context).brightness,
    );
    final defaultMargin = EdgeInsets.symmetric(
      vertical: AppDesignTokens.space3,
    );

    // Check if user is premium - hide ads for premium users
    return Consumer<PremiumService>(
      builder: (context, premiumService, child) {
        if (!premiumService.shouldShowAds()) {
          return const SizedBox.shrink(); // Hide ads for premium users
        }

        if (_screenshotMode) {
          return const SizedBox.shrink();
        }

        // Show placeholder when no ads configured or failed to load
        if (_showPlaceholder || _bannerAd == null) {
          return Container(
            margin: widget.margin ?? defaultMargin,
            padding: EdgeInsets.all(AppDesignTokens.space3),
            decoration: BoxDecoration(
              color: colorScheme.surface,
              border: Border.all(color: colorScheme.border, width: 1.0),
              borderRadius: BorderRadius.circular(AppDesignTokens.radiusBase),
            ),
            child: Center(
              child: Text(
                'Ad placeholder — configure ADMOB_BANNER_UNIT_ID to enable ads',
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(color: colorScheme.muted),
                textAlign: TextAlign.center,
              ),
            ),
          );
        }

        // Show loading state
        if (!_isLoaded) {
          return Container(
            margin: widget.margin ?? defaultMargin,
            height: widget.adSize.height.toDouble(),
            child: const Center(child: CircularProgressIndicator()),
          );
        }

        // Show the actual ad
        return Container(
          margin: widget.margin ?? defaultMargin,
          alignment: Alignment.center,
          width: _bannerAd!.size.width.toDouble(),
          height: _bannerAd!.size.height.toDouble(),
          child: AdWidget(ad: _bannerAd!),
        );
      },
    );
  }
}

/// Interstitial ad helper for premium features
class InterstitialAdHelper {
  static InterstitialAd? _interstitialAd;
  static bool _isLoaded = false;

  // Test interstitial ad unit ID
  static const String _testInterstitialAdUnitId =
      'ca-app-pub-3940256099942544/1033173712';
  static const String _prodInterstitialAdUnitId = String.fromEnvironment(
    'ADMOB_INTERSTITIAL_UNIT_ID',
    defaultValue: '',
  );

  static void loadAd() {
    final adUnitId = _prodInterstitialAdUnitId.isNotEmpty
        ? _prodInterstitialAdUnitId
        : _testInterstitialAdUnitId;

    InterstitialAd.load(
      adUnitId: adUnitId,
      request: const AdRequest(),
      adLoadCallback: InterstitialAdLoadCallback(
        onAdLoaded: (InterstitialAd ad) {
          debugPrint('$ad loaded');
          _interstitialAd = ad;
          _isLoaded = true;
          _setFullScreenContentCallback();
        },
        onAdFailedToLoad: (LoadAdError error) {
          debugPrint('InterstitialAd failed to load: $error.');
          _interstitialAd = null;
          _isLoaded = false;
        },
      ),
    );
  }

  static void _setFullScreenContentCallback() {
    _interstitialAd?.fullScreenContentCallback = FullScreenContentCallback(
      onAdShowedFullScreenContent: (dynamic ad) =>
          debugPrint('$ad onAdShowedFullScreenContent.'),
      onAdDismissedFullScreenContent: (dynamic ad) {
        debugPrint('$ad onAdDismissedFullScreenContent.');
        ad.dispose();
        loadAd(); // Load the next ad
      },
      onAdFailedToShowFullScreenContent: (dynamic ad, AdError error) {
        debugPrint('$ad onAdFailedToShowFullScreenContent: $error');
        ad.dispose();
        loadAd(); // Load the next ad
      },
    );
  }

  static void showAd() {
    // Check if user is premium - don't show ads for premium users
    // Note: This would need to be called from a context where PremiumService is available
    // For now, we'll keep the existing logic but this should be updated in the calling code
    if (_isLoaded && _interstitialAd != null) {
      _interstitialAd!.show();
      _isLoaded = false;
    } else {
      debugPrint('Interstitial ad not ready');
      loadAd(); // Try to load if not already loaded
    }
  }

  static void dispose() {
    _interstitialAd?.dispose();
    _interstitialAd = null;
    _isLoaded = false;
  }
}

/// Rewarded ad helper for premium features
class RewardedAdHelper {
  static RewardedAd? _rewardedAd;
  static bool _isLoaded = false;

  // Test rewarded ad unit ID
  static const String _testRewardedAdUnitId =
      'ca-app-pub-3940256099942544/5224354917';
  static const String _prodRewardedAdUnitId = String.fromEnvironment(
    'ADMOB_REWARDED_UNIT_ID',
    defaultValue: '',
  );

  static void loadAd() {
    final adUnitId = _prodRewardedAdUnitId.isNotEmpty
        ? _prodRewardedAdUnitId
        : _testRewardedAdUnitId;

    RewardedAd.load(
      adUnitId: adUnitId,
      request: const AdRequest(),
      rewardedAdLoadCallback: RewardedAdLoadCallback(
        onAdLoaded: (RewardedAd ad) {
          debugPrint('$ad loaded.');
          _rewardedAd = ad;
          _isLoaded = true;
          _setFullScreenContentCallback();
        },
        onAdFailedToLoad: (LoadAdError error) {
          debugPrint('RewardedAd failed to load: $error');
          _rewardedAd = null;
          _isLoaded = false;
        },
      ),
    );
  }

  static void _setFullScreenContentCallback() {
    _rewardedAd?.fullScreenContentCallback = FullScreenContentCallback(
      onAdShowedFullScreenContent: (dynamic ad) =>
          debugPrint('$ad onAdShowedFullScreenContent.'),
      onAdDismissedFullScreenContent: (dynamic ad) {
        debugPrint('$ad onAdDismissedFullScreenContent.');
        ad.dispose();
        loadAd(); // Load the next ad
      },
      onAdFailedToShowFullScreenContent: (dynamic ad, AdError error) {
        debugPrint('$ad onAdFailedToShowFullScreenContent: $error');
        ad.dispose();
        loadAd(); // Load the next ad
      },
    );
  }

  static Future<void> showAd({
    required OnUserEarnedRewardCallback onUserEarnedReward,
  }) async {
    if (_isLoaded && _rewardedAd != null) {
      await _rewardedAd!.show(onUserEarnedReward: onUserEarnedReward);
      _isLoaded = false;
    } else {
      debugPrint('Rewarded ad not ready');
      loadAd(); // Try to load if not already loaded
    }
  }

  static void dispose() {
    _rewardedAd?.dispose();
    _rewardedAd = null;
    _isLoaded = false;
  }
}
