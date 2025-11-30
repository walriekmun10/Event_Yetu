#!/bin/bash

###############################################################################
# Event Yetu - Complete Installation Script
# This script installs all requirements for the Event Management System
###############################################################################

echo "🚀 Event Yetu - Installation Script"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if script is run from correct directory
if [ ! -f "README.md" ]; then
    print_error "Please run this script from the Event-yetu root directory"
    exit 1
fi

print_info "Starting installation process..."
echo ""

###############################################################################
# 1. Check Prerequisites
###############################################################################
echo "📋 Step 1: Checking Prerequisites"
echo "--------------------------------"

# Check for PHP
if command -v /Applications/XAMPP/xamppfiles/bin/php &> /dev/null; then
    PHP_VERSION=$(/Applications/XAMPP/xamppfiles/bin/php -v | head -n 1)
    print_success "PHP found: $PHP_VERSION"
else
    print_error "PHP not found. Please install XAMPP."
    exit 1
fi

# Check for MySQL
if command -v mysql &> /dev/null; then
    MYSQL_VERSION=$(mysql --version)
    print_success "MySQL found: $MYSQL_VERSION"
else
    print_warning "MySQL command not found, but may be available through XAMPP"
fi

# Check for Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    print_success "Node.js found: $NODE_VERSION"
else
    print_error "Node.js not found. Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check for npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    print_success "npm found: v$NPM_VERSION"
else
    print_error "npm not found. Please install Node.js (includes npm)"
    exit 1
fi

# Check for Composer
if command -v composer &> /dev/null; then
    COMPOSER_VERSION=$(composer --version | head -n 1)
    print_success "Composer found: $COMPOSER_VERSION"
else
    print_warning "Composer not found. Will skip PHP dependencies."
    print_info "Install from: https://getcomposer.org/"
fi

echo ""

###############################################################################
# 2. Install Frontend Dependencies
###############################################################################
echo "📦 Step 2: Installing Frontend Dependencies"
echo "-----------------------------------------"

cd frontend

if [ -f "package.json" ]; then
    print_info "Installing npm packages..."
    npm install
    
    if [ $? -eq 0 ]; then
        print_success "Frontend dependencies installed successfully"
    else
        print_error "Failed to install frontend dependencies"
        exit 1
    fi
else
    print_error "package.json not found in frontend directory"
    exit 1
fi

cd ..
echo ""

###############################################################################
# 3. Install Backend Dependencies
###############################################################################
echo "📦 Step 3: Installing Backend Dependencies"
echo "----------------------------------------"

cd backend

if command -v composer &> /dev/null; then
    if [ -f "composer.json" ]; then
        print_info "Installing PHP dependencies with Composer..."
        composer install
        
        if [ $? -eq 0 ]; then
            print_success "Backend dependencies installed successfully"
        else
            print_error "Failed to install backend dependencies"
            exit 1
        fi
    else
        print_warning "composer.json not found. Creating one for FPDF..."
        
        # Create composer.json if it doesn't exist
        cat > composer.json << 'EOF'
{
    "name": "eventyetu/backend",
    "description": "Event Yetu Backend",
    "require": {
        "php": ">=7.4",
        "setasign/fpdf": "^1.8"
    }
}
EOF
        
        print_info "Installing PHP dependencies..."
        composer install
        
        if [ $? -eq 0 ]; then
            print_success "Backend dependencies installed successfully"
        fi
    fi
else
    print_warning "Skipping PHP dependencies (Composer not installed)"
    print_info "FPDF library may need manual installation"
fi

cd ..
echo ""

###############################################################################
# 4. Setup Database
###############################################################################
echo "🗄️  Step 4: Setting Up Database"
echo "------------------------------"

print_info "Checking MySQL connection..."

# Try to connect to MySQL
if mysql -u root -e "SELECT 1" &> /dev/null; then
    print_success "MySQL connection successful"
    
    print_info "Creating database and tables..."
    
    # Run database setup
    mysql -u root << 'EOF'
-- Create database if not exists
CREATE DATABASE IF NOT EXISTS event_yetu;
USE event_yetu;

-- Check if tables exist
SELECT 'Database setup complete' as status;
EOF
    
    if [ $? -eq 0 ]; then
        print_success "Database checked successfully"
    else
        print_warning "Database check had issues, but may already be set up"
    fi
    
else
    print_warning "Could not connect to MySQL with 'mysql -u root'"
    print_info "Database tables may need to be imported manually"
    print_info "Run: mysql -u root < backend/db.sql"
fi

echo ""

###############################################################################
# 5. Create Required Directories
###############################################################################
echo "📁 Step 5: Creating Required Directories"
echo "--------------------------------------"

# Create uploads directory
if [ ! -d "backend/uploads" ]; then
    mkdir -p backend/uploads
    chmod 755 backend/uploads
    print_success "Created backend/uploads directory"
else
    print_info "backend/uploads directory already exists"
fi

# Create logs directory
if [ ! -d "backend/logs" ]; then
    mkdir -p backend/logs
    chmod 755 backend/logs
    print_success "Created backend/logs directory"
else
    print_info "backend/logs directory already exists"
fi

echo ""

###############################################################################
# 6. Verify Installation
###############################################################################
echo "✓ Step 6: Verifying Installation"
echo "-------------------------------"

ERRORS=0

# Check frontend node_modules
if [ -d "frontend/node_modules" ]; then
    print_success "Frontend dependencies installed"
else
    print_error "Frontend node_modules missing"
    ERRORS=$((ERRORS + 1))
fi

# Check backend vendor
if [ -d "backend/vendor" ]; then
    print_success "Backend dependencies installed"
else
    print_warning "Backend vendor directory missing (Composer dependencies)"
fi

# Check uploads directory
if [ -d "backend/uploads" ]; then
    print_success "Uploads directory exists"
else
    print_error "Uploads directory missing"
    ERRORS=$((ERRORS + 1))
fi

# Check logs directory
if [ -d "backend/logs" ]; then
    print_success "Logs directory exists"
else
    print_error "Logs directory missing"
    ERRORS=$((ERRORS + 1))
fi

echo ""

###############################################################################
# 7. Installation Summary
###############################################################################
echo "📊 Installation Summary"
echo "====================="
echo ""

if [ $ERRORS -eq 0 ]; then
    print_success "Installation completed successfully! 🎉"
    echo ""
    echo "Next steps:"
    echo "1. Start XAMPP (Apache and MySQL)"
    echo "2. Import database: mysql -u root < backend/db.sql"
    echo "3. Start frontend: cd frontend && npm run dev"
    echo "4. Access app at: http://localhost:5173"
    echo "5. Backend API at: http://localhost/Event-yetu/backend/api/"
    echo ""
    echo "For M-Pesa setup:"
    echo "- Edit backend/config/mpesa.php with your credentials"
    echo "- Follow backend/MPESA_SETUP.md for detailed instructions"
    echo ""
else
    print_warning "Installation completed with $ERRORS error(s)"
    echo ""
    echo "Please fix the errors above and try again."
fi

echo ""
print_info "Installation script finished!"
