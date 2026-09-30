#!/usr/bin/env bash
# Rebuild the scroll-tour frame sequences.
#   scripts/extract-frames.sh wide-video.mp4 [vertical-video.mp4]
# The wide (16:9) video feeds desktop/landscape; the optional vertical (9:16) one
# feeds upright phones. Afterwards set frameCount / mobile.frameCount in
# site/imagine-minds.js to the numbers printed (trim static tail frames first).
set -euo pipefail
VIDEO="${1:?usage: $0 wide-video.mp4 [vertical-video.mp4]}"
MOBILE="${2:-}"
OUT="$(dirname "$0")/../site/frames"
FPS="${FPS:-24}"
rm -rf "$OUT/desktop"; mkdir -p "$OUT/desktop"
ffmpeg -v error -i "$VIDEO" -vf "fps=$FPS,scale=1920:1080:flags=lanczos" \
  -c:v libwebp -quality 80 -compression_level 6 "$OUT/desktop/f%04d.webp"
echo "frameCount: $(ls "$OUT/desktop" | wc -l)"
if [ -n "$MOBILE" ]; then
  rm -rf "$OUT/mobile"; mkdir -p "$OUT/mobile"
  ffmpeg -v error -i "$MOBILE" -vf "fps=$FPS,scale=720:1280:flags=lanczos" \
    -c:v libwebp -quality 72 -compression_level 6 "$OUT/mobile/f%04d.webp"
  echo "mobile.frameCount: $(ls "$OUT/mobile" | wc -l)"
  # Note: the current phone video has letterbox bars on frames 189-234 (glow room);
  # those were re-extracted with crop=1080:1668:0:126,scale=-2:1280,crop=720:1280.
fi
