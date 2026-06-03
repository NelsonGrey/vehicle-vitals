#!/bin/bash

# Vehicle Vitals Deployment Script
# Usage: ./deploy.sh [environment]
# Environments: production, staging, development, demonstration

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

ENVIRONMENT=${1:-production}

echo "🚀 Deploying Vehicle Vitals to $ENVIRONMENT environment"

# Validate environment
case $ENVIRONMENT in
    production|staging|development|demonstration)
        echo "✅ Environment: $ENVIRONMENT"
        ;;
    *)
        echo "❌ Invalid environment: $ENVIRONMENT"
        echo "Valid options: production, staging, development, demonstration"
        exit 1
        ;;
esac

# Set Firebase project
case $ENVIRONMENT in
    production)
        FIREBASE_PROJECT="vehicle-vitals-prod"
        ;;
    staging)
        FIREBASE_PROJECT="vehicle-vitals-staging"
        ;;
    development)
        FIREBASE_PROJECT="vehicle-vitals-dev"
        ;;
    demonstration)
        FIREBASE_PROJECT="vehicle-vitals-dev"
        ;;
esac

echo "📦 Triggering Firebase App Hosting rollout..."

case $ENVIRONMENT in
    production)
        GIT_BRANCH="main"
        ;;
    staging)
        GIT_BRANCH="staging"
        ;;
    *)
        GIT_BRANCH="develop"
        ;;
esac

firebase apphosting:rollouts:create vehicle-vitals --project "$FIREBASE_PROJECT" --git-branch "$GIT_BRANCH" --force

echo "✅ Deployment complete!"
echo "🌐 App Hosting URL: https://vehicle-vitals--$FIREBASE_PROJECT.us-central1.hosted.app"