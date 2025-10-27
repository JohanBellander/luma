#!/usr/bin/env pwsh
# LUMA Installation Script for Windows (PowerShell)

$ErrorActionPreference = "Stop"

Write-Host "Installing LUMA - Layout & UX Mockup Analyzer..." -ForegroundColor Cyan

# Check for Node.js
try {
    $nodeVersion = node --version
    $versionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    
    if ($versionNumber -lt 18) {
        Write-Host "Error: Node.js 18.0.0 or higher is required." -ForegroundColor Red
        Write-Host "Current version: $nodeVersion" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "Found Node.js $nodeVersion ✓" -ForegroundColor Green
}
catch {
    Write-Host "Error: Node.js is required but not installed." -ForegroundColor Red
    Write-Host "Please install Node.js >= 18.0.0 from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check for npm
try {
    $npmVersion = npm --version
    Write-Host "Found npm $npmVersion ✓" -ForegroundColor Green
}
catch {
    Write-Host "Error: npm is required but not found." -ForegroundColor Red
    exit 1
}

# Create temporary directory
$tempDir = Join-Path $env:TEMP "luma-install-$(Get-Random)"
New-Item -ItemType Directory -Path $tempDir | Out-Null

try {
    Set-Location $tempDir
    
    # Clone repository
    Write-Host "Cloning LUMA repository..." -ForegroundColor Cyan
    git clone https://github.com/JohanBellander/luma.git
    Set-Location luma
    
    # Install dependencies
    Write-Host "Installing dependencies..." -ForegroundColor Cyan
    npm install --silent
    
    # Build
    Write-Host "Building LUMA..." -ForegroundColor Cyan
    npm run build
    
    # Install globally
    Write-Host "Installing LUMA globally..." -ForegroundColor Cyan
    npm link
    
    Write-Host ""
    Write-Host "✅ LUMA installed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Try: luma --help" -ForegroundColor Cyan
    Write-Host "Quick start: luma init" -ForegroundColor Cyan
}
finally {
    # Cleanup
    Set-Location $env:USERPROFILE
    if (Test-Path $tempDir) {
        Remove-Item -Recurse -Force $tempDir
    }
}
