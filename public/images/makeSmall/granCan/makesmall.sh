#!/usr/bin/env bash

for img in *.jpg *.jpeg *.png; do
  [ -f "$img" ] || continue
  filename="${img%.*}"

  echo "Processing $img..."

  convert "$img" -resize 600x  -unsharp 0x0.75+0.75+0.008 -quality 75 "${filename}-600.webp"
  convert "$img" -resize 800x  -unsharp 0x0.75+0.75+0.008 -quality 75 "${filename}-800.webp"
  convert "$img" -resize 1200x -unsharp 0x0.75+0.75+0.008 -quality 80 "${filename}-1200.webp"
done

echo "Done."