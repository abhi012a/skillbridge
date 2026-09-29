# ==============================================================================
# SkillBridge - Google Cloud Run PowerShell Deployment Script
# ==============================================================================

$ErrorActionPreference = "Stop"

$ServiceName = "skillbridge"
$Region = "us-central1"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "🚀 Deploying SkillBridge to Google Cloud Run" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Check if gcloud is installed
if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Error: Google Cloud SDK (gcloud) is not found in PATH." -ForegroundColor Red
    Write-Host "Please install the Google Cloud CLI or run deployment from Google Cloud Shell." -ForegroundColor Yellow
    exit 1
}

# Check Project ID
$ProjectId = gcloud config get-value project 2>$null
if (-not $ProjectId -or $ProjectId -eq "(unset)") {
    $ProjectId = Read-Host "Enter your Google Cloud Project ID"
    gcloud config set project $ProjectId
}

Write-Host "✓ Using Google Cloud Project: $ProjectId" -ForegroundColor Green

# Enable required APIs
Write-Host "⏳ Enabling Cloud Run and Cloud Build APIs..." -ForegroundColor Yellow
gcloud services enable run.googleapis.com cloudbuild.googleapis.com

# Deploy to Cloud Run
Write-Host "📦 Building container and deploying to Cloud Run ($Region)..." -ForegroundColor Yellow
gcloud run deploy $ServiceName `
    --source . `
    --region $Region `
    --platform managed `
    --allow-unauthenticated `
    --port 8080 `
    --memory 512Mi `
    --cpu 1 `
    --min-instances 0 `
    --max-instances 5

# Retrieve and print URL
$ServiceUrl = gcloud run services describe $ServiceName --platform managed --region $Region --format "value(status.url)"

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "🎉 SUCCESS: SkillBridge is Live on Google Cloud Run!" -ForegroundColor Green
Write-Host "🌐 Deployed Application Link:" -ForegroundColor Cyan
Write-Host "   $ServiceUrl" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Green
