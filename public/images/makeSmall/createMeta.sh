#!/bin/bash

# change number count here
count=15

for i in $(seq 1 $count); do

num=$(printf "%02d" "$i")

cat <<EOF
  - image: "/images/gran-canaria_${num}-1200.webp"
    thumb: "/images/gran-canaria_${num}-600.webp"
    alt: "Gran Canaria ${num}"

EOF

done