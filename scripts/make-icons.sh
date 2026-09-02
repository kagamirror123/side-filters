#!/bin/bash
# assets/icon.svg から拡張用の PNG を作り直す (rsvg-convert が必要: brew install librsvg)
set -euo pipefail
repo="$(cd "$(dirname "$0")/.." && pwd)"

for size in 16 32 48 128; do
  rsvg-convert -w "$size" -h "$size" "$repo/assets/icon.svg" -o "$repo/extension/public/icon/${size}.png"
done
echo "generated: extension/public/icon/{16,32,48,128}.png"
