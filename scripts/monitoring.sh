#!/bin/bash
# 📊 Vehicle Vitals - Monitoring & Alerting System
# CRITICAL: Bash 3.2 compatible - NO associative arrays

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Configuration
MONITOR_INTERVAL="${MONITOR_INTERVAL:-300}"
ALERT_EMAIL="${ALERT_EMAIL:-}"
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"
LOG_FILE="${LOG_FILE:-automation.log}"
HEALTH_FILE="${HEALTH_FILE:-health-status.json}"

# Colors
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; PURPLE='\033[0;35m'; NC='\033[0m'

# Helper functions
log_info() { echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] $1" | tee -a "$LOG_FILE"; }
log_success() { echo "$(date '+%Y-%m-%d %H:%M:%S') [SUCCESS] $1" | tee -a "$LOG_FILE"; }
log_warning() { echo "$(date '+%Y-%m-%d %H:%M:%S') [WARNING] $1" | tee -a "$LOG_FILE"; }
log_error() { echo "$(date '+%Y-%m-%d %H:%M:%S') [ERROR] $1" | tee -a "$LOG_FILE"; }
log_header() { echo -e "${PURPLE}🚀 $1${NC}"; echo -e "${PURPLE}$(printf '%.0s=' {1..50})${NC}"; }

# CRITICAL: Bash 3.2 compatibility - NO associative arrays
# Use variable naming: ENDPOINTS_<environment>
ENDPOINTS_development="http://localhost:3000"
ENDPOINTS_staging="https://vehicle-vitals-staging.web.app"
ENDPOINTS_production="https://vehicle-vitals-prod.web.app"

# Send alerts
send_alert() {
    local level="$1"; local service="$2"; local message="$3"; local details="$4"

    log_info "Sending $level alert for $service: $message"

    # Email alert
    if [ -n "$ALERT_EMAIL" ] && [ -n "$SMTP_HOST" ]; then
        send_email_alert "$level" "$service" "$message" "$details"
    fi

    # Slack alert
    if [ -n "$SLACK_WEBHOOK" ]; then
        send_slack_alert "$level" "$service" "$message" "$details"
    fi
}

# Send email alert
send_email_alert() {
    local level="$1"; local service="$2"; local message="$3"; local details="$4"

    # This is a simplified email implementation
    # In production, you'd use a proper SMTP client or service
    log_info "Email alert would be sent to $ALERT_EMAIL"
    log_info "Subject: [$level] $service - $message"
    log_info "Details: $details"
}

# Send Slack alert
send_slack_alert() {
    local level="$1"; local service="$2"; local message="$3"; local details="$4"

    local color="good"
    case "$level" in
        "ERROR") color="danger" ;;
        "WARNING") color="warning" ;;
    esac

    local payload
    payload=$(cat <<EOF
{
    "attachments": [
        {
            "color": "$color",
            "title": "[$level] $service",
            "text": "$message",
            "fields": [
                {
                    "title": "Details",
                    "value": "$details",
                    "short": false
                },
                {
                    "title": "Time",
                    "value": "$(date)",
                    "short": true
                }
            ]
        }
    ]
}
EOF
)

    if command -v curl >/dev/null 2>&1; then
        curl -s -X POST -H 'Content-type: application/json' \
             --data "$payload" "$SLACK_WEBHOOK" >/dev/null 2>&1 || true
    fi
}

# System monitoring
monitor_system_resources() {
    log_info "Monitoring system resources..."

    # CPU usage
    local cpu_usage
    if command -v top >/dev/null 2>&1; then
        cpu_usage=$(top -l 1 | grep "CPU usage" | awk '{print $3}' | tr -d '%')
    else
        cpu_usage="unknown"
    fi

    # Memory usage
    local mem_usage
    if command -v vm_stat >/dev/null 2>&1; then
        # macOS memory
        mem_usage=$(vm_stat | grep "Pages active" | awk '{print $3}' | tr -d '.')
        mem_usage=$((mem_usage * 4096 / 1024 / 1024)) # Convert to MB
    else
        mem_usage="unknown"
    fi

    # Disk usage
    local disk_usage
    disk_usage=$(df -h "$PROJECT_ROOT" | tail -1 | awk '{print $5}' | tr -d '%')

    log_info "CPU: ${cpu_usage}%, Memory: ${mem_usage}MB, Disk: ${disk_usage}%"

    # Alert on high resource usage
    if [ "$cpu_usage" != "unknown" ]; then
        # Convert decimal to integer for comparison
        cpu_int=$(echo "$cpu_usage" | cut -d. -f1)
        if [ "$cpu_int" -gt 90 ] 2>/dev/null; then
            send_alert "WARNING" "System" "High CPU usage detected" "CPU usage: ${cpu_usage}%"
        fi
    fi

    # Convert disk usage to integer for comparison
    disk_int=$(echo "$disk_usage" | cut -d. -f1)
    if [ "$disk_int" -gt 90 ] 2>/dev/null; then
        send_alert "ERROR" "System" "Low disk space" "Disk usage: ${disk_usage}%"
    fi
}

# GitHub monitoring (with auth check)
monitor_github_actions() {
    log_info "Monitoring GitHub Actions..."

    if ! command -v gh >/dev/null 2>&1; then
        log_warning "GitHub CLI not available - skipping GitHub monitoring"
        return
    fi

    if ! gh auth status >/dev/null 2>&1; then
        log_warning "GitHub CLI not authenticated - skipping GitHub monitoring"
        return
    fi

    # Get repository info
    local repo_owner="${GITHUB_REPO%/*}"
    local repo_name="${GITHUB_REPO#*/}"

    if [ -z "$repo_owner" ] || [ -z "$repo_name" ]; then
        log_warning "GITHUB_REPO not configured - skipping GitHub monitoring"
        return
    fi

    # Check recent workflow runs
    local recent_runs
    recent_runs=$(gh api "repos/$repo_owner/$repo_name/actions/runs?per_page=5" \
                  --jq '.workflow_runs[] | select(.created_at | strptime("%Y-%m-%dT%H:%M:%SZ") | mktime > (now - 3600)) | {name, status, conclusion}' 2>/dev/null || echo "")

    if [ -n "$recent_runs" ]; then
        log_info "Recent GitHub Actions runs found"

        # Check for failed runs
        local failed_runs
        failed_runs=$(echo "$recent_runs" | jq -r 'select(.status == "completed" and .conclusion == "failure") | .name' 2>/dev/null || echo "")

        if [ -n "$failed_runs" ]; then
            send_alert "ERROR" "GitHub Actions" "Workflow failures detected" "Failed workflows: $failed_runs"
        fi
    fi

    # Check runner status
    local runners
    runners=$(gh api "repos/$repo_owner/$repo_name/actions/runners" \
             --jq '.runners[] | select(.status != "online") | .name' 2>/dev/null || echo "")

    if [ -n "$runners" ]; then
        send_alert "WARNING" "GitHub Runners" "Offline runners detected" "Offline runners: $runners"
    fi
}

# Firebase monitoring
monitor_firebase() {
    log_info "Monitoring Firebase services..."

    if ! command -v firebase >/dev/null 2>&1; then
        log_warning "Firebase CLI not available - skipping Firebase monitoring"
        return
    fi

    # Check if we can list projects
    if ! firebase projects:list >/dev/null 2>&1; then
        log_warning "Firebase not accessible - skipping Firebase monitoring"
        return
    fi

    # Check each environment's Firebase project
    local environments="development staging production"
    for env in $environments; do
        local firebase_project
        eval "firebase_project=\$ENV_CONFIGS_$env"

        if [ -n "$firebase_project" ]; then
            log_info "Checking Firebase project: $firebase_project"

            # This is a simplified check - in production you'd check specific services
            if firebase use "$firebase_project" >/dev/null 2>&1; then
                log_info "Firebase project $firebase_project is accessible"
            else
                send_alert "ERROR" "Firebase" "Project access failed" "Cannot access Firebase project: $firebase_project"
            fi
        fi
    done
}

# Web application monitoring
monitor_web_applications() {
    log_info "Monitoring web applications..."

    if ! command -v curl >/dev/null 2>&1; then
        log_warning "curl not available - skipping web monitoring"
        return
    fi

    local environments="development staging production"
    for env in $environments; do
        local endpoint
        eval "endpoint=\$ENDPOINTS_$env"

        if [ -n "$endpoint" ]; then
            log_info "Checking $env endpoint: $endpoint"

            local response_code
            response_code=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint" 2>/dev/null || echo "000")

            if [ "$response_code" = "200" ]; then
                log_info "$env endpoint is healthy (HTTP $response_code)"
            else
                send_alert "ERROR" "Web Application" "$env endpoint down" "HTTP response code: $response_code for $endpoint"
            fi
        fi
    done
}

# Docker monitoring
monitor_docker() {
    log_info "Monitoring Docker containers..."

    if ! command -v docker >/dev/null 2>&1; then
        log_warning "Docker not available - skipping Docker monitoring"
        return
    fi

    # Check if our containers are running
    local containers
    containers=$(docker ps --filter "name=vehicle-vitals" --format "{{.Names}}:{{.Status}}" 2>/dev/null || echo "")

    if [ -n "$containers" ]; then
        log_info "Found running containers: $containers"

        # Check for containers that aren't running
        local stopped_containers
        stopped_containers=$(echo "$containers" | grep -v "Up " | awk -F: '{print $1}' || echo "")

        if [ -n "$stopped_containers" ]; then
            send_alert "WARNING" "Docker" "Containers not running" "Stopped containers: $stopped_containers"
        fi
    else
        log_info "No vehicle-vitals containers found running"
    fi
}

# Update health status file
update_health_status() {
    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    local health_data
    health_data=$(cat <<EOF
{
    "timestamp": "$timestamp",
    "system": {
        "cpu_usage": "$(monitor_system_resources | grep "CPU:" | awk '{print $2}' | tr -d '%' || echo "unknown")",
        "disk_usage": "$(df -h "$PROJECT_ROOT" | tail -1 | awk '{print $5}' | tr -d '%' || echo "unknown")"
    },
    "services": {
        "github": "$(monitor_github_actions >/dev/null 2>&1 && echo "ok" || echo "error")",
        "firebase": "$(monitor_firebase >/dev/null 2>&1 && echo "ok" || echo "error")",
        "web": "$(monitor_web_applications >/dev/null 2>&1 && echo "ok" || echo "error")",
        "docker": "$(monitor_docker >/dev/null 2>&1 && echo "ok" || echo "error")"
    }
}
EOF
)

    echo "$health_data" | jq . > "$HEALTH_FILE" 2>/dev/null || echo "$health_data" > "$HEALTH_FILE"
}

# Setup monitoring
setup_monitoring() {
    log_header "Setting up Monitoring System"

    # Create monitoring directory
    mkdir -p monitoring

    # Create initial health file
    if [ ! -f "$HEALTH_FILE" ]; then
        update_health_status
        log_success "Created initial health status file: $HEALTH_FILE"
    fi

    # Create log file
    touch "$LOG_FILE"
    log_success "Created log file: $LOG_FILE"

    log_success "Monitoring system setup completed"
}

# Main monitoring loop
main() {
    log_header "🚀 Vehicle Vitals - Monitoring & Alerting System"

    cd "$PROJECT_ROOT"

    # Load environment
    if [ -f ".env.automation" ]; then
        source .env.automation
    fi

    # Setup if requested
    if [ "${1:-}" = "--setup" ]; then
        setup_monitoring
        exit 0
    fi

    # Single run or continuous
    if [ "${1:-}" = "--once" ]; then
        log_info "Running single monitoring cycle..."

        monitor_system_resources
        monitor_github_actions
        monitor_firebase
        monitor_web_applications
        monitor_docker
        update_health_status

        log_success "Monitoring cycle completed"
    else
        log_info "Starting continuous monitoring (interval: ${MONITOR_INTERVAL}s)..."

        while true; do
            monitor_system_resources
            monitor_github_actions
            monitor_firebase
            monitor_web_applications
            monitor_docker
            update_health_status

            sleep "$MONITOR_INTERVAL"
        done
    fi
}

main "$@"
