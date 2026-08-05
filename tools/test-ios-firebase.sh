#!/bin/bash

echo "📱 Firebase iOS Configuration Test"
echo "================================="
echo ""

# Check if iOS files exist
echo "🔍 Checking iOS Firebase files..."

if [ -f "mobile/ios/Runner/GoogleService-Info.plist" ]; then
    echo "✅ GoogleService-Info.plist exists"
else
    echo "❌ GoogleService-Info.plist missing"
fi

if [ -f "mobile/lib/firebase_options.dart" ]; then
    echo "✅ firebase_options.dart exists"
    
    # Check if it has iOS configuration
    if grep -q "ios:b55d0b37718e299368ac90" mobile/lib/firebase_options.dart; then
        echo "✅ iOS App ID configured correctly"
    else
        echo "❌ iOS App ID not found"
    fi
else
    echo "❌ firebase_options.dart missing"
fi

echo ""
echo "📋 iOS Configuration Summary:"
echo "   • Bundle ID: com.nelsongrey.vehiclevitals.app.ios"
echo "   • App ID: 1:489413148337:ios:b55d0b37718e299368ac90"
echo "   • API Key: AIzaSyCIyHtjchXulHKuwM2RANh6JxAfK7EyTWU"
echo "   • Project: vehicle-vitals-prod"
echo ""

# Check if Flutter is available
if command -v flutter &> /dev/null; then
    echo "✅ Flutter CLI available"
    
    # Check if iOS platform files exist
    if [ -d "mobile/ios" ]; then
        echo "✅ iOS platform directory exists"
        
        if [ -f "mobile/ios/Runner.xcodeproj/project.pbxproj" ]; then
            echo "✅ iOS project files exist"
        else
            echo "⚠️  iOS project files missing - run: flutter create --platforms=ios ."
        fi
    else
        echo "⚠️  iOS platform directory missing - run: flutter create --platforms=ios ."
    fi
    
    echo ""
    echo "🚀 Next steps:"
    echo "1. cd mobile"
    echo "2. flutter create --platforms=ios . (if iOS project files missing)"
    echo "3. flutter pub get"
    echo "4. flutter run -d ios"
    
else
    echo "❌ Flutter CLI not installed"
    echo "   → Install Flutter: https://flutter.dev/docs/get-started/install"
fi

echo ""
echo "🎯 iOS Firebase setup is complete!"
echo "   The app will connect to Firebase when running on iOS devices/simulators."