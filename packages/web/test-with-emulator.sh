#!/bin/bash
# Test script that properly starts Firebase emulators and runs tests

set -e

echo "🧪 Running web tests with Firebase emulators..."

# Start emulators in background
echo "🔥 Starting Firebase emulators..."
firebase emulators:start --only firestore --project vehicle-vitals-dev &
EMULATOR_PID=$!

# Wait for emulators to be ready
echo "⏳ Waiting for emulators to be ready..."
sleep 5

# Function to cleanup emulators
cleanup() {
    echo "🧹 Cleaning up emulators..."
    kill $EMULATOR_PID 2>/dev/null || true
    pkill -f "firebase emulators" 2>/dev/null || true
}

# Set trap to cleanup on exit
trap cleanup EXIT

# Run the tests
echo "🧪 Running tests..."
npm test

echo "✅ Tests completed successfully!"