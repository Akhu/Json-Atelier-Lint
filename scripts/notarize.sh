#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="$(node -p "require('$PROJECT_DIR/package.json').version")"
DMG_PATH="${1:-$PROJECT_DIR/release/JSON-Atelier-${VERSION}-universal.dmg}"
PROFILE="${NOTARY_PROFILE:?Définis NOTARY_PROFILE avec le profil notarytool du Trousseau}"
SIGNING_IDENTITY="${CSC_NAME:?Définis CSC_NAME avec ton identite Developer ID Application}"

if [[ ! -f "$DMG_PATH" ]]; then
  echo "DMG introuvable : $DMG_PATH" >&2
  exit 1
fi

echo "Signature du DMG avec Developer ID..."
codesign --force --sign "$SIGNING_IDENTITY" --timestamp "$DMG_PATH"
codesign --verify --strict --verbose=2 "$DMG_PATH"

echo "Envoi à Apple pour notarisation..."
xcrun notarytool submit "$DMG_PATH" --keychain-profile "$PROFILE" --wait

echo "Ajout du ticket de notarisation au DMG..."
xcrun stapler staple "$DMG_PATH"
xcrun stapler validate "$DMG_PATH"

echo "Vérification Gatekeeper..."
spctl --assess --verbose=2 --type open --context context:primary-signature "$DMG_PATH"

echo "DMG signé et notarié : $DMG_PATH"
