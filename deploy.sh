#!/bin/bash
# Coffee Machine Deployment Script

set -e  # Exit on any error

echo "🚀 Starting Coffee Machine Deployment..."
echo "Date: $(date)"
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if git is available
if ! command -v git &> /dev/null; then
    print_error "Git is not installed. Please install git first."
    exit 1
fi

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    print_error "Not a git repository. Run 'git init' first."
    exit 1
fi

# Pull latest changes
print_status "Pulling latest changes from repository..."
if git pull origin main; then
    print_success "Code updated successfully"
else
    print_warning "Git pull failed or no changes available"
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    print_error "Node.js version $NODE_VERSION is too old. Please upgrade to version 16+."
    exit 1
fi

# Install/update backend dependencies
print_status "Installing backend dependencies..."
if npm install --production; then
    print_success "Backend dependencies installed"
else
    print_error "Failed to install backend dependencies"
    exit 1
fi

# Install/update frontend dependencies
print_status "Installing frontend dependencies..."
if cd frontend && npm install --production && cd ..; then
    print_success "Frontend dependencies installed"
else
    print_error "Failed to install frontend dependencies"
    exit 1
fi

# Build frontend for production
print_status "Building frontend for production..."
if npm run frontend:build; then
    print_success "Frontend built successfully"
else
    print_error "Frontend build failed"
    exit 1
fi

# Backup current database if it exists
if [ -f "coffee_machine.db" ]; then
    print_status "Backing up existing database..."
    BACKUP_NAME="coffee_machine_backup_$(date +%Y%m%d_%H%M%S).db"
    mkdir -p backups
    if cp coffee_machine.db "backups/$BACKUP_NAME"; then
        print_success "Database backed up as $BACKUP_NAME"
    else
        print_warning "Database backup failed, continuing anyway..."
    fi
fi

# Initialize or update database
print_status "Initializing database..."
if npm run init-db; then
    print_success "Database initialized"
else
    print_warning "Database initialization failed, using existing database"
fi

# Check if PM2 is available
if command -v pm2 &> /dev/null; then
    print_status "Restarting services with PM2..."
    
    # Stop existing processes
    pm2 stop coffee-backend 2>/dev/null || print_warning "coffee-backend was not running"
    pm2 stop coffee-frontend 2>/dev/null || print_warning "coffee-frontend was not running"
    
    # Start backend
    if pm2 start ecosystem.config.js; then
        print_success "Backend started with PM2"
    else
        print_error "Failed to start backend with PM2"
        exit 1
    fi
    
    # Start frontend (serve static files)
    if pm2 serve frontend/build 3001 --name "coffee-frontend" --spa; then
        print_success "Frontend started with PM2"
    else
        print_warning "Failed to start frontend with PM2, may already be running"
    fi
    
    # Save PM2 configuration
    pm2 save
    
else
    print_warning "PM2 not found. You'll need to start services manually:"
    echo "  Backend: npm start"
    echo "  Frontend: cd frontend && npm start"
fi

# Wait for services to start
print_status "Waiting for services to start..."
sleep 5

# Run health check
print_status "Running health check..."
if npm run health; then
    print_success "Health check passed"
else
    print_warning "Health check failed - services may still be starting"
fi

# Display service information
echo
echo "================================================================="
print_success "Deployment completed successfully!"
echo "================================================================="
echo
echo "📊 Service Information:"
echo "  Backend API: http://localhost:3000/api/motong/"
echo "  Frontend UI: http://localhost:3001/"
echo "  Health Check: http://localhost:3000/health"
echo
echo "🔧 Management Commands:"
echo "  Check status: pm2 status"
echo "  View logs: pm2 logs"
echo "  Restart: pm2 restart all"
echo "  Health check: npm run health"
echo
echo "📱 Coffee Machine Configuration:"
echo "  Point your coffee machine to: http://YOUR_SERVER_IP:3000/api/motong/"
echo
echo "🎯 Next Steps:"
echo "  1. Update YOUR_SERVER_IP in coffee machine settings"
echo "  2. Test API endpoints with your coffee machine"
echo "  3. Monitor logs for any issues"
echo
print_success "Your coffee machine backend is ready for production! ☕"
