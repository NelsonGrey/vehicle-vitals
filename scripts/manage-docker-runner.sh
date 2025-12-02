#!/bin/bash
# manage-docker-runner.sh
# Script to manage Docker-based GitHub self-hosted runners

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
COMPOSE_FILE="docker-compose.runner.yml"
REPO_URL="https://github.com/mnelson3/vehicle-vitals"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Function to check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed${NC}"
        echo -e "${YELLOW}Install Docker from: https://docs.docker.com/get-docker/${NC}"
        exit 1
    fi

    if ! docker info &> /dev/null; then
        echo -e "${RED}❌ Docker daemon is not running${NC}"
        echo -e "${YELLOW}Start Docker Desktop or run: sudo systemctl start docker${NC}"
        exit 1
    fi

    # Check if Docker Compose is available
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo -e "${RED}❌ Docker Compose is not available${NC}"
        echo -e "${YELLOW}Install Docker Compose or use Docker Desktop${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ Prerequisites met${NC}"
}

# Function to get runner token
get_runner_token() {
    echo -e "${YELLOW}🔑 Getting GitHub runner registration token...${NC}"

    # First try to get token from .act-secrets/secrets file for API authentication
    local api_token=""
    if [ -f ".act-secrets/secrets" ]; then
        api_token=$(grep "^GITHUB_TOKEN=" .act-secrets/secrets | cut -d'=' -f2-)
    fi

    if [ -z "$api_token" ]; then
        echo -e "${YELLOW}No GITHUB_TOKEN found in .act-secrets/secrets${NC}"
        echo -e "${YELLOW}Please ensure you have a GitHub token with repo scope in .act-secrets/secrets${NC}"
        exit 1
    fi

    # Generate a registration token using the API
    echo -e "${YELLOW}Generating registration token...${NC}"
    local response=$(curl -s -X POST \
        -H "Authorization: token $api_token" \
        -H "Accept: application/vnd.github.v3+json" \
        https://api.github.com/repos/mnelson3/vehicle-vitals/actions/runners/registration-token)

    RUNNER_TOKEN=$(echo "$response" | grep -o '"token":\s*"[^"]*"' | cut -d'"' -f4)

    if [ -z "$RUNNER_TOKEN" ]; then
        echo -e "${RED}❌ Failed to generate registration token${NC}"
        echo -e "${YELLOW}Response: $response${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ Registration token generated${NC}"
}

# Function to setup runner
setup_runner() {
    local token="$1"

    echo -e "${BLUE}🚀 Setting up Docker-based GitHub runner...${NC}"

    # Export token for docker compose
    export RUNNER_TOKEN="$token"

    # Create .env file for persistence
    cat > .env.runner << EOF
RUNNER_TOKEN=$token
EOF

    # Pull required images
    echo -e "${YELLOW}📦 Pulling Docker images...${NC}"
    docker compose -f "$COMPOSE_FILE" --env-file .env.runner pull

    # Start the runner
    echo -e "${YELLOW}🏃 Starting GitHub runner...${NC}"
    docker compose -f "$COMPOSE_FILE" --env-file .env.runner up -d

    # Wait for runner to be ready
    echo -e "${YELLOW}⏳ Waiting for runner to register...${NC}"
    sleep 10

    # Check if runner is running
    if docker compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
        echo -e "${GREEN}✅ Runner started successfully!${NC}"
        echo ""
        echo -e "${BLUE}🎯 Runner Information:${NC}"
        echo -e "Repository: $REPO_URL"
        echo -e "Labels: self-hosted, ubuntu-latest, docker"
        echo -e "Status: $(docker compose -f "$COMPOSE_FILE" ps)"
        echo ""
        echo -e "${YELLOW}📊 Monitor at: http://localhost:8080${NC}"
    else
        echo -e "${RED}❌ Failed to start runner${NC}"
        echo -e "${YELLOW}Check logs: docker compose -f $COMPOSE_FILE logs${NC}"
        exit 1
    fi
}

# Function to start runner
start_runner() {
    echo -e "${BLUE}▶️  Starting GitHub runner...${NC}"

    docker compose -f "$COMPOSE_FILE" --env-file .env.runner up -d

    if docker compose -f "$COMPOSE_FILE" --env-file .env.runner ps | grep -q "Up"; then
        echo -e "${GREEN}✅ Runner started${NC}"
    else
        echo -e "${RED}❌ Failed to start runner${NC}"
        exit 1
    fi
}

# Function to stop runner
stop_runner() {
    echo -e "${BLUE}⏹️  Stopping GitHub runner...${NC}"

    docker compose -f "$COMPOSE_FILE" down

    echo -e "${GREEN}✅ Runner stopped${NC}"
}

# Function to restart runner
restart_runner() {
    echo -e "${BLUE}🔄 Restarting GitHub runner...${NC}"

    stop_runner
    sleep 2
    start_runner
}

# Function to check status
check_status() {
    echo -e "${BLUE}📊 Runner Status${NC}"
    echo -e "${BLUE}==============${NC}"

    if docker compose -f "$COMPOSE_FILE" --env-file .env.runner ps | grep -q "Up"; then
        echo -e "${GREEN}✅ Runner is running${NC}"

        # Show container status
        echo ""
        echo -e "${YELLOW}🐳 Container Status:${NC}"
        docker compose -f "$COMPOSE_FILE" --env-file .env.runner ps

        # Show resource usage
        echo ""
        echo -e "${YELLOW}📈 Resource Usage:${NC}"
        docker stats --no-stream $(docker compose -f "$COMPOSE_FILE" --env-file .env.runner ps -q)

    else
        echo -e "${RED}❌ Runner is not running${NC}"
        echo -e "${YELLOW}Start with: $0 start${NC}"
    fi

    # Show recent logs
    echo ""
    echo -e "${YELLOW}📋 Recent Logs:${NC}"
    docker compose -f "$COMPOSE_FILE" --env-file .env.runner logs --tail=10
}

# Function to view logs
view_logs() {
    echo -e "${BLUE}📋 Runner Logs${NC}"
    echo -e "${BLUE}============${NC}"

    docker compose -f "$COMPOSE_FILE" --env-file .env.runner logs -f
}

# Function to cleanup
cleanup_runner() {
    echo -e "${YELLOW}🧹 Cleaning up runner...${NC}"

    # Stop and remove containers
    docker compose -f "$COMPOSE_FILE" down -v

    # Remove images (optional)
    read -p "Remove Docker images? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker compose -f "$COMPOSE_FILE" down --rmi all
    fi

    # Remove .env file
    rm -f .env.runner

    echo -e "${GREEN}✅ Cleanup completed${NC}"
}

# Function to update workflows
update_workflows() {
    echo -e "${BLUE}🔄 Updating workflows for self-hosted runners...${NC}"

    ./scripts/update-workflows-for-self-hosted.sh

    echo -e "${GREEN}✅ Workflows updated${NC}"
    echo -e "${YELLOW}Note: iOS workflows still use macOS runners${NC}"
}

# Main menu
show_menu() {
    echo ""
    echo -e "${BLUE}🐳 Docker GitHub Runner Manager${NC}"
    echo -e "${BLUE}==============================${NC}"
    echo "1. 🚀 Setup new runner"
    echo "2. ▶️  Start runner"
    echo "3. ⏹️  Stop runner"
    echo "4. 🔄 Restart runner"
    echo "5. 📊 Check status"
    echo "6. 📋 View logs"
    echo "7. 🔄 Update workflows"
    echo "8. 🧹 Cleanup runner"
    echo "9. 💰 Monitor costs"
    echo "0. Exit"
    echo ""
}

# Main logic
main() {
    check_prerequisites

    case "${1:-menu}" in
        "setup")
            get_runner_token
            setup_runner "$RUNNER_TOKEN"
            ;;
        "start")
            start_runner
            ;;
        "stop")
            stop_runner
            ;;
        "restart")
            restart_runner
            ;;
        "status")
            check_status
            ;;
        "logs")
            view_logs
            ;;
        "update")
            update_workflows
            ;;
        "cleanup")
            cleanup_runner
            ;;
        "costs")
            ./scripts/monitor-github-actions-costs.sh
            ;;
        "menu")
            while true; do
                show_menu
                read -p "Choose option (0-9): " choice
                case $choice in
                    1)
                        get_runner_token
                        setup_runner "$RUNNER_TOKEN"
                        ;;
                    2) start_runner ;;
                    3) stop_runner ;;
                    4) restart_runner ;;
                    5) check_status ;;
                    6) view_logs ;;
                    7) update_workflows ;;
                    8) cleanup_runner ;;
                    9) ./scripts/monitor-github-actions-costs.sh ;;
                    0) echo -e "${GREEN}👋 Goodbye!${NC}"; exit 0 ;;
                    *) echo -e "${RED}❌ Invalid option${NC}" ;;
                esac
                echo ""
                read -p "Press Enter to continue..."
            done
            ;;
        *)
            echo -e "${RED}❌ Invalid command: $1${NC}"
            echo -e "${YELLOW}Usage: $0 [setup|start|stop|restart|status|logs|update|cleanup|costs|menu]${NC}"
            exit 1
            ;;
    esac
}

main "$@"