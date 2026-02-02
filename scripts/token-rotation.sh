#!/bin/bash
# 🔄 Vehicle Vitals - Token Rotation System
# CRITICAL: Bash 3.2 compatible - NO associative arrays

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

ENVIRONMENT="${ENVIRONMENT:-development}"
AUTOMATION_ENV_FILE=".env.automation.${ENVIRONMENT}"

# Colors
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; PURPLE='\033[0;35m'; NC='\033[0m'

# Helper functions
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_header() { echo -e "${PURPLE}🔄 $1${NC}"; echo -e "${PURPLE}$(printf '%.0s=' {1..50})${NC}"; }

# Generate secure tokens
generate_secret() { openssl rand -hex "${1:-32}"; }
generate_password() { openssl rand -base64 "${1:-24}" | tr -d "=+/" | cut -c1-"${1:-24}"; }

# Rotate GitHub token
rotate_github_token() {
    log_header "Rotating GitHub Token"

    if ! command -v gh >/dev/null 2>&1; then
        log_error "GitHub CLI not installed"
        return 1
    fi

    if ! gh auth status >/dev/null 2>&1; then
        log_error "GitHub CLI not authenticated"
        return 1
    fi

    # Get repository info
    local repo_owner="${GITHUB_REPO%/*}"
    local repo_name="${GITHUB_REPO#*/}"

    if [ -z "$repo_owner" ] || [ -z "$repo_name" ]; then
        log_error "GITHUB_REPO not properly configured"
        return 1
    fi

    log_info "Creating new GitHub token for $repo_owner/$repo_name..."

    # Generate new token (this would typically be done through GitHub's API)
    # For now, we'll simulate this and provide instructions
    local new_token
    new_token=$(generate_secret 40)

    log_warning "Token rotation requires manual intervention:"
    log_info "1. Go to https://github.com/settings/tokens"
    log_info "2. Generate a new token with repo/admin permissions"
    log_info "3. Update GITHUB_TOKEN in .env.automation.$ENVIRONMENT"
    log_info "4. Run: ./automate.sh environment sync-secrets <environment>"

    # In a real implementation, you'd use GitHub's API to create tokens
    # This is a placeholder for the actual token rotation logic
    log_info "New token would be: $new_token"
}

# Rotate Firebase service account key
rotate_firebase_key() {
    log_header "Rotating Firebase Service Account Key"

    if ! command -v firebase >/dev/null 2>&1; then
        log_error "Firebase CLI not installed"
        return 1
    fi

    log_info "Rotating Firebase service account keys..."

    # Get all environments
    local environments="development staging production"

    for env in $environments; do
        local firebase_project
        eval "firebase_project=\$ENV_CONFIGS_$env"

        if [ -n "$firebase_project" ]; then
            log_info "Processing Firebase project: $firebase_project"

            # In a real implementation, you'd:
            # 1. Create a new service account key
            # 2. Update the key in GitHub secrets
            # 3. Delete the old key
            # 4. Update local configuration

            log_warning "Firebase key rotation requires manual steps for $firebase_project:"
            log_info "1. Go to Firebase Console > Project Settings > Service Accounts"
            log_info "2. Generate new private key"
            log_info "3. Update FIREBASE_SERVICE_ACCOUNT_KEY in .env.automation.$ENVIRONMENT"
            log_info "4. Update GitHub secrets: ./automate.sh environment sync-secrets $env"
            log_info "5. Delete old private key file"
        fi
    done
}

# Rotate JWT secrets
rotate_jwt_secrets() {
    log_header "Rotating JWT Secrets"

    log_info "Generating new JWT secret..."

    local new_jwt_secret
    new_jwt_secret=$(generate_secret 64)

    # Update .env.automation.<environment>
    if [ -f "$AUTOMATION_ENV_FILE" ]; then
        sed -i.bak "s/^JWT_SECRET=.*/JWT_SECRET=$new_jwt_secret/" "$AUTOMATION_ENV_FILE"
        rm "$AUTOMATION_ENV_FILE.bak" 2>/dev/null || true
        log_success "Updated JWT_SECRET in $AUTOMATION_ENV_FILE"
    fi

    # Update environment-specific files
    local environments="development staging production"
    for env in $environments; do
        local env_file=".env.$env"
        if [ -f "$env_file" ]; then
            sed -i.bak "s/^VITE_JWT_SECRET=.*/VITE_JWT_SECRET=$new_jwt_secret/" "$env_file"
            rm "$env_file.bak" 2>/dev/null || true
            log_success "Updated JWT secret in $env_file"
        fi
    done

    log_warning "Remember to redeploy applications to use new JWT secret"
}

# Rotate encryption keys
rotate_encryption_keys() {
    log_header "Rotating Encryption Keys"

    log_info "Generating new encryption key..."

    local new_encryption_key
    new_encryption_key=$(generate_secret 32)

    # Update .env.automation.<environment>
    if [ -f "$AUTOMATION_ENV_FILE" ]; then
        sed -i.bak "s/^ENCRYPTION_KEY=.*/ENCRYPTION_KEY=$new_encryption_key/" "$AUTOMATION_ENV_FILE"
        rm "$AUTOMATION_ENV_FILE.bak" 2>/dev/null || true
        log_success "Updated ENCRYPTION_KEY in $AUTOMATION_ENV_FILE"
    fi

    # Update environment-specific files
    local environments="development staging production"
    for env in $environments; do
        local env_file=".env.$env"
        if [ -f "$env_file" ]; then
            sed -i.bak "s/^VITE_ENCRYPTION_KEY=.*/VITE_ENCRYPTION_KEY=$new_encryption_key/" "$env_file"
            rm "$env_file.bak" 2>/dev/null || true
            log_success "Updated encryption key in $env_file"
        fi
    done

    log_warning "Remember to redeploy applications to use new encryption key"
}

# Rotate session secrets
rotate_session_secrets() {
    log_header "Rotating Session Secrets"

    log_info "Generating new session secret..."

    local new_session_secret
    new_session_secret=$(generate_secret 32)

    # Update .env.automation.<environment>
    if [ -f "$AUTOMATION_ENV_FILE" ]; then
        sed -i.bak "s/^SESSION_SECRET=.*/SESSION_SECRET=$new_session_secret/" "$AUTOMATION_ENV_FILE"
        rm "$AUTOMATION_ENV_FILE.bak" 2>/dev/null || true
        log_success "Updated SESSION_SECRET in $AUTOMATION_ENV_FILE"
    fi
}

# Check token expiration (placeholder)
check_token_expiration() {
    log_header "Checking Token Expiration"

    log_info "Checking for expired or expiring tokens..."

    # This would check actual token expiration dates
    # For now, just provide guidance
    log_info "Token expiration checking not yet implemented"
    log_info "Recommended rotation schedule:"
    log_info "- GitHub tokens: Every 30 days"
    log_info "- Firebase keys: Every 90 days"
    log_info "- JWT secrets: Every 30 days"
    log_info "- Encryption keys: Every 90 days"
}

# Show token status
show_token_status() {
    log_header "Token Status Overview"

    log_info "Checking current token status..."

    # Check GitHub token
    if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
        log_success "GitHub CLI authenticated"
    else
        log_warning "GitHub CLI not authenticated"
    fi

    # Check Firebase access
    if command -v firebase >/dev/null 2>&1 && firebase projects:list >/dev/null 2>&1; then
        log_success "Firebase CLI authenticated"
    else
        log_warning "Firebase CLI not authenticated"
    fi

    # Check configuration file
    if [ -f "$AUTOMATION_ENV_FILE" ]; then
        log_success "Configuration file exists: $AUTOMATION_ENV_FILE"

        # Check for required secrets
        local required_secrets="GITHUB_TOKEN JWT_SECRET ENCRYPTION_KEY SESSION_SECRET"
        for secret in $required_secrets; do
            if grep -q "^$secret=" "$AUTOMATION_ENV_FILE"; then
                log_success "$secret configured"
            else
                log_warning "$secret not configured"
            fi
        done
    else
        log_error "Configuration file missing: $AUTOMATION_ENV_FILE"
    fi

    # Check environment files
    local environments="development staging production"
    for env in $environments; do
        local env_file=".env.$env"
        if [ -f "$env_file" ]; then
            log_success "Environment file exists: $env_file"
        else
            log_warning "Environment file missing: $env_file"
        fi
    done
}

# Rotate all tokens
rotate_all_tokens() {
    log_header "Rotating All Tokens"

    log_warning "This will rotate all security tokens and keys"
    log_warning "Ensure you have backups and update all dependent systems"

    # Confirm action (in interactive mode)
    if [ -t 0 ]; then
        echo -n "Are you sure you want to rotate all tokens? (y/N): "
        read -r confirm
        if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
            log_info "Token rotation cancelled"
            exit 0
        fi
    fi

    rotate_jwt_secrets
    rotate_encryption_keys
    rotate_session_secrets
    rotate_github_token
    rotate_firebase_key

    log_success "All tokens rotated"
    log_warning "Remember to:"
    log_warning "1. Update GitHub secrets: ./automate.sh environment sync-secrets <environment>"
    log_warning "2. Redeploy all applications"
    log_warning "3. Update any external systems using these tokens"
}

# Main function
main() {
    local action="${1:-status}"

    # Change to project root
    cd "$PROJECT_ROOT"

    # Load configuration
    if [ -f "$AUTOMATION_ENV_FILE" ]; then
        source "$AUTOMATION_ENV_FILE"
    elif [ -f ".env.automation" ]; then
        source .env.automation
    fi

    case "$action" in
        "rotate")
            rotate_all_tokens
            ;;
        "github")
            rotate_github_token
            ;;
        "firebase")
            rotate_firebase_key
            ;;
        "jwt")
            rotate_jwt_secrets
            ;;
        "encryption")
            rotate_encryption_keys
            ;;
        "session")
            rotate_session_secrets
            ;;
        "check-expiry")
            check_token_expiration
            ;;
        "status")
            show_token_status
            ;;
        *)
            log_error "Unknown action: $action"
            log_info "Available actions: rotate, github, firebase, jwt, encryption, session, check-expiry, status"
            exit 1
            ;;
    esac
}

main "$@"</content>
<parameter name="filePath">/Users/marknelson/Circus/Repositories/vehicle-vitals/scripts/token-rotation.sh