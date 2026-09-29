#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ICONSET_DIR="$PROJECT_DIR/build/icon.iconset"
SOURCE="$PROJECT_DIR/build/icon.svg"

rm -rf "$ICONSET_DIR"
mkdir -p "$ICONSET_DIR"

for size in 16 32 128 256 512; do
  double=$((size * 2))
  sips -s format png -z "$size" "$size" "$SOURCE" --out "$ICONSET_DIR/icon_${size}x${size}.png" >/dev/null
  sips -s format png -z "$double" "$double" "$SOURCE" --out "$ICONSET_DIR/icon_${size}x${size}@2x.png" >/dev/null
done

iconutil -c icns "$ICONSET_DIR" -o "$PROJECT_DIR/build/icon.icns"
rm -rf "$ICONSET_DIR"

echo "Icône créée dans build/icon.icns"
