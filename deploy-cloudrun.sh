#!/usr/bin/env bash
# ==============================================================================
# SkillBridge - Google Cloud Run One-Command Deployment Script
# ==============================================================================

set -e

SERVICE_NAME="skillbridge"
REGION="us-central1"

echo "=========================================================="
echo "🚀 Deploying SkillBridge to Google Cloud Run"
echo "=========================================================="

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: Google Cloud SDK (gcloud) is not found in PATH."
    echo "Please install gcloud CLI or run this script inside Google Cloud Shell."
    exit 1
fi

# Confirm Project ID
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "(unset)" ]; then
    read -p "Enter your Google Cloud Project ID: " PROJECT_ID
    gcloud config set project "$PROJECT_ID"
fi

echo "✓ Using Google Cloud Project: $PROJECT_ID"

# Enable required Google Cloud services
echo "⏳ Enabling Cloud Run and Cloud Build APIs..."
gcloud services enable run.googleapis.com cloudbuild.googleapis.com

# Deploy to Cloud Run from source
echo "📦 Building container and deploying service to Cloud Run ($REGION)..."
gcloud run deploy "$SERVICE_NAME" \
    --source . \
    --region "$REGION" \
    --platform managed \
    --allow-unauthenticated \
    --port 8080 \
    --memory 512Mi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 5

# Retrieve and display deployed URL
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --platform managed --region "$REGION" --format 'value(status.url)')

echo ""
echo "=========================================================="
echo "🎉 SUCCESS: SkillBridge is Live on Google Cloud Run!"
echo "🌐 Deployed Application Link:"
echo "   $SERVICE_URL"
echo "=========================================================="
echo "Submit this URL in your hackathon submission portal."
