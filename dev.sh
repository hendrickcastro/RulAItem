#!/bin/bash

# Kontexto IA - Development Management Script
# Usage: ./dev.sh [command]

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to display help
show_help() {
    echo -e "${BLUE}Kontexto IA Development Management${NC}"
    echo ""
    echo "Available commands:"
    echo -e "  ${GREEN}start${NC}     - Start all development servers"
    echo -e "  ${GREEN}stop${NC}      - Stop all development processes"
    echo -e "  ${GREEN}restart${NC}   - Restart all development servers"
    echo -e "  ${GREEN}build${NC}     - Build all packages"
    echo -e "  ${GREEN}clean${NC}     - Clean all build artifacts"
    echo -e "  ${GREEN}status${NC}    - Show status of development servers"
    echo -e "  ${GREEN}logs${NC}      - Show development logs"
    echo -e "  ${GREEN}install${NC}   - Install dependencies"
    echo -e "  ${GREEN}help${NC}      - Show this help message"
    echo ""
    echo "Example: ./dev.sh start"
}

# Function to kill processes
kill_processes() {
    echo -e "${YELLOW}Stopping development processes...${NC}"
    
    # Kill processes by port
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
    
    # Kill by process name
    pkill -f "next dev" 2>/dev/null || true
    pkill -f "turbo dev" 2>/dev/null || true
    pkill -f "tsx watch" 2>/dev/null || true
    pkill -f "tsc --watch" 2>/dev/null || true
    
    echo -e "${GREEN}✓ Processes stopped${NC}"
}

# Function to start development
start_dev() {
    echo -e "${YELLOW}Starting Kontexto IA development servers...${NC}"
    
    # Check if .env.local exists
    if [ ! -f "apps/web/.env.local" ]; then
        echo -e "${RED}Error: apps/web/.env.local not found. Please configure environment variables.${NC}"
        exit 1
    fi
    
    # Build core packages first
    echo -e "${YELLOW}Building core packages...${NC}"
    npm run build:packages 2>/dev/null || true
    
    # Start development servers
    npm run dev &
    DEV_PID=$!
    
    echo -e "${GREEN}✓ Development servers started${NC}"
    echo -e "${BLUE}Web app: http://localhost:3000${NC}"
    echo -e "${BLUE}PID: $DEV_PID${NC}"
    
    # Wait for servers to be ready
    echo -e "${YELLOW}Waiting for servers to be ready...${NC}"
    sleep 5
    
    # Check if web app is responding
    if curl -s http://localhost:3000 > /dev/null; then
        echo -e "${GREEN}✓ Web app is ready at http://localhost:3000${NC}"
    else
        echo -e "${YELLOW}⚠ Web app might still be starting up...${NC}"
    fi
}

# Function to show status
show_status() {
    echo -e "${BLUE}Development Server Status:${NC}"
    echo ""
    
    # Check port 3000 (web app)
    if lsof -ti:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Web app (port 3000): Running${NC}"
    else
        echo -e "${RED}✗ Web app (port 3000): Not running${NC}"
    fi
    
    # Check processes
    if pgrep -f "turbo dev" > /dev/null; then
        echo -e "${GREEN}✓ Turbo dev: Running${NC}"
    else
        echo -e "${RED}✗ Turbo dev: Not running${NC}"
    fi
}

# Function to build packages
build_packages() {
    echo -e "${YELLOW}Building packages...${NC}"
    
    # Build core package first
    cd packages/core && npm run build && cd ../..
    
    # Build other packages
    npm run build 2>/dev/null || true
    
    echo -e "${GREEN}✓ Packages built${NC}"
}

# Function to clean build artifacts
clean_build() {
    echo -e "${YELLOW}Cleaning build artifacts...${NC}"
    
    # Remove dist directories
    find . -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
    find . -name ".next" -type d -exec rm -rf {} + 2>/dev/null || true
    find . -name ".turbo" -type d -exec rm -rf {} + 2>/dev/null || true
    
    echo -e "${GREEN}✓ Build artifacts cleaned${NC}"
}

# Function to install dependencies
install_deps() {
    echo -e "${YELLOW}Installing dependencies...${NC}"
    pnpm install
    echo -e "${GREEN}✓ Dependencies installed${NC}"
}

# Function to show logs
show_logs() {
    echo -e "${BLUE}Following development logs (Ctrl+C to exit):${NC}"
    echo ""
    
    # Show logs from worker if they exist
    if [ -f "services/worker/logs/combined.log" ]; then
        tail -f services/worker/logs/combined.log
    else
        echo -e "${YELLOW}No log files found. Run 'npm run dev' to see live logs.${NC}"
    fi
}

# Main script logic
case "${1:-help}" in
    "start")
        start_dev
        ;;
    "stop")
        kill_processes
        ;;
    "restart")
        kill_processes
        sleep 2
        start_dev
        ;;
    "build")
        build_packages
        ;;
    "clean")
        clean_build
        ;;
    "status")
        show_status
        ;;
    "logs")
        show_logs
        ;;
    "install")
        install_deps
        ;;
    "help"|*)
        show_help
        ;;
esac