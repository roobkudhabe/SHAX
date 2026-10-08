#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
EXT_DIR="$HOME/Library/Application Support/Adobe/CEP/extensions"
DEST="$EXT_DIR/com.shax.panel"
OLD_ROOB="$EXT_DIR/com.roobkudhabe.panel"
OLD_SCENE="$EXT_DIR/com.scenepilot.panel"

if [[ ! -f "$SCRIPT_DIR/CSXS/manifest.xml" || ! -f "$SCRIPT_DIR/index.html" ]]; then
  echo "SHAX runtime files are missing. Extract the complete ZIP and try again."
  exit 1
fi

mkdir -p "$EXT_DIR"
TEMP_DIR="$(mktemp -d "$EXT_DIR/.shax-install.XXXXXX")"
trap 'rm -rf "$TEMP_DIR"' EXIT
for entry in CSXS css js jsx; do cp -R "$SCRIPT_DIR/$entry" "$TEMP_DIR/"; done
cp "$SCRIPT_DIR/index.html" "$TEMP_DIR/"
rm -rf "$DEST"
mv "$TEMP_DIR" "$DEST"
rm -rf "$OLD_ROOB" "$OLD_SCENE"
trap - EXIT

for v in 9 10 11 12 13; do
  defaults write "com.adobe.CSXS.$v" PlayerDebugMode 1 >/dev/null 2>&1 || true
done

echo "SHAX v3.3.1 installed. Restart After Effects, then open Window > Extensions (Legacy) > SHAX."
