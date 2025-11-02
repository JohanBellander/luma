#!/usr/bin/env bash
set -euo pipefail
# Lightweight heuristic integrity check (bash version) for .beads/issues.jsonl
# Mirrors PowerShell script behavior (LUMA-82).
# Exit codes: 0 clean, 2 anomaly, 1 unexpected error

fail() {
  local msg="$1"; local code="${2:-MANUAL_EDIT_DETECTED}"; local line="${3:-}"
  local json
  if [[ -n "$line" ]]; then
    json=$(jq -nc --arg c "$code" --arg m "$msg" --argjson l "$line" '{code:$c,message:$m,line:$l}')
  else
    json=$(jq -nc --arg c "$code" --arg m "$msg" '{code:$c,message:$m}')
  fi
  echo "$json"
  exit 2
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ISSUES_FILE="${SCRIPT_DIR}/../.beads/issues.jsonl"
[[ -f "$ISSUES_FILE" ]] || fail "issues file missing: $ISSUES_FILE" FILE_MISSING

mapfile -t lines < <(grep -n '' "$ISSUES_FILE") || true
[[ ${#lines[@]} -gt 0 ]] || fail 'issues file empty (unexpected)' EMPTY_FILE

prev=-1
lineno=0
while IFS= read -r raw; do :; done < /dev/null # placeholder to satisfy shellcheck for unused

while IFS= read -r line; do
  ((lineno++)) || true
  [[ -n "$line" ]] || continue
  # Extract actual content (no need for number since grep -n not used here), update lineno with sed if necessary
  content="$line"
  # Validate JSON
  if ! echo "$content" | jq -e . >/dev/null 2>&1; then
    fail "Invalid JSON at line $lineno" INVALID_JSON "$lineno"
  fi
  id=$(echo "$content" | jq -r '.id // empty')
  title=$(echo "$content" | jq -r '.title // empty')
  status=$(echo "$content" | jq -r '.status // empty')
  priority=$(echo "$content" | jq -r '.priority // empty')
  issue_type=$(echo "$content" | jq -r '.issue_type // empty')
  for field in id title status priority issue_type; do
    val=$(echo "$content" | jq -r ".$field // empty")
    [[ -n "$val" ]] || fail "Missing field '$field' at line $lineno (id=$id)" MISSING_FIELD "$lineno"
  done
  if [[ ! $id =~ ^LUMA-([0-9]+)$ ]]; then
    fail "Bad id format at line $lineno: $id" BAD_ID_FORMAT "$lineno"
  fi
  num=${BASH_REMATCH[1]}
  if (( num < prev )); then
    fail "ID numeric sequence regression: $num after $prev" SEQUENCE_REGRESSION "$lineno"
  fi
  prev=$num
# feed lines
done < "$ISSUES_FILE"

echo '[OK] Beads integrity check passed.'
exit 0
