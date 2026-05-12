#!/bin/bash

for file in offers_*; do
  [ -e "$file" ] || continue
  mv "$file" "${file/offers_/studio_}"
done