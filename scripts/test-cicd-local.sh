#!/bin/bash

# Local CI/CD Testing Script for Vehicle Vitals
# This script allows testing deployment workflows locally without consuming GitHub Actions minutes

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="${1:-development}"
DRY_RUN="${2:-true}"
WORKFLOW="${3:-master-pipeline}"

echo -e "${BLUE}🚗 Vehicle Vitals - Local CI/CD Testing Script${NC}"
echo -e "${BLUE}===============================================${NC}"
echo "Environment: $ENVIRONMENT"
echo "Dry Run: $DRY_RUN"
echo "Workflow: $WORKFLOW"
echo ""

# Check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is not installed${NC}"
        exit 1
    fi

    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm is not installed${NC}"
        exit 1
    fi

    # Check if Flutter is installed (for iOS mobile workflows)
    if [[ "$WORKFLOW" =~ ^(ios-distribution)$ ]]; then
        if ! command -v flutter &> /dev/null; then
            echo -e "${RED}❌ Flutter is not installed${NC}"
            exit 1
        fi
    fi

    # Check if Firebase CLI is installed
    if ! command -v firebase &> /dev/null; then
        echo -e "${YELLOW}⚠️  Firebase CLI not found - some tests may be limited${NC}"
    fi

    # Create act secrets file
    mkdir -p .act-secrets
    cat > .act-secrets/secrets << EOF
FIREBASE_TOKEN=${FIREBASE_TOKEN:-test_token}
FIREBASE_SERVICE_ACCOUNT_KEY=${FIREBASE_SERVICE_ACCOUNT_KEY:-"{}"}
EOF

    echo -e "${GREEN}✅ Environment setup complete${NC}"
}

# Test quality checks locally
test_quality_checks() {
    echo -e "${YELLOW}🔍 Running quality checks locally...${NC}"

    cd "$PROJECT_ROOT"

    # Install dependencies
    echo "Installing dependencies..."
    npm ci

    # Build shared package first
    echo "Building shared package..."
    npm run build --workspace=@vehicle-vitals/shared

    # TypeScript check
    echo "Running TypeScript checks..."
    npm run check --workspaces --if-present

    # Run tests
    echo "Running tests..."
    npm run test --workspaces --if-present

    # Security audit
    echo "Running security audit..."
    npm audit --audit-level=high

    echo -e "${GREEN}✅ Quality checks completed${NC}"
}

# Test build process locally
test_build_process() {
    echo -e "${YELLOW}🏗️ Testing build process locally...${NC}"

    cd "$PROJECT_ROOT"

    # Build packages
    echo "Building packages..."
    npm run build --workspace=@vehicle-vitals/shared
    npm run build --workspace=packages/web

    echo -e "${GREEN}✅ Build process completed${NC}"
}

# Test deployment scripts locally
test_deployment_scripts() {
    echo -e "${YELLOW}🚀 Testing deployment scripts locally...${NC}"

    cd "$PROJECT_ROOT"

    # Test deploy script (dry run)
    if [ -f "deploy.sh" ]; then
        echo "Testing deploy script..."
        chmod +x deploy.sh
        if [ "$DRY_RUN" = "true" ]; then
            echo "DRY RUN: Would execute: ./deploy.sh $ENVIRONMENT"
        else
            echo "⚠️  Running actual deployment - this may incur costs!"
            read -p "Are you sure? (y/N): " confirm
            if [[ $confirm =~ ^[Yy]$ ]]; then
                ./deploy.sh "$ENVIRONMENT"
            else
                echo "Deployment cancelled"
            fi
        fi
    else
        echo -e "${YELLOW}⚠️  deploy.sh not found${NC}"
    fi

    echo -e "${GREEN}✅ Deployment script testing completed${NC}"
}

# Test Firebase CLI locally
test_firebase_cli() {
    echo -e "${YELLOW}🔥 Testing Firebase CLI locally...${NC}"

    cd "$PROJECT_ROOT"

    if command -v firebase &> /dev/null; then
        echo "Checking Firebase projects..."
        firebase projects:list

        echo "Checking current project..."
        firebase use

        if [ "$DRY_RUN" = "true" ]; then
            echo "DRY RUN: Would check Firebase hosting status"
        else
            echo "Checking Firebase hosting status..."
            firebase hosting:sites:list
        fi
    else
        echo -e "${YELLOW}⚠️  Firebase CLI not available${NC}"
    fi

    echo -e "${GREEN}✅ Firebase CLI testing completed${NC}"
}

# Test with act
test_with_act() {
    echo -e "${YELLOW}🧪 Testing workflow with act...${NC}"

    cd "$PROJECT_ROOT"

    # Check if act is available
    if ! command -v act &> /dev/null; then
        echo -e "${RED}❌ act CLI not found${NC}"
        echo -e "${YELLOW}Install with: brew install act${NC}"
        echo -e "${YELLOW}Or run: ./scripts/test-act.sh for interactive testing${NC}"
        return 1
    fi

    # Run specific workflow
    case $WORKFLOW in
        "master-pipeline")
            echo "Testing master-pipeline.yml..."
            act -W .github/workflows/master-pipeline.yml -j quality-gate --secret-file .act-secrets/secrets --env ENVIRONMENT="$ENVIRONMENT" --env DRY_RUN="$DRY_RUN"
            ;;
        "ios-distribution")
            echo "Testing ios-distribution.yml..."
            act -j distribute-ios --secret-file .act-secrets/secrets --env ENVIRONMENT="$ENVIRONMENT" --env DRY_RUN="$DRY_RUN"
            ;;
        "test-secrets")
            echo "Testing test-secrets.yml..."
            act -j test-secrets --secret-file .act-secrets/secrets --env ENVIRONMENT="$ENVIRONMENT" --env DRY_RUN="$DRY_RUN"
            ;;
        *)
            echo -e "${RED}❌ Unknown workflow: $WORKFLOW${NC}"
            return 1
            ;;
    esac
}

# Main testing function
main() {
    check_prerequisites

    echo -e "${BLUE}Choose testing approach:${NC}"
    echo "1. Test quality checks locally"
    echo "2. Test build process locally"
    echo "3. Test deployment scripts locally"
    echo "4. Test Firebase CLI locally"
    echo "5. Test with act (GitHub Actions simulation)"
    echo "6. Run all tests"
    echo ""

    read -p "Enter choice (1-6): " choice

    case $choice in
        1)
            test_quality_checks
            ;;
        2)
            test_build_process
            ;;
        3)
            test_deployment_scripts
            ;;
        4)
            test_firebase_cli
            ;;
        5)
            test_with_act
            ;;
        6)
            test_quality_checks
            test_build_process
            test_deployment_scripts
            test_firebase_cli
            test_with_act
            ;;
        *)
            echo -e "${RED}❌ Invalid choice${NC}"
            exit 1
            ;;
    esac

    echo ""
    echo -e "${GREEN}✅ Local testing complete!${NC}"
    echo -e "${BLUE}💡 Tips:${NC}"
    echo "  - Use DRY_RUN=true to test without actual deployments"
    echo "  - Run ./scripts/test-act.sh for interactive act testing"
    echo "  - Check act documentation: https://github.com/nektos/act"
}

# Run main function
main "$@"
