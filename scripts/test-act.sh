#!/bin/bash

# Act Workflow Testing Script for Vehicle Vitals
# Test GitHub Actions workflows locally with act to avoid consuming Actions minutes

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚗 Vehicle Vitals - Act Workflow Testing${NC}"
echo -e "${BLUE}=========================================${NC}"

cd "$PROJECT_ROOT"

# Check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

    # Check if act is installed
    if ! command -v act &> /dev/null; then
        echo -e "${RED}❌ act CLI is not installed${NC}"
        echo -e "${YELLOW}Install with: brew install act${NC}"
        exit 1
    fi

    # Check if Docker is running
    if ! docker info &> /dev/null; then
        echo -e "${RED}❌ Docker is not running${NC}"
        echo -e "${YELLOW}Start Docker Desktop and try again${NC}"
        exit 1
    fi

    # Check for secrets file
    if [ ! -f ".act-secrets/test-secrets" ]; then
        echo -e "${RED}❌ Test secrets file not found${NC}"
        echo -e "${YELLOW}Creating test secrets file...${NC}"
        create_test_secrets
    fi

    echo -e "${GREEN}✅ Prerequisites met${NC}"
}

# Create test secrets file
create_test_secrets() {
    cat > .act-secrets/test-secrets << EOF
# Test secrets for local act testing
# These are safe mock values for testing workflow logic
FIREBASE_TOKEN=test_firebase_token
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"test-project"}
FIREBASE_SERVICE_ACCOUNT_DEVELOPMENT={"type":"service_account","project_id":"vehicle-vitals-dev"}
FIREBASE_SERVICE_ACCOUNT_STAGING={"type":"service_account","project_id":"vehicle-vitals-staging"}
FIREBASE_SERVICE_ACCOUNT_PRODUCTION={"type":"service_account","project_id":"vehicle-vitals-prod"}
FIREBASE_SERVICE_ACCOUNT_KEY_ANDROID=test_android_key
FIREBASE_SERVICE_ACCOUNT_KEY_IOS=test_ios_key
IOS_SERVICE_ACCOUNT_KEY=test_ios_service_account
ADMOB_BANNER_UNIT_ID_ANDROID=test_admob_android_banner
ADMOB_INTERSTITIAL_UNIT_ID_ANDROID=test_admob_android_interstitial
ADMOB_REWARDED_UNIT_ID_ANDROID=test_admob_android_rewarded
ADMOB_BANNER_UNIT_ID_IOS=test_admob_ios_banner
ADMOB_INTERSTITIAL_UNIT_ID_IOS=test_admob_ios_interstitial
ADMOB_REWARDED_UNIT_ID_IOS=test_admob_ios_rewarded
EOF
    echo -e "${GREEN}✅ Test secrets created${NC}"
}

# Setup Docker images (one-time setup)
setup_docker_images() {
    echo -e "${YELLOW}🐳 Setting up optimized Docker images for act...${NC}"

    # Use smaller, optimized images
    docker pull node:18-alpine || echo "Failed to pull Node.js Alpine image"
    docker pull node:18-slim || echo "Failed to pull Node.js slim image"

    # Create optimized act image (much smaller than catthehacker/ubuntu)
    echo -e "${YELLOW}Building custom lightweight act image...${NC}"
    cat > Dockerfile.act << EOF
FROM node:18-alpine
RUN apk add --no-cache bash git curl jq
RUN npm install -g @actions/core @actions/github
EOF
    docker build -f Dockerfile.act -t act-lightweight:latest . && rm Dockerfile.act

    echo -e "${GREEN}✅ Optimized Docker images setup${NC}"
}

# Test specific workflow
test_workflow() {
    local workflow="$1"
    local job="$2"
    local event="${3:-push}"

    echo -e "${YELLOW}🧪 Testing workflow: $workflow${NC}"
    echo -e "${YELLOW}Job: $job${NC}"
    echo -e "${YELLOW}Event: $event${NC}"
    echo ""

    # Use optimized container options
    local act_cmd="act -W .github/workflows/$workflow.yml"
    act_cmd="$act_cmd --secret-file .act-secrets/test-secrets"
    act_cmd="$act_cmd --job $job"
    act_cmd="$act_cmd --container-architecture linux/amd64"
    act_cmd="$act_cmd --pull=false"
    act_cmd="$act_cmd --rm"  # Auto-remove containers after run
    act_cmd="$act_cmd --use-new-action-cache=false"  # Disable action cache to save space
    act_cmd="$act_cmd --artifact-server-path /tmp/act-artifacts"  # Use temp directory

    # Use lightweight image for Node.js jobs
    if [[ "$workflow" == "ci-cd-pipeline" && "$job" == "quality-check" ]]; then
        act_cmd="$act_cmd --container-options=\"--memory=1g --cpus=1\""
        act_cmd="$act_cmd -P ubuntu-latest=node:18-slim"
    elif [[ "$workflow" == "ci-cd-pipeline" && "$job" =~ ^(build-packages|deploy-web)$ ]]; then
        act_cmd="$act_cmd --container-options=\"--memory=2g --cpus=2\""
        act_cmd="$act_cmd -P ubuntu-latest=node:18-slim"
    elif [[ "$workflow" =~ ^(android-distribution|ios-distribution)$ ]]; then
        act_cmd="$act_cmd --container-options=\"--memory=2g --cpus=2\""
        # Use node:18-slim for Flutter jobs to avoid architecture issues
        act_cmd="$act_cmd -P ubuntu-latest=node:18-slim"
    fi

    # Add event-specific options
    case $event in
        "push")
            act_cmd="$act_cmd --eventpath .github/workflows/test-events/push.json"
            ;;
        "workflow_dispatch")
            act_cmd="$act_cmd --eventpath .github/workflows/test-events/workflow_dispatch.json"
            ;;
    esac

    echo "Running: $act_cmd"
    echo ""

    # Run with timeout and cleanup
    if command -v timeout >/dev/null 2>&1; then
        if timeout 600 eval "$act_cmd"; then
            echo -e "${GREEN}✅ Workflow test passed${NC}"
        else
            local exit_code=$?
            if [[ $exit_code -eq 124 ]]; then
                echo -e "${YELLOW}⏰ Workflow test timed out (10 minutes)${NC}"
            else
                echo -e "${RED}❌ Workflow test failed${NC}"
            fi
            echo -e "${YELLOW}💡 This is expected - fix issues locally before pushing to GitHub${NC}"
        fi
    elif command -v gtimeout >/dev/null 2>&1; then
        if gtimeout 600 eval "$act_cmd"; then
            echo -e "${GREEN}✅ Workflow test passed${NC}"
        else
            local exit_code=$?
            if [[ $exit_code -eq 124 ]]; then
                echo -e "${YELLOW}⏰ Workflow test timed out (10 minutes)${NC}"
            else
                echo -e "${RED}❌ Workflow test failed${NC}"
            fi
            echo -e "${YELLOW}💡 This is expected - fix issues locally before pushing to GitHub${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Timeout command not available, running without timeout protection${NC}"
        if eval "$act_cmd"; then
            echo -e "${GREEN}✅ Workflow test passed${NC}"
        else
            echo -e "${RED}❌ Workflow test failed${NC}"
            echo -e "${YELLOW}💡 This is expected - fix issues locally before pushing to GitHub${NC}"
        fi
    fi

    # Cleanup any remaining containers
    docker stop $(docker ps -aq --filter "name=act-") 2>/dev/null || true
    docker rm $(docker ps -aq --filter "name=act-") 2>/dev/null || true
}

# Cleanup Docker resources
cleanup_docker() {
    echo -e "${YELLOW}🧹 Cleaning up Docker resources...${NC}"

    # Stop and remove act containers
    docker stop $(docker ps -aq --filter "name=act-") 2>/dev/null || true
    docker rm $(docker ps -aq --filter "name=act-") 2>/dev/null || true

    # Remove act volumes
    docker volume rm $(docker volume ls -q --filter "name=act-") 2>/dev/null || true

    # Prune system
    docker system prune -f

    echo -e "${GREEN}✅ Docker cleanup completed${NC}"
}

# Create test event files
create_test_events() {
    echo -e "${YELLOW}📝 Creating test event files...${NC}"

    mkdir -p .github/workflows/test-events

    # Push event
    cat > .github/workflows/test-events/push.json << EOF
{
  "push": {
    "ref": "refs/heads/develop",
    "head_commit": {
      "message": "Test commit [DRY-RUN]"
    }
  }
}
EOF

    # Workflow dispatch event
    cat > .github/workflows/test-events/workflow_dispatch.json << EOF
{
  "inputs": {
    "environment": "development",
    "build_type": "debug",
    "release_notes": "Test build from act"
  }
}
EOF

    echo -e "${GREEN}✅ Test event files created${NC}"
}

# Main menu
main_menu() {
    echo ""
    echo -e "${BLUE}Choose workflow to test:${NC}"
    echo "1. 🚀 CI/CD Pipeline - Quality Check"
    echo "2. 🚀 CI/CD Pipeline - Build Packages"
    echo "3. 🚀 CI/CD Pipeline - Deploy Web"
    echo "4. 📱 Android Distribution"
    echo "5. 🍎 iOS Distribution"
    echo "6. 🔐 Test Secrets"
    echo "7. 🐳 Setup Docker Images (one-time)"
    echo "8. 📝 Create Test Events"
    echo "9. 🧹 Cleanup Docker Resources"
    echo "0. Exit"
    echo ""

    read -p "Enter choice (0-9): " choice

    case $choice in
        1)
            test_workflow "ci-cd-pipeline" "quality-check" "push"
            ;;
        2)
            test_workflow "ci-cd-pipeline" "build-packages" "workflow_dispatch"
            ;;
        3)
            test_workflow "ci-cd-pipeline" "deploy-web" "workflow_dispatch"
            ;;
        4)
            test_workflow "android-distribution" "distribute-android" "push"
            ;;
        5)
            test_workflow "ios-distribution" "distribute-ios" "push"
            ;;
        6)
            test_workflow "test-secrets" "test-secrets" "workflow_dispatch"
            ;;
        7)
            setup_docker_images
            ;;
        8)
            create_test_events
            ;;
        9)
            cleanup_docker
            ;;
        0)
            echo -e "${GREEN}👋 Goodbye!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Invalid choice${NC}"
            ;;
    esac

    # Loop back to menu
    main_menu
}

# Run main function
check_prerequisites
main_menu