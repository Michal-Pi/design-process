#!/bin/sh
# design-os pre-commit hook — PII scanner
# Installed by: design-os install-hooks
# Source: assets/scripts/install-hooks.mjs / CONTEXT.md D-19
# Implements: D-19 (pre-commit hook), ART-01 (per-file commit policy)

# Get list of staged files (Added, Copied, Modified only — not Deleted)
STAGED=$(git diff --cached --name-only --diff-filter=ACM)

if [ -z "$STAGED" ]; then
  exit 0
fi

FAILED=0

for FILE in $STAGED; do
  # Only scan design/research/** and **/transcript*.md files
  case "$FILE" in
    design/research/*|*transcript*.md)
      # Run PII scanner on this file
      if ! npx tsx bin/design-os.mjs scan --pii "$FILE" 2>/dev/null; then
        echo "design-os: PII found in staged file: $FILE"
        echo "  Use 'design-os scan --pii $FILE' to see findings."
        echo "  To allowlist this file: update .design-os/pii-allowlist.json with path + sha256."
        FAILED=1
      fi
      ;;
  esac
done

if [ "$FAILED" -ne 0 ]; then
  echo ""
  echo "Commit blocked: PII found in staged files."
  echo "Review findings and either remove PII or update the allowlist."
fi

exit $FAILED
