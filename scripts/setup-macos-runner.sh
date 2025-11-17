#!/bin/bash
# 🎯 macOS Self-Hosted Runner Setup Script
# Sets up GitHub Actions runner OUTSIDE project directory to avoid ES module conflicts
# Compatible with Bash 3.2+

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Helper functions
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_header() {
    echo -e "${PURPLE}🚀 $1${NC}"
    echo "=================================================="
}

# Configuration
REPO_URL="https://github.com/mnelson3/vehicle-vitals"
REPO_NAME="vehicle-vitals"
RUNNER_VERSION="2.311.0"
RUNNER_USER="${RUNNER_USER:-$USER}"
RUNNER_DIR="${RUNNER_DIR:-$HOME/actions-runner-$REPO_NAME}"

# Check if running on macOS
check_macos() {
    if [ "$(uname)" != "Darwin" ]; then
        log_error "This script is for macOS only. For Linux runners, use Docker setup."
        exit 1
    fi

    local macos_version=$(sw_vers -productVersion | cut -d. -f1)
    if [ "$macos_version" -lt 11 ]; then
        log_error "macOS 11.0+ required. Current version: $(sw_vers -productVersion)"
        exit 1
    fi

    log_success "macOS $(sw_vers -productVersion) detected"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check Xcode Command Line Tools
    if ! xcode-select -p >/dev/null 2>&1; then
        log_warning "Xcode Command Line Tools not found. Installing..."
        xcode-select --install
        log_info "Please complete Xcode Command Line Tools installation, then re-run this script."
        exit 1
    fi
    log_success "Xcode Command Line Tools installed"

    # Check Homebrew
    if ! command -v brew >/dev/null 2>&1; then
        log_warning "Homebrew not found. Installing..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi
    log_success "Homebrew installed"

    # Check Git
    if ! command -v git >/dev/null 2>&1; then
        log_error "Git not found. Please install Xcode Command Line Tools first."
        exit 1
    fi
    log_success "Git installed"

    # Check jq (for JSON processing)
    if ! command -v jq >/dev/null 2>&1; then
        log_info "Installing jq..."
        brew install jq
    fi
    log_success "jq installed"
}

# Create dedicated runner user (optional but recommended)
create_runner_user() {
    log_info "Setting up runner user..."

    # Check if user already exists
    if id "github-runner" >/dev/null 2>&1; then
        log_success "Runner user 'github-runner' already exists"
        return
    fi

    # Create user with secure password
    log_info "Creating dedicated runner user..."
    sudo dscl . -create /Users/github-runner
    sudo dscl . -create /Users/github-runner UserShell /bin/bash
    sudo dscl . -create /Users/github-runner RealName "GitHub Actions Runner"
    sudo dscl . -create /Users/github-runner UniqueID 1001
    sudo dscl . -create /Users/github-runner PrimaryGroupID 20
    sudo dscl . -create /Users/github-runner NFSHomeDirectory /Users/github-runner
    sudo dscl . -passwd /Users/github-runner RunnerPass123!

    # Create home directory
    sudo mkdir -p /Users/github-runner
    sudo chown github-runner:staff /Users/github-runner

    # Add to admin group for Xcode access
    sudo dscl . -append /Groups/admin GroupMembership github-runner

    log_success "Created runner user 'github-runner' with password 'RunnerPass123!'"
    log_warning "Remember to change the password after setup!"
}

# Setup isolated runner directory
setup_runner_directory() {
    log_header "Setting up Runner Directory"

    # CRITICAL: Ensure runner is OUTSIDE project directory
    local project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
    local runner_parent="$(dirname "$RUNNER_DIR")"

    if [[ "$RUNNER_DIR" == "$project_dir"* ]]; then
        log_error "Runner directory cannot be inside project directory!"
        log_error "Project: $project_dir"
        log_error "Runner:  $RUNNER_DIR"
        log_info "Please set RUNNER_DIR to a location outside your project:"
        log_info "Example: export RUNNER_DIR=\$HOME/actions-runner-$REPO_NAME"
        exit 1
    fi

    log_success "Runner directory is properly isolated: $RUNNER_DIR"

    # Create directory
    mkdir -p "$RUNNER_DIR"
    cd "$RUNNER_DIR"

    log_success "Created runner directory: $RUNNER_DIR"
}

# Download and extract runner
download_runner() {
    log_info "Downloading GitHub Actions Runner v$RUNNER_VERSION..."

    local arch=""
    if [ "$(uname -m)" = "arm64" ]; then
        arch="arm64"
    else
        arch="x64"
    fi

    local runner_archive="actions-runner-osx-$arch-$RUNNER_VERSION.tar.gz"
    local download_url="https://github.com/actions/runner/releases/download/v$RUNNER_VERSION/$runner_archive"

    # Download runner
    if [ ! -f "$runner_archive" ]; then
        log_info "Downloading from: $download_url"
        curl -L -o "$runner_archive" "$download_url"
    else
        log_warning "Runner archive already exists, skipping download"
    fi

    # Extract runner
    log_info "Extracting runner..."
    tar xzf "$runner_archive"

    # Cleanup
    rm "$runner_archive"

    log_success "Runner downloaded and extracted"
}

# Configure runner
configure_runner() {
    log_header "Configuring Runner"

    cd "$RUNNER_DIR"

    # Get runner token from .env.runner if it exists
    local runner_token=""
    local project_root=""

    # Try to find project root by looking for .env.runner
    if [ -f ".env.runner" ]; then
        project_root="."
    elif [ -f "../.env.runner" ]; then
        project_root=".."
    elif [ -f "../../.env.runner" ]; then
        project_root="../.."
    else
        # Fallback to script location
        project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
    fi

    if [ -f "$project_root/.env.runner" ]; then
        runner_token=$(grep "RUNNER_TOKEN" "$project_root/.env.runner" | cut -d'=' -f2)
        log_info "Found runner token in: $project_root/.env.runner"
    fi

    if [ -z "$runner_token" ]; then
        log_error "Runner token not found in .env.runner"
        log_info "Please ensure .env.runner exists with RUNNER_TOKEN"
        log_info "Get token from: https://github.com/mnelson3/vehicle-vitals/settings/actions/runners"
        log_info "Current search paths checked:"
        log_info "  ./.env.runner"
        log_info "  ../.env.runner"
        log_info "  ../../.env.runner"
        log_info "  $project_root/.env.runner"
        exit 1
    fi

    # Determine architecture for labels
    local arch_label="macos-x64"
    if [ "$(uname -m)" = "arm64" ]; then
        arch_label="macos-arm64"
    fi

    # Configure runner
    log_info "Configuring runner with GitHub..."
    ./config.sh \
        --url "$REPO_URL" \
        --token "$runner_token" \
        --labels "self-hosted,macos-latest,$arch_label,$REPO_NAME" \
        --name "$REPO_NAME-macos-runner-$(hostname)" \
        --unattended

    log_success "Runner configured successfully"
}

# Setup as launchd service
setup_service() {
    log_header "Setting up Launchd Service"

    cd "$RUNNER_DIR"

    # Install as service
    log_info "Installing as launchd service..."
    ./svc.sh install

    # Start service
    log_info "Starting service..."
    ./svc.sh start

    log_success "Runner installed as launchd service"
    log_info "Runner will auto-start on system boot"
}

# Install required tools for CI/CD
install_ci_tools() {
    log_header "Installing CI/CD Tools"

    # Accept Xcode license
    log_info "Accepting Xcode license..."
    sudo xcodebuild -license accept

    # Select Xcode
    log_info "Selecting Xcode..."
    sudo xcode-select -s /Applications/Xcode.app/Contents/Developer

    # Install Flutter (if not already installed)
    if ! command -v flutter >/dev/null 2>&1; then
        log_info "Installing Flutter..."
        brew install --cask flutter
        flutter precache
    fi
    log_success "Flutter installed"

    # Install Ruby (for Fastlane)
    if ! command -v ruby >/dev/null 2>&1 || [ "$(ruby -v | cut -d' ' -f2 | cut -d. -f1)" -lt 3 ]; then
        log_info "Installing Ruby..."
        brew install ruby
    fi
    log_success "Ruby installed"

    # Install Fastlane
    if ! command -v fastlane >/dev/null 2>&1; then
        log_info "Installing Fastlane..."
        gem install fastlane
    fi
    log_success "Fastlane installed"

    # Install Node.js (for web builds)
    if ! command -v node >/dev/null 2>&1; then
        log_info "Installing Node.js..."
        brew install node
    fi
    log_success "Node.js installed"
}

# Create management script
create_management_script() {
    log_info "Creating management script..."

    local script_path="$RUNNER_DIR/manage-runner.sh"
    cat > "$script_path" << 'EOF'
#!/bin/bash
# macOS Runner Management Script

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

case "$1" in
    "status")
        log_info "Checking runner status..."
        ./svc.sh status
        ;;
    "start")
        log_info "Starting runner..."
        ./svc.sh start
        log_success "Runner started"
        ;;
    "stop")
        log_info "Stopping runner..."
        ./svc.sh stop
        log_success "Runner stopped"
        ;;
    "restart")
        log_info "Restarting runner..."
        ./svc.sh stop
        sleep 2
        ./svc.sh start
        log_success "Runner restarted"
        ;;
    "logs")
        log_info "Showing recent logs..."
        tail -f _diag/*.log 2>/dev/null || echo "No log files found"
        ;;
    "update")
        log_info "Updating runner..."
        ./svc.sh stop
        # Download latest version and replace
        log_success "Runner updated (manual update required for new versions)"
        ;;
    "uninstall")
        log_warning "Uninstalling runner service..."
        ./svc.sh stop
        ./svc.sh uninstall
        log_success "Runner uninstalled"
        ;;
    *)
        echo "Usage: $0 {status|start|stop|restart|logs|update|uninstall}"
        exit 1
        ;;
esac
EOF

    chmod +x "$script_path"
    log_success "Created management script: $script_path"
}

# Main setup function
main() {
    log_header "macOS Self-Hosted Runner Setup"
    log_info "Repository: $REPO_NAME"
    log_info "Runner Directory: $RUNNER_DIR"
    log_warning "CRITICAL: Runner will be installed OUTSIDE project directory to avoid ES module conflicts"

    # Confirm with user
    echo ""
    read -p "Continue with setup? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Setup cancelled"
        exit 0
    fi

    check_macos
    check_prerequisites
    create_runner_user
    setup_runner_directory
    download_runner
    configure_runner
    setup_service
    install_ci_tools
    create_management_script

    log_header "Setup Complete!"
    log_success "macOS runner installed successfully"
    log_info "Runner Directory: $RUNNER_DIR"
    log_info "Management: $RUNNER_DIR/manage-runner.sh {status|start|stop|restart|logs}"
    log_info "Service: Automatically starts on system boot"
    log_warning "Remember to change the runner user password: 'RunnerPass123!'"
    echo ""
    log_info "Test the runner:"
    log_info "1. Push a commit to trigger GitHub Actions"
    log_info "2. Check runner status: $RUNNER_DIR/manage-runner.sh status"
    log_info "3. View logs: $RUNNER_DIR/manage-runner.sh logs"
}

# Run main function
main "$@"