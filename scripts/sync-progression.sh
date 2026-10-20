#!/bin/sh
set -eu

source_dir="${1:-/opt/dev/tmp/ux0/math-viz/progression}"
target_dir="$(dirname "$0")/../public/dev/progression"

mkdir -p "$target_dir"
rsync -a --delete --exclude '/*/index.html' "$source_dir/" "$target_dir/"

if grep -rlIiE 'mastra|muse' "$target_dir" || find "$target_dir" | grep -iE 'mastra|muse'; then
  echo "sync-progression: the files above name a tool" >&2
  exit 1
fi
