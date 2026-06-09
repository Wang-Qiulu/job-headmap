#!/usr/bin/env bash
# Pack the already-built JobHeadmap.app into a DMG.
#
# Why this exists:
#   Tauri's bundled `bundle_dmg.sh` (a fork of create-dmg) drives the Finder
#   via AppleScript to lay out icons. When this repo lives under iCloud Drive
#   (~/Library/Mobile Documents/.../) the Finder often times out with
#   "AppleEvent timed out (-1712)", which makes `npm run build` fail at the
#   DMG step even though the .app itself built cleanly.
#
#   This script skips the cosmetic Finder layout and produces a plain UDZO
#   DMG via `hdiutil` from a staging directory under /tmp (outside iCloud).
#
# Usage:
#   ./scripts/pack-dmg.sh                 # uses VERSION from src-tauri/tauri.conf.json
#   ./scripts/pack-dmg.sh 1.2.3           # override version label
#
# Output:
#   src-tauri/target/release/bundle/dmg/JobHeadmap_<version>_aarch64.dmg

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP_PATH="$ROOT/src-tauri/target/release/bundle/macos/JobHeadmap.app"
DMG_DIR="$ROOT/src-tauri/target/release/bundle/dmg"
STAGE_DIR="/tmp/jh-dmg-stage-$$"

if [[ ! -d "$APP_PATH" ]]; then
  echo "error: $APP_PATH not found. Run 'npm run build' (or 'cargo build --release' + bundle) first." >&2
  exit 1
fi

# Resolve version
if [[ $# -ge 1 ]]; then
  VERSION="$1"
else
  VERSION="$(/usr/bin/python3 -c "import json,sys;print(json.load(open('$ROOT/src-tauri/tauri.conf.json'))['version'])")"
fi

DMG_PATH="$DMG_DIR/JobHeadmap_${VERSION}_aarch64.dmg"
mkdir -p "$DMG_DIR"
rm -f "$DMG_PATH"

# Stage outside iCloud so hdiutil doesn't fight Finder sync
echo "==> staging in $STAGE_DIR"
mkdir -p "$STAGE_DIR"
trap 'rm -rf "$STAGE_DIR"' EXIT
cp -R "$APP_PATH" "$STAGE_DIR/"
ln -s /Applications "$STAGE_DIR/Applications"

echo "==> creating $DMG_PATH"
hdiutil create \
  -volname "JobHeadmap" \
  -srcfolder "$STAGE_DIR" \
  -ov \
  -format UDZO \
  -fs HFS+ \
  "$DMG_PATH" > /dev/null

echo "==> verifying"
hdiutil verify "$DMG_PATH" > /dev/null

SIZE=$(du -h "$DMG_PATH" | cut -f1)
echo "==> done: $DMG_PATH ($SIZE)"
