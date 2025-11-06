#!/bin/bash

# Firebase Setup Script for Vehicle Vitals
echo "🔥 Firebase Setup for Vehicle Vitals"
echo "======================================"
echo ""

echo "This script will help you set up Firebase for the Vehicle Vitals project."
echo ""

echo "📋 Prerequisites:"
echo "1. Firebase account (https://firebase.google.com/)"
echo "2. Firebase CLI installed (npm install -g firebase-tools)"
echo "3. Firebase project created in the Firebase console"
echo ""

echo "🚀 Steps to complete Firebase setup:"
echo ""

echo "1️⃣ Create a Firebase Project:"
echo "   • Go to https://console.firebase.google.com/"
echo "   • Click 'Create a project'"
echo "   • Name it 'vehicle-vitals' or similar"
echo "   • Enable Google Analytics (optional)"
echo ""

echo "2️⃣ Enable Firebase Services:"
echo "   • Authentication: Enable Email/Password and Google sign-in"
echo "   • Firestore Database: Create in production mode"
echo "   • Hosting: Enable for web deployment"
echo ""

echo "3️⃣ Get Web App Configuration:"
echo "   • In Firebase Console > Project Settings > General"
echo "   • Scroll to 'Your apps' section"
echo "   • Click 'Add app' > Web"
echo "   • Register app as 'Vehicle Vitals Web'"
echo "   • Copy the config object"
echo ""

echo "4️⃣ Configure Flutter (Optional):"
echo "   • Run: cd mobile && flutter pub global activate flutterfire_cli"
echo "   • Run: flutterfire configure"
echo "   • Select your Firebase project"
echo ""

echo "6️⃣ Deploy Firestore Rules:"
echo "   • Run: firebase login"
echo "   • Run: firebase use --add (select your project)"
echo "   • Run: firebase deploy --only firestore:rules"
echo ""

echo "Need help? Check the README.md for detailed instructions."
echo ""
echo "🎯 After setup, test the connection by running: npm run dev:web"