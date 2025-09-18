#!/bin/bash

# Coffee Machine Development Startup Script (Linux/macOS)
# Starts backend, frontend, and monitors system health

set -e

# Configuration
BACKEND_PORT=${BACKEND_PORT:-3000}
FRONTEND_PORT=${FRONTEND_PORT:-3001}
SKIP_INSTALL=false
QUIET=false
HEALTH_ONLY=false

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-install)
            SKIP_INSTALL=true
            shift
            ;;
        --quiet)
            QUIET=true
            shift
            ;;
        --health-only)
            HEALTH_ONLY=true
            shift
            ;;
        --backend-port)
            BACKEND_PORT="$2"
            shift 2
            ;;
        --frontend-port)
            FRONTEND_PORT="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--skip-install] [--quiet] [--health-only] [--backend-port PORT] [--frontend-port PORT]"
            exit 1
            ;;
    esac
done

# Utility functions
print_color() {
    printf "${2}${1}${NC}\n"
}

print_header() {
    echo ""
    print_color "═══════════════════════════════════════════════════════════" "$CYAN"
    print_color "  $1" "$YELLOW"
    print_color "═══════════════════════════════════════════════════════════" "$CYAN"
    echo ""
}

check_port() {
    local port=$1
    local service_name=$2
    
    if command -v nc >/dev/null 2>&1; then
        if nc -z localhost $port 2>/dev/null; then
            print_color "✅ $service_name is running on port $port" "$GREEN"
            return 0
        else
            print_color "❌ $service_name is not responding on port $port" "$RED"
            return 1
        fi
    elif command -v telnet >/dev/null 2>&1; then
        if timeout 1 telnet localhost $port >/dev/null 2>&1; then
            print_color "✅ $service_name is running on port $port" "$GREEN"
            return 0
        else
            print_color "❌ $service_name is not responding on port $port" "$RED"
            return 1
        fi
    else
        print_color "⚠️  Cannot check port $port - nc or telnet not available" "$YELLOW"
        return 1
    fi
}

check_backend_health() {
    if command -v curl >/dev/null 2>&1; then
        local response=$(curl -s "http://localhost:$BACKEND_PORT/health" 2>/dev/null || echo "")
        if echo "$response" | grep -q '"status":"OK"'; then
            print_color "✅ Backend health check: OK" "$GREEN"
            local service=$(echo "$response" | grep -o '"service":"[^"]*"' | cut -d'"' -f4)
            local database=$(echo "$response" | grep -o '"database":"[^"]*"' | cut -d'"' -f4)
            print_color "   Service: $service" "$GRAY"
            print_color "   Database: $database" "$GRAY"
            return 0
        fi
    fi
    print_color "❌ Backend health check failed" "$RED"
    return 1
}

check_frontend_health() {
    if command -v curl >/dev/null 2>&1; then
        local status_code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$FRONTEND_PORT" 2>/dev/null || echo "000")
        if [ "$status_code" = "200" ]; then
            print_color "✅ Frontend is serving correctly" "$GREEN"
            return 0
        fi
    fi
    print_color "❌ Frontend health check failed" "$RED"
    return 1
}

check_database() {
    if [ -f "coffee_machine.db" ]; then
        print_color "✅ Database file exists: coffee_machine.db" "$GREEN"
        
        if command -v curl >/dev/null 2>&1; then
            local response=$(curl -s -X POST "http://localhost:$BACKEND_PORT/api/motong/deviceOrderQueueList" \
                -H "Content-Type: application/json" \
                -d '{"deviceId":"1"}' 2>/dev/null || echo "")
            
            if echo "$response" | grep -q '"code":0'; then
                print_color "✅ Database query successful" "$GREEN"
                local order_count=$(echo "$response" | grep -o '"data":\[[^\]]*\]' | grep -o '\[.*\]' | grep -o ',' | wc -l)
                order_count=$((order_count + 1))
                print_color "   Active orders: $order_count" "$GRAY"
                return 0
            fi
        fi
    else
        print_color "⚠️  Database file not found - will be created on first run" "$YELLOW"
    fi
    return 1
}

show_system_info() {
    print_header "☕ COFFEE MACHINE DEVELOPMENT ENVIRONMENT"
    
    if command -v node >/dev/null 2>&1; then
        print_color "Node.js Version: $(node --version)" "$GREEN"
    else
        print_color "❌ Node.js not found" "$RED"
        exit 1
    fi
    
    if command -v npm >/dev/null 2>&1; then
        print_color "NPM Version: $(npm --version)" "$GREEN"
    else
        print_color "❌ NPM not found" "$RED"
        exit 1
    fi
    
    print_color "Shell: $SHELL" "$GREEN"
    print_color "Working Directory: $(pwd)" "$GREEN"
    echo ""
}

install_dependencies() {
    if [ "$SKIP_INSTALL" = true ]; then
        print_color "⏭️  Skipping dependency installation" "$YELLOW"
        return
    fi
    
    print_header "📦 INSTALLING DEPENDENCIES"
    
    # Backend dependencies
    if [ -f "package.json" ]; then
        print_color "Installing backend dependencies..." "$BLUE"
        if npm install --silent; then
            print_color "✅ Backend dependencies installed" "$GREEN"
        else
            print_color "❌ Backend dependency installation failed" "$RED"
            exit 1
        fi
    fi
    
    # Frontend dependencies
    if [ -f "frontend/package.json" ]; then
        print_color "Installing frontend dependencies..." "$BLUE"
        if (cd frontend && npm install --silent); then
            print_color "✅ Frontend dependencies installed" "$GREEN"
        else
            print_color "❌ Frontend dependency installation failed" "$RED"
            exit 1
        fi
    fi
}

initialize_database() {
    print_header "🗄️  INITIALIZING DATABASE"
    
    if [ ! -f "coffee_machine.db" ]; then
        print_color "Creating database with mock data..." "$BLUE"
        if npm run init-db; then
            print_color "✅ Database initialized successfully" "$GREEN"
        else
            print_color "❌ Database initialization failed" "$RED"
            exit 1
        fi
    else
        print_color "✅ Database already exists" "$GREEN"
    fi
}

start_backend() {
    print_header "🚀 STARTING BACKEND SERVER"
    
    # Kill any existing process on backend port
    if command -v lsof >/dev/null 2>&1; then
        local pid=$(lsof -ti:$BACKEND_PORT 2>/dev/null || true)
        if [ -n "$pid" ]; then
            print_color "⚠️  Port $BACKEND_PORT is in use, killing process $pid..." "$YELLOW"
            kill -9 $pid 2>/dev/null || true
            sleep 2
        fi
    fi
    
    print_color "Starting backend on port $BACKEND_PORT..." "$BLUE"
    
    # Start backend in background
    PORT=$BACKEND_PORT npm start > backend.log 2>&1 &
    BACKEND_PID=$!
    
    # Wait for backend to start
    print_color "Waiting for backend to start..." "$YELLOW"
    local attempts=0
    local max_attempts=30
    
    while [ $attempts -lt $max_attempts ]; do
        sleep 1
        attempts=$((attempts + 1))
        if check_port $BACKEND_PORT "Backend" >/dev/null 2>&1; then
            break
        fi
        if [ "$QUIET" != true ]; then
            printf "."
        fi
    done
    
    echo ""
    
    if check_port $BACKEND_PORT "Backend"; then
        sleep 2  # Give it a moment to fully initialize
        check_backend_health
        print_color "🔗 Backend URL: http://localhost:$BACKEND_PORT" "$CYAN"
        print_color "📊 Health Check: http://localhost:$BACKEND_PORT/health" "$CYAN"
        print_color "📡 API Base: http://localhost:$BACKEND_PORT/api/motong/" "$CYAN"
    else
        print_color "❌ Backend failed to start within $max_attempts seconds" "$RED"
        if [ -f "backend.log" ]; then
            print_color "Backend log:" "$YELLOW"
            tail -10 backend.log
        fi
        exit 1
    fi
}

start_frontend() {
    print_header "🎨 STARTING FRONTEND APPLICATION"
    
    if [ ! -d "frontend" ]; then
        print_color "❌ Frontend directory not found" "$RED"
        return 1
    fi
    
    # Kill any existing process on frontend port
    if command -v lsof >/dev/null 2>&1; then
        local pid=$(lsof -ti:$FRONTEND_PORT 2>/dev/null || true)
        if [ -n "$pid" ]; then
            print_color "⚠️  Port $FRONTEND_PORT is in use, killing process $pid..." "$YELLOW"
            kill -9 $pid 2>/dev/null || true
            sleep 2
        fi
    fi
    
    print_color "Starting frontend on port $FRONTEND_PORT..." "$BLUE"
    
    # Start frontend in background
    cd frontend
    PORT=$FRONTEND_PORT BROWSER=none npm start > ../frontend.log 2>&1 &
    FRONTEND_PID=$!
    cd ..
    
    # Wait for frontend to start
    print_color "Waiting for frontend to start..." "$YELLOW"
    local attempts=0
    local max_attempts=60  # Frontend takes longer to start
    
    while [ $attempts -lt $max_attempts ]; do
        sleep 1
        attempts=$((attempts + 1))
        if check_port $FRONTEND_PORT "Frontend" >/dev/null 2>&1; then
            break
        fi
        if [ "$QUIET" != true ]; then
            printf "."
        fi
    done
    
    echo ""
    
    if check_port $FRONTEND_PORT "Frontend"; then
        sleep 3  # Give React time to fully load
        check_frontend_health
        print_color "🌐 Frontend URL: http://localhost:$FRONTEND_PORT" "$CYAN"
        print_color "📱 Management Interface: http://localhost:$FRONTEND_PORT" "$CYAN"
    else
        print_color "❌ Frontend failed to start within $max_attempts seconds" "$RED"
        if [ -f "frontend.log" ]; then
            print_color "Frontend log:" "$YELLOW"
            tail -10 frontend.log
        fi
        print_color "   Check 'npm install' was successful in frontend directory" "$YELLOW"
    fi
}

show_health_status() {
    print_header "🏥 SYSTEM HEALTH CHECK"
    
    # Test services
    local backend_ok=false
    local frontend_ok=false
    
    if check_port $BACKEND_PORT "Backend"; then
        backend_ok=true
        check_backend_health
        check_database
    fi
    
    if check_port $FRONTEND_PORT "Frontend"; then
        frontend_ok=true
        check_frontend_health
    fi
    
    echo ""
    
    # Overall status
    if [ "$backend_ok" = true ] && [ "$frontend_ok" = true ]; then
        print_color "🎉 ALL SYSTEMS OPERATIONAL" "$GREEN"
        print_color "   Coffee Machine Management System is ready!" "$GREEN"
    elif [ "$backend_ok" = true ]; then
        print_color "⚠️  BACKEND ONLY RUNNING" "$YELLOW"
        print_color "   Coffee machine can connect, but no web interface" "$YELLOW"
    elif [ "$frontend_ok" = true ]; then
        print_color "⚠️  FRONTEND ONLY RUNNING" "$YELLOW"
        print_color "   Web interface available, but no backend connection" "$YELLOW"
    else
        print_color "❌ SYSTEM DOWN" "$RED"
        print_color "   Neither backend nor frontend is running" "$RED"
    fi
}

show_urls() {
    print_header "🔗 ACCESS POINTS"
    print_color "Backend Services:" "$NC"
    print_color "  🏥 Health Check:    http://localhost:$BACKEND_PORT/health" "$CYAN"
    print_color "  📡 API Endpoint:    http://localhost:$BACKEND_PORT/api/motong/" "$CYAN"
    print_color "  📊 Server Info:     http://localhost:$BACKEND_PORT/" "$CYAN"
    echo ""
    print_color "Frontend Application:" "$NC"
    print_color "  🎨 Management UI:   http://localhost:$FRONTEND_PORT/" "$CYAN"
    print_color "  📦 Item Manager:    http://localhost:$FRONTEND_PORT/items" "$CYAN"
    print_color "  📋 Order Monitor:   http://localhost:$FRONTEND_PORT/orders" "$CYAN"
    print_color "  🛠️  Device Status:   http://localhost:$FRONTEND_PORT/device" "$CYAN"
    echo ""
    print_color "Coffee Machine Configuration:" "$NC"
    print_color "  Change machine URL to: http://localhost:$BACKEND_PORT/api/motong/" "$YELLOW"
}

monitor_services() {
    print_header "👀 MONITORING SERVICES"
    print_color "Press Ctrl+C to stop all services and exit" "$YELLOW"
    echo ""
    
    local iteration=0
    while true; do
        iteration=$((iteration + 1))
        printf "${GRAY}[%3d] $(date '+%H:%M:%S') - Health Check...${NC}\n" $iteration
        
        local backend_ok=false
        local frontend_ok=false
        
        if check_port $BACKEND_PORT "Backend" >/dev/null 2>&1; then
            backend_ok=true
        fi
        
        if check_port $FRONTEND_PORT "Frontend" >/dev/null 2>&1; then
            frontend_ok=true
        fi
        
        if [ "$backend_ok" != true ] || [ "$frontend_ok" != true ]; then
            print_color "⚠️  Service issue detected!" "$RED"
            show_health_status
        fi
        
        sleep 30  # Check every 30 seconds
    done
}

cleanup() {
    print_color "🛑 Stopping services..." "$YELLOW"
    
    if [ -n "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        print_color "🛑 Backend stopped" "$YELLOW"
    fi
    
    if [ -n "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        print_color "🛑 Frontend stopped" "$YELLOW"
    fi
    
    # Clean up any remaining processes on our ports
    if command -v lsof >/dev/null 2>&1; then
        local backend_pid=$(lsof -ti:$BACKEND_PORT 2>/dev/null || true)
        local frontend_pid=$(lsof -ti:$FRONTEND_PORT 2>/dev/null || true)
        
        [ -n "$backend_pid" ] && kill -9 $backend_pid 2>/dev/null || true
        [ -n "$frontend_pid" ] && kill -9 $frontend_pid 2>/dev/null || true
    fi
    
    print_color "👋 Coffee Machine Development Environment stopped" "$GREEN"
}

# Set up signal handlers
trap cleanup EXIT INT TERM

# Main script execution
show_system_info

if [ "$HEALTH_ONLY" = true ]; then
    show_health_status
    show_urls
    exit 0
fi

install_dependencies
initialize_database

start_backend
start_frontend

echo ""
show_health_status
show_urls

monitor_services
