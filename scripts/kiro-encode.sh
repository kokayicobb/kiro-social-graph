#!/bin/bash
# kiro-encode.sh — ffmpeg mp4 assembly from captured frames
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(dirname "$SCRIPT_DIR")"
FRAMES="$ROOT/output/kiro-frames"
OUTPUT="${1:-$ROOT/output/social-graph-v1.mp4}"

if [ ! -d "$FRAMES" ]; then
  echo "error: no frames found at $FRAMES"
  echo "run 'npm run capture' first"
  exit 1
fi

FRAME_COUNT=$(ls "$FRAMES"/frame-*.png 2>/dev/null | wc -l | tr -d ' ')
echo "→ encoding $FRAME_COUNT frames to $OUTPUT"

ffmpeg -y \
  -framerate 30 \
  -i "$FRAMES/frame-%04d.png" \
  -c:v libx264 \
  -crf 18 \
  -pix_fmt yuv420p \
  -preset slow \
  -movflags +faststart \
  "$OUTPUT"

echo "→ done: $OUTPUT"
ls -lh "$OUTPUT"
