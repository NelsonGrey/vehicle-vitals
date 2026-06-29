# Vehicle Vitals - Beta Testing Guide

> **Status**: Archived beta guide. Legacy mobile distribution channel instructions are currently on hold/inactive.

## 🚀 Beta Testing Status

This guide is historical. Current active validation focuses on web and iOS build/release readiness.

### ✅ Completed

- **Web App**: Live at https://vehicle-vitals-prod.web.app
- **Android App**: On hold (no active Play Store test/deploy path)
- **iOS App**: Build validation active; distribution channels are controlled separately
- **Features**: Tailwind CSS styling, AdSense/AdMob integration, Firebase backend

### 📱 Mobile App Distribution

Legacy Android and iOS distribution instructions below are retained as historical reference only.

#### Android (Google Play Store Beta)

1. **Upload to Play Console**:
   - Go to [Google Play Console](https://play.google.com/console)
   - Create/select your app
   - Go to "Testing" → "Internal testing"
   - Upload `packages/mobile/build/app/outputs/bundle/release/app-release.aab`
   - Add tester emails and release notes

2. **App Bundle Location**: `packages/mobile/build/app/outputs/bundle/release/app-release.aab` (59.3MB)

#### iOS (Legacy Beta Channel)

1. **Prerequisites**:
   - Apple Developer Program membership ($99/year)
   - Xcode installed on macOS

2. **Code Signing Setup**:

   ```bash
   # Open Xcode and select your project
   open packages/mobile/ios/Runner.xcworkspace

   # In Xcode:
   # 1. Select your app target
   # 2. Go to Signing & Capabilities
   # 3. Select your development team
   # 4. Enable "Automatically manage signing"
   ```

3. **Build for Beta Validation**:

   ```bash
   cd packages/mobile
   flutter build ios --release
   ```

4. **Upload to App Store Connect**:
   - Open Xcode → Product → Archive
   - Upload to App Store Connect
   - Add internal pre-release testers as needed

### 🌐 Web App Testing

- **URL**: https://vehicle-vitals-prod.web.app
- **Features to Test**:
  - User registration/login
  - Vehicle management (add/edit/delete)
  - Maintenance tracking
  - AdSense ad display
  - Responsive design on mobile devices

### 📊 Beta Testing Checklist

#### Pre-Launch

- [ ] Set up beta tester list (aim for 10-50 users)
- [ ] Create beta testing feedback form
- [ ] Prepare welcome email for beta testers
- [x] Set up crash reporting (Firebase Crashlytics) — wired in `packages/mobile/lib/main.dart` and `error_boundary.dart`
- [ ] Configure analytics (Google Analytics)

#### During Beta

- [ ] Monitor crash reports
- [ ] Collect user feedback
- [ ] Track feature usage
- [ ] Monitor ad performance
- [ ] Address critical bugs promptly

#### Post-Beta

- [ ] Analyze feedback and usage data
- [ ] Plan feature improvements
- [ ] Prepare for production launch
- [ ] Update app store listings

### 🔧 Beta Testing Tools

#### Analytics & Monitoring

- **Firebase Analytics**: Track user behavior
- **Firebase Crashlytics**: Monitor crashes
- **Google Analytics**: Web app analytics
- **AdMob/ AdSense**: Revenue tracking

#### Feedback Collection

- **Google Forms**: Beta feedback survey
- **Firebase Remote Config**: Feature flags for A/B testing
- **In-app feedback**: Consider adding feedback forms

### 📈 Success Metrics

Track these during beta:

- **User Engagement**: Daily/weekly active users
- **Retention**: User return rates
- **Crash Rate**: <1% target
- **Ad Performance**: Impressions, clicks, revenue
- **Feature Usage**: Which features are most/least used

### 🚨 Common Beta Issues

#### Android

- **Signing Issues**: Ensure keystore passwords are correct
- **Play Store Review**: May take 1-2 days for beta approval
- **Device Compatibility**: Test on various Android versions

#### iOS

- **Code Signing**: Requires valid Apple Developer certificates
- **Beta Channel Limits**: Account-dependent tester limits apply
- **App Review**: Apple may review pre-release builds depending on channel usage

#### Web

- **Browser Compatibility**: Test on Chrome, Safari, Firefox, Edge
- **Mobile Web**: Ensure responsive design works on phones
- **Ad Blocking**: Some users may block ads

### 📞 Support During Beta

- **Response Time**: Aim for <24 hours for bug reports
- **Communication**: Regular updates to beta testers
- **Bug Priority**: Focus on crashes and core functionality first
- **Feature Requests**: Collect but don't implement during beta

### 🎯 Next Steps (Current)

1. **Run web production verification** against live hosting
2. **Validate iOS build/signing readiness** in CI
3. **Resolve mobile mock/stub backend gaps** before broad beta rollout
4. **Resume Android track only after test/deploy path is re-established**
5. **Plan staged distribution after platform readiness checks pass**

---

**Beta Testing Coordinator**: Mark Nelson
**Project**: Vehicle Vitals
**Date**: October 19, 2025
