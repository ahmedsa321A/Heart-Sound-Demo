#!/bin/sh
# Regenerates the backend's copy of the heart-sound inference code and model from the website,
# which is the single source of truth (frontend/src/services/demo/mfccExtractor.ts, frontend/public/models).
set -e
ROOT=$(cd "$(dirname "$0")/../.." && pwd)
OUT="$ROOT/backend/Services/inference"
npx --yes esbuild@0.25.10 "$ROOT/frontend/src/services/demo/mfccExtractor.ts" \
    --format=esm --platform=node --log-level=warning --outfile="$OUT/mfccExtractor.js" \
    --banner:js="// GENERATED from frontend/src/services/demo/mfccExtractor.ts by backend/scripts/sync-inference.sh — do not edit."
cp "$ROOT/frontend/public/models/heart_model/model.json" "$ROOT/frontend/public/models/heart_model/weights.bin" "$OUT/model/"
echo "Synced inference code and model into $OUT"
