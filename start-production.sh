#!/bin/sh

# Start the Worker in the background
echo "🚀 Starting Worker Node..."
node src/jobs/worker.js &

# Start the API Server in the foreground
echo "🌐 Starting API Server..."
node src/api/server.js
