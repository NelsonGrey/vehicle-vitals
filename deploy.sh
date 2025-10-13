#!/bin/bash

# Vehicle Vitals Deployment Script
# Usage: ./deploy.sh [environment]
# Environments: production, staging, development

set -e

ENVIRONMENT=${1:-production}

echo "🚀 Deploying Vehicle Vitals to $ENVIRONMENT environment"

# Validate environment
case $ENVIRONMENT in
    production|staging|development)
        echo "✅ Environment: $ENVIRONMENT"
        ;;
    *)
        echo "❌ Invalid environment: $ENVIRONMENT"
        echo "Valid options: production, staging, development"
        exit 1
        ;;
esac

# Set Firebase project
case $ENVIRONMENT in
    production)
        FIREBASE_PROJECT="vehicle-vitals-prod"
        BUILD_CMD="npm run build"
        ;;
    staging)
        FIREBASE_PROJECT="vehicle-vitals-staging"
        BUILD_CMD="npm run build:staging"
        ;;
    development)
        FIREBASE_PROJECT="vehicle-vitals-dev"
        BUILD_CMD="npm run build:development"
        ;;
esac

echo "🔧 Building application..."
cd packages/web
eval $BUILD_CMD

echo "📦 Deploying to Firebase..."
firebase use $FIREBASE_PROJECT
firebase deploy --only hosting

echo "✅ Deployment complete!"
echo "🌐 Your app is live at: https://$FIREBASE_PROJECT.web.app"