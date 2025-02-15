#!/bin/bash

# Create and activate Python virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r backend/requirements.txt

# Start Python backend in the background
echo "Starting Python backend..."
cd backend && uvicorn agent:app --reload --port 8000 &

# Go back to root directory
cd ..

# Install npm dependencies
echo "Installing npm dependencies..."
npm install

# Start Next.js frontend
echo "Starting Next.js frontend..."
npm run dev
