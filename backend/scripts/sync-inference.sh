#!/bin/sh
# Regenerates the backend's copy of the heart-sound inference code and models from the website,
# which is the single source of truth (frontend/src/services/demo/*.ts, frontend/public/models).
set -e
ROOT=$(cd "$(dirname "$0")/../.." && pwd)
SRC="$ROOT/frontend/src/services/demo"
OUT="$ROOT/backend/Services/inference"

for name in mfccExtractor yamnetFeatures soundGate; do
    npx --yes esbuild@0.25.10 "$SRC/$name.ts" \
        --format=esm --platform=node --log-level=warning --outfile="$OUT/$name.js" \
        --banner:js="// GENERATED from frontend/src/services/demo/$name.ts by backend/scripts/sync-inference.sh — do not edit."
done

mkdir -p "$OUT/model" "$OUT/yamnet"
cp "$ROOT/frontend/public/models/heart_model/model.json" "$ROOT/frontend/public/models/heart_model/weights.bin" "$OUT/model/"
cp "$ROOT/frontend/public/models/yamnet/model.json" "$ROOT/frontend/public/models/yamnet/weights.bin" "$OUT/yamnet/"
echo "Synced inference code and models into $OUT"
