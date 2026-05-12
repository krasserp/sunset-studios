#!/bin/bash

counter=1

for file in *.jpg; do
  [ -e "$file" ] || continue

  newname=$(printf "gran-canaria_%02d.jpg" "$counter")

  mv "$file" "$newname"

  counter=$((counter + 1))
done