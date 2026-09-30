#!/usr/bin/env bash
# Rebuild the scroll-tour frame sequences from a new video.
#   scripts/extract-frames.sh path/to/video.mp4
# Afterwards set frameCount in IMM_CONFIG (or site/imagine-minds.js) to the number printed.
set -euo pipefail
VIDEO="${1:?usage: $0 video.mp4}"
OUT="$(dirname "$0")/../site/frames"
FPS="${FPS:-24}"
rm -rf "$OUT/desktop" "$OUT/mobile"
mkdir -p "$OUT/desktop" "$OUT/mobile"
# 16:9 for landscape screens
ffmpeg -v error -i "$VIDEO" -vf "fps=$FPS,scale=1920:1080:flags=lanczos" \
  -c:v libwebp -quality 80 -compression_level 6 "$OUT/desktop/f%04d.webp"
# lighter full frame for phones
ffmpeg -v error -i "$VIDEO" -vf "fps=$FPS,scale=1280:720:flags=lanczos" \
  -c:v libwebp -quality 78 -compression_level 6 "$OUT/mobile/f%04d.webp"
echo "frameCount: $(ls "$OUT/desktop" | wc -l)"
