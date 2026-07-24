#!/usr/bin/env bash
# Build a Chrome Web Store upload zip containing ONLY the files the
# extension needs at runtime. Everything else (tests, docs, tooling)
# is left out so the review package stays minimal.
set -euo pipefail
cd "$(dirname "$0")/.."

VERSION=$(node -p "require('./manifest.json').version")
OUT="yt-ultrawide-v${VERSION}.zip"

# Verify the manifest and package versions agree before shipping.
PKG_VERSION=$(node -p "require('./package.json').version")
if [ "$VERSION" != "$PKG_VERSION" ]; then
  echo "Version mismatch: manifest.json=$VERSION package.json=$PKG_VERSION" >&2
  exit 1
fi

rm -f "$OUT"
zip -r "$OUT" \
  manifest.json \
  lib.js \
  content.js \
  content.css \
  icons \
  -x '*.DS_Store' >/dev/null

echo "Built $OUT"
echo
echo "Contents:"
unzip -l "$OUT"
