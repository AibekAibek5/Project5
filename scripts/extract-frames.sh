#!/usr/bin/env bash
# Rebuild the scroll-tour frame sequences from a new video.
#   scripts/extract-frames.sh path/to/video.mp4
# Afterwards set frameCount in IMM_CONFIG (or site/imagine-minds.js) to the number printed.
set -euo pipefail
VIDEO="${1:?usage: $0 video.mp4}"
OUT="$(dirname "$0")/../site/frames"
FPS="${FPS:-30}"
rm -rf "$OUT/desktop" "$OUT/mobile"
mkdir -p "$OUT/desktop" "$OUT/mobile"
# 16:9 for landscape screens
ffmpeg -v error -i "$VIDEO" -vf "fps=$FPS,scale=1920:1080:flags=lanczos" \
  -c:v libwebp -quality 80 -compression_level 6 "$OUT/desktop/f%04d.webp"
# centre 9:16 crop for phones held upright
ffmpeg -v error -i "$VIDEO" -vf "fps=$FPS,crop=ih*9/16:ih" \
  -c:v libwebp -quality 80 -compression_level 6 "$OUT/mobile/f%04d.webp"
echo "frameCount: $(ls "$OUT/desktop" | wc -l)"
