#!/bin/bash

# Safe Commit Script for Vehicle Vitals
# Provides multiple commit types with cost-effective CI/CD integration
# Allows testing commits without triggering expensive GitHub Actions

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
DEFAULT_BRANCH="develop"
PRODUCTION_BRANCHES=("main" "staging")

echo -e "${BLUE}🚗 Vehicle Vitals - Safe Commit Script${NC}"
echo -e "${BLUE}======================================${NC}"

# Check if we're on a safe branch
check_branch() {
    local current_branch=$(git branch --show-current)

    if [[ " ${PRODUCTION_BRANCHES[*]} " =~ " ${current_branch} " ]]; then
        echo -e "${YELLOW}⚠️  You're on branch '$current_branch' - commits here will trigger GitHub Actions!${NC}"
        echo -e "${YELLOW}💡 Consider switching to '$DEFAULT_BRANCH' for development work${NC}"
        echo ""
        read -p "Continue anyway? (y/N): " confirm
        if [[ ! $confirm =~ ^[Yy]$ ]]; then
            echo -e "${BLUE}👋 Commit cancelled${NC}"
            exit 0
        fi
    fi
}

# Show commit type menu
show_commit_menu() {
    echo -e "${CYAN}Choose commit type:${NC}"
    echo ""
    echo -e "${GREEN}🚀 Production Commits (trigger GitHub Actions):${NC}"
    echo "  1. feat      - New feature"
    echo "  2. fix       - Bug fix"
    echo "  3. perf      - Performance improvement"
    echo "  4. refactor  - Code refactoring"
    echo "  5. style     - Code style changes"
    echo "  6. test      - Adding/modifying tests"
    echo "  7. ci        - CI/CD changes"
    echo "  8. docs      - Documentation changes"
    echo "  9. chore     - Maintenance tasks"
    echo ""
    echo -e "${YELLOW}🧪 Development Commits (safe, no Actions trigger):${NC}"
    echo " 10. wip       - Work in progress [SAFE]"
    echo " 11. experiment- Experimental changes [SAFE]"
    echo " 12. spike     - Investigation/spike [SAFE]"
    echo " 13. draft     - Draft implementation [SAFE]"
    echo ""
    echo -e "${PURPLE}🔬 Testing Commits (minimal Actions usage):${NC}"
    echo " 14. dry-run   - Test deployment [DRY-RUN]"
    echo " 15. test-deploy- Test deployment to dev [TEST-DEPLOY]"
    echo ""
    echo "  0. Cancel"
    echo ""
}

# Get commit details
get_commit_details() {
    local commit_type="$1"

    case $commit_type in
        1) type="feat"; scope=""; trigger="production" ;;
        2) type="fix"; scope=""; trigger="production" ;;
        3) type="perf"; scope=""; trigger="production" ;;
        4) type="refactor"; scope=""; trigger="production" ;;
        5) type="style"; scope=""; trigger="production" ;;
        6) type="test"; scope=""; trigger="production" ;;
        7) type="ci"; scope=""; trigger="production" ;;
        8) type="docs"; scope=""; trigger="production" ;;
        9) type="chore"; scope=""; trigger="production" ;;
        10) type="feat"; scope=""; trigger="safe"; message_suffix="[SAFE]" ;;
        11) type="feat"; scope=""; trigger="safe"; message_suffix="[SAFE]" ;;
        12) type="feat"; scope=""; trigger="safe"; message_suffix="[SAFE]" ;;
        13) type="feat"; scope=""; trigger="safe"; message_suffix="[SAFE]" ;;
        14) type="test"; scope=""; trigger="dry-run"; message_suffix="[DRY-RUN]" ;;
        15) type="deploy"; scope=""; trigger="test-deploy"; message_suffix="[TEST-DEPLOY]" ;;
        *) echo -e "${RED}❌ Invalid commit type${NC}"; exit 1 ;;
    esac

    # Get scope if applicable
    if [[ $commit_type -le 9 ]]; then
        echo -e "${CYAN}Enter scope (optional, press Enter to skip):${NC}"
        read -r scope_input
        if [[ -n "$scope_input" ]]; then
            scope="($scope_input)"
        fi
    fi

    # Get commit message
    echo -e "${CYAN}Enter commit message:${NC}"
    read -r message

    if [[ -z "$message" ]]; then
        echo -e "${RED}❌ Commit message cannot be empty${NC}"
        exit 1
    fi

    # Build full commit message
    full_message=""
    if [[ -n "$type" ]]; then
        full_message="$type$scope: $message"
    else
        full_message="$message"
    fi

    if [[ -n "$message_suffix" ]]; then
        full_message="$full_message $message_suffix"
    fi

    # Return values
    echo "$full_message"
    echo "$trigger"
}

# Show commit preview and confirm
confirm_commit() {
    local message="$1"
    local trigger="$2"
    local current_branch=$(git branch --show-current)

    echo ""
    echo -e "${BLUE}📋 Commit Preview:${NC}"
    echo -e "Branch: ${YELLOW}$current_branch${NC}"
    echo -e "Message: ${GREEN}$message${NC}"

    case $trigger in
        "production")
            echo -e "Trigger: ${RED}🚀 Production (will trigger GitHub Actions)${NC}"
            ;;
        "safe")
            echo -e "Trigger: ${GREEN}🛡️ Safe (no GitHub Actions)${NC}"
            ;;
        "dry-run")
            echo -e "Trigger: ${YELLOW}🔬 Dry Run (minimal Actions usage)${NC}"
            ;;
        "test-deploy")
            echo -e "Trigger: ${PURPLE}🧪 Test Deploy (development environment only)${NC}"
            ;;
    esac

    echo ""
    read -p "Proceed with commit? (y/N): " confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}👋 Commit cancelled${NC}"
        exit 0
    fi
}

# Perform the commit
do_commit() {
    local message="$1"
    local trigger="$2"

    echo ""
    echo -e "${BLUE}📝 Creating commit...${NC}"

    # Stage all changes if none staged
    if [[ -z $(git diff --cached --name-only) ]]; then
        echo -e "${YELLOW}Staging all changes...${NC}"
        git add .
    fi

    # Create the commit
    git commit -m "$message"

    echo ""
    echo -e "${GREEN}✅ Commit created successfully!${NC}"

    # Show next steps based on trigger type
    case $trigger in
        "production")
            echo -e "${RED}🚀 This commit will trigger GitHub Actions when pushed to main/staging${NC}"
            echo -e "${YELLOW}💡 Remember to test locally first: ./scripts/test-cicd-local.sh${NC}"
            ;;
        "safe")
            echo -e "${GREEN}🛡️ Safe commit - no GitHub Actions will be triggered${NC}"
            ;;
        "dry-run")
            echo -e "${YELLOW}🔬 Dry-run commit - use for testing deployment logic${NC}"
            ;;
        "test-deploy")
            echo -e "${PURPLE}🧪 Test deploy commit - will deploy to development environment${NC}"
            ;;
    esac

    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "  • Push: git push origin $current_branch"
    echo "  • Test locally: ./scripts/test-cicd-local.sh"
    echo "  • Test with act: ./scripts/test-act.sh"
}

# Main function
main() {
    cd "$PROJECT_ROOT"

    # Check git status
    if [[ -z $(git status --porcelain) ]]; then
        echo -e "${YELLOW}⚠️  No changes to commit${NC}"
        echo -e "${BLUE}💡 Make some changes first, then run this script${NC}"
        exit 0
    fi

    # Check current branch
    check_branch

    # Show menu and get choice
    show_commit_menu
    read -p "Enter choice (0-15): " choice

    if [[ "$choice" == "0" ]]; then
        echo -e "${BLUE}👋 Goodbye!${NC}"
        exit 0
    fi

    # Get commit details
    commit_details=$(get_commit_details "$choice")
    message=$(echo "$commit_details" | head -n1)
    trigger=$(echo "$commit_details" | tail -n1)

    # Confirm and commit
    confirm_commit "$message" "$trigger"
    do_commit "$message" "$trigger"
}

# Run main function
main "$@"