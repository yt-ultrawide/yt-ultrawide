#!/usr/bin/env bash
# Wrap the shared extension/ source into a Safari Web Extension Xcode
# project using Apple's converter (ships with the full Xcode app).
# Output lands in dist/safari/ (git-ignored); open the .xcodeproj and
# Build & Run to load it into Safari.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EXT="$ROOT/extension"
OUT="$ROOT/dist/safari"

CONV="$(xcrun --find safari-web-extension-converter 2>/dev/null || true)"
if [ -z "$CONV" ]; then
  CONV="/Applications/Xcode.app/Contents/Developer/usr/bin/safari-web-extension-converter"
fi
if [ ! -x "$CONV" ]; then
  echo "safari-web-extension-converter not found. Install the full Xcode app," >&2
  echo "then: sudo xcode-select -s /Applications/Xcode.app/Contents/Developer" >&2
  exit 1
fi

rm -rf "$OUT"
mkdir -p "$OUT"

DEVELOPER_DIR="${DEVELOPER_DIR:-/Applications/Xcode.app/Contents/Developer}" \
  "$CONV" "$EXT" \
    --macos-only \
    --no-open \
    --no-prompt \
    --copy-resources \
    --force \
    --project-location "$OUT"

echo
echo "Safari project generated under: $OUT"
echo "Open the .xcodeproj in Xcode and Build & Run (Cmd+R)."
