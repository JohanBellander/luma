#!/usr/bin/env pwsh
# PowerShell pre-push hook - Auto-increment patch version

$ErrorActionPreference = 'Stop'

# Get current version from package.json
$packageJsonPath = Join-Path $PSScriptRoot '..' 'package.json'
$packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
$currentVersion = $packageJson.version

# Split version into parts
$versionParts = $currentVersion -split '\.'
$major = [int]$versionParts[0]
$minor = [int]$versionParts[1]
$patch = [int]$versionParts[2]

# Check if version has changed in HEAD commit
try {
    $headPackageContent = git show HEAD:package.json 2>$null
    if ($headPackageContent) {
        $headPackageJson = $headPackageContent | ConvertFrom-Json
        $stagedVersion = $headPackageJson.version
    } else {
        $stagedVersion = $currentVersion
    }
} catch {
    $stagedVersion = $currentVersion
}

if ($currentVersion -eq $stagedVersion) {
    # Increment patch
    $newPatch = $patch + 1
    $newVersion = "$major.$minor.$newPatch"
    
    Write-Host "📦 Auto-incrementing version: $currentVersion → $newVersion" -ForegroundColor Cyan
    
    # Update package.json preserving formatting
    $packageContent = Get-Content $packageJsonPath -Raw
    $packageContent = $packageContent -replace """version""\s*:\s*""[^""]+""", """version"": ""$newVersion"""
    Set-Content $packageJsonPath $packageContent -NoNewline
    
    # Stage and amend the commit
    git add package.json
    git commit --amend --no-edit --no-verify
    
    Write-Host "✓ Version bumped to $newVersion" -ForegroundColor Green
} else {
    Write-Host "ℹ Version already updated manually: $currentVersion" -ForegroundColor Yellow
}

exit 0

