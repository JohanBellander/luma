<#!
.SYNOPSIS
  Lightweight heuristic integrity check for bead issue tracking.

.DESCRIPTION
  Detects manual edits to .beads/issues.jsonl by validating that every line:
    * Is valid JSON
    * Has required fields: id,title,status,priority,issue_type
    * IDs are monotonically increasing in numeric suffix order
  Returns exit code 2 if anomalies found; 0 if clean.
  (Heuristic; not cryptographic.)

.NOTES
  Extend as needed (e.g., compare against `bd list --json`).

.EXIT CODES
  0 Clean
  1 Unexpected script error
  2 Suspected manual edit / anomaly
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Fail($msg, $code='MANUAL_EDIT_DETECTED', $line=$null) {
  $obj = [ordered]@{ code = $code; message = $msg }
  if ($null -ne $line) { $obj.line = $line }
  $json = ($obj | ConvertTo-Json -Compress)
  Write-Output $json
  exit 2
}

$issuesPath = Join-Path $PSScriptRoot '..' '.beads' 'issues.jsonl'
if (-not (Test-Path $issuesPath)) { Fail "issues file missing: $issuesPath" }

$lines = Get-Content -Raw -Path $issuesPath -ErrorAction Stop | Select-String -Pattern '.*' | ForEach-Object { $_.ToString() }
if ($lines.Count -eq 0) { Fail 'issues file empty (unexpected)' }

$idNumbers = @()
$lineNumber = 0
foreach ($line in $lines) {
  $lineNumber++
  if (-not $line.Trim()) { continue }
  try {
    $obj = $line | ConvertFrom-Json -ErrorAction Stop
  } catch {
    Fail "Invalid JSON at line $lineNumber" 'INVALID_JSON' $lineNumber
  }
  foreach ($required in 'id','title','status','priority','issue_type') {
    if (-not $obj.PSObject.Properties.Name.Contains($required)) {
      Fail "Missing field '$required' at line $lineNumber (id=$($obj.id))" 'MISSING_FIELD' $lineNumber
    }
  }
  if ($obj.id -notmatch '^LUMA-(\d+)$') { Fail "Bad id format at line $lineNumber: $($obj.id)" 'BAD_ID_FORMAT' $lineNumber }
  $n = [int]$Matches[1]
  $idNumbers += $n
}

# Monotonic non-decreasing check (allow gaps but not regressions)
$prev = -1
foreach ($n in $idNumbers) {
  if ($n -lt $prev) { Fail "ID numeric sequence regression: $n after $prev" 'SEQUENCE_REGRESSION' }
  $prev = $n
}

Write-Host '[OK] Beads integrity check passed.'
exit 0
