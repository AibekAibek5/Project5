#!/usr/bin/env bash
# Turns a video into the WebP frame sequences the scroll player uses.
#
#   tools/build-frames.sh path/to/video.mp4
#
# Needs ffmpeg built with libwebp (any recent ffmpeg; `pip install imageio-ffmpeg`
# also ships one). Writes frames/desktop (16:9) and frames/mobile (9:16 centre crop).
# If the frame count changes, update `frames.count` in embed/imagine-scroll.js.
set -euo pipefail

SRC="${1:?usage: tools/build-frames.sh video.mp4}"
FPS="${FPS:-24}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/frames"

rm -rf "$OUT/desktop" "$OUT/mobile"
mkdir -p "$OUT/desktop" "$OUT/mobile"

# Desktop: 1600x900, ~40 KB per frame.
ffmpeg -hide_banner -loglevel error -i "$SRC" -an \
  -vf "fps=$FPS,scale=1600:900:flags=lanczos" \
  -c:v libwebp -quality 62 -compression_level 6 "$OUT/desktop/%04d.webp"

# Mobile: centre 9:16 crop of the 1080p source, 540x960, ~20 KB per frame.
ffmpeg -hide_banner -loglevel error -i "$SRC" -an \
  -vf "fps=$FPS,crop=ih*9/16:ih,scale=540:960:flags=lanczos" \
  -c:v libwebp -quality 62 -compression_level 6 "$OUT/mobile/%04d.webp"

echo "desktop: $(ls "$OUT/desktop" | wc -l) frames, $(du -sh "$OUT/desktop" | cut -f1)"
echo "mobile:  $(ls "$OUT/mobile" | wc -l) frames, $(du -sh "$OUT/mobile" | cut -f1)"
