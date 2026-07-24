#!/usr/bin/env bash
# Build the Chrome Web Store upload zip from the shared extension/ source.
# The zip contains only the runtime files, with the manifest at the root.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EXT="$ROOT/extension"
DIST="$ROOT/dist"

VERSION=$(node -p "require('$EXT/manifest.json').version")
PKG_VERSION=$(node -p "require('$ROOT/package.json').version")
if [ "$VERSION" != "$PKG_VERSION" ]; then
  echo "Version mismatch: extension/manifest.json=$VERSION package.json=$PKG_VERSION" >&2
  exit 1
fi

mkdir -p "$DIST"
OUT="$DIST/yt-ultrawide-v${VERSION}.zip"
rm -f "$OUT"

# Zip from inside extension/ so paths are relative to the extension root.
( cd "$EXT" && zip -r "$OUT" \
    manifest.json \
    lib.js \
    content.js \
    content.css \
    icons \
    -x '*.DS_Store' >/dev/null )

echo "Built $OUT"
echo
echo "Contents:"
unzip -l "$OUT"
