#!/bin/bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
VERSION="3.4.0"
BUILD_DIR="$(mktemp -d)"
trap 'rm -rf "$BUILD_DIR"' EXIT

EXTENSION="$BUILD_DIR/root/Library/Application Support/Adobe/CEP/extensions/com.shax.panel"
mkdir -p "$EXTENSION" "$REPO_ROOT/dist"
for entry in CSXS css js jsx; do
  cp -R "$REPO_ROOT/$entry" "$EXTENSION/$entry"
done
cp "$REPO_ROOT/index.html" "$EXTENSION/index.html"
find "$EXTENSION" -type d -exec chmod 755 {} \;
find "$EXTENSION" -type f -exec chmod 644 {} \;

pkgbuild \
  --root "$BUILD_DIR/root" \
  --scripts "$REPO_ROOT/packaging/macos/scripts" \
  --identifier "com.shax.cep.installer" \
  --version "$VERSION" \
  --install-location "/" \
  "$REPO_ROOT/dist/SHAX-v${VERSION}-macOS.pkg"

# Structural validation. Signing and host tests are separate steps.
pkgutil --expand "$REPO_ROOT/dist/SHAX-v${VERSION}-macOS.pkg" "$BUILD_DIR/expanded"
test -s "$BUILD_DIR/expanded/PackageInfo"
test -s "$BUILD_DIR/expanded/Payload"
echo "Created SHAX-v${VERSION}-macOS.pkg"