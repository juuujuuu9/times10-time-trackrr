#!/bin/bash

# Start Local Email Debug Environment
# This script starts MailDev for local email debugging

echo "🚀 Starting Local Email Debug Environment..."
echo ""

# Check if MailDev is installed
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx not found. Please install Node.js and npm."
    exit 1
fi

# Set environment variables for local debugging
export RESEND_API_KEY="local-debug-mode"
export EMAIL_DEBUG_MODE="true"
export SMTP_HOST="localhost"
export SMTP_PORT="1025"

echo "📧 Environment configured for local email debugging"
echo "🌐 MailDev web interface: http://localhost:1080"
echo "📨 SMTP server: localhost:1025"
echo ""

# Start MailDev
echo "🔄 Starting MailDev server..."
npx maildev --web 1080 --smtp 1025 --verbose

echo ""
echo "✅ MailDev server stopped"

