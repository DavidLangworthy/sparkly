#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CAPTURE_ROOT="$ROOT_DIR/site/audit-captures"
SERVER_URL="${SPARKLY_AUDIT_BASE_URL:-http://127.0.0.1:8017}"
LABEL="${1:-$(date +%Y%m%d-%H%M%S)}"
OUT_DIR="$CAPTURE_ROOT/$LABEL"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
INK_IDS=(
  "og-rainbow"
  "gold"
  "silver"
  "pearl"
  "opal"
  "rose"
  "galaxy"
  "ember"
)

mkdir -p "$OUT_DIR"

if ! curl -fsS "$SERVER_URL/site/debug-audit-timesteps.html" > /dev/null; then
  echo "Local audit server is not reachable at $SERVER_URL" >&2
  echo "Run: python3 -m http.server 8017 --directory $ROOT_DIR" >&2
  exit 1
fi

capture_page() {
  local url="$1"
  local output="$2"
  local width="$3"
  local height="$4"

  "$CHROME" \
    --headless=new \
    --disable-gpu \
    --hide-scrollbars \
    --run-all-compositor-stages-before-draw \
    --virtual-time-budget=2800 \
    --window-size="$width,$height" \
    --screenshot="$output" \
    "$url"
}

capture_page \
  "$SERVER_URL/site/debug-audit-timesteps.html" \
  "$OUT_DIR/all-inks.png" \
  1440 \
  6200

for ink_id in "${INK_IDS[@]}"; do
  capture_page \
    "$SERVER_URL/site/debug-audit-timesteps.html?ink=$ink_id" \
    "$OUT_DIR/$ink_id.png" \
    1280 \
    1800
done

cp "$ROOT_DIR/site/glitter-seeds.js" "$OUT_DIR/glitter-seeds.js"
cp "$ROOT_DIR/site/ink-variants.js" "$OUT_DIR/ink-variants.js"
cp "$ROOT_DIR/site/index.js" "$OUT_DIR/index.js"
cp "$ROOT_DIR/site/ink-preview.js" "$OUT_DIR/ink-preview.js"

git -C "$ROOT_DIR" diff -- site/glitter-seeds.js site/ink-variants.js site/index.js site/ink-preview.js > "$OUT_DIR/working-diff.patch"
git -C "$ROOT_DIR" status --short > "$OUT_DIR/git-status.txt"

cat > "$OUT_DIR/README.md" <<EOF
# Ink Audit Snapshot: $LABEL

- Base URL: $SERVER_URL
- Captured: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
- Includes:
  - \`all-inks.png\`
  - one filtered screenshot per base ink
  - exact file snapshots for the current tuning sources
  - \`working-diff.patch\` and \`git-status.txt\`

Use this folder as a frozen reference before the next tuning pass.
EOF

echo "$OUT_DIR"
