#!/usr/bin/env pwsh
# PowerShell pre-push hook - Auto-increment patch version
# Now also runs beads integrity check (blocks push on anomaly) before version bump.

$ErrorActionPreference = 'Stop'

# Get current version from package.json
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $scriptDir
$packageJsonPath = Join-Path -Path $repoRoot -ChildPath 'package.json'

Write-Host "[pre-push] Running beads integrity check..." -ForegroundColor Cyan
$integrityScript = Join-Path $repoRoot 'scripts' 'validate-beads-integrity.ps1'
if (Test-Path $integrityScript) {
    & $integrityScript
    $integrityExit = $LASTEXITCODE
    if ($integrityExit -eq 2) {
        Write-Host "[pre-push] ❌ Beads integrity anomaly detected. Push aborted." -ForegroundColor Red
        exit 2
    } else {
        Write-Host "[pre-push] ✓ Integrity clean." -ForegroundColor Green
    }
} else {
    Write-Host "[pre-push] (info) Integrity script missing; skipping." -ForegroundColor Yellow
}

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
    
    Write-Host "[pre-push] Auto-incrementing version: $currentVersion -> $newVersion" -ForegroundColor Cyan
    
    # Update package.json preserving formatting
    $packageContent = Get-Content $packageJsonPath -Raw
    $packageContent = $packageContent -replace """version""\s*:\s*""[^""]+""", """version"": ""$newVersion"""
    Set-Content $packageJsonPath $packageContent -NoNewline
    
    # Stage and amend the commit
    git add package.json
    git commit --amend --no-edit --no-verify
    
    Write-Host "[pre-push] Version bumped to $newVersion" -ForegroundColor Green
} else {
    Write-Host "[pre-push] Version already updated manually: $currentVersion" -ForegroundColor Yellow
}

exit 0

