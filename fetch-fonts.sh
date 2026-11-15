#!/usr/bin/env bash
# Downloads the Manrope web font into assets/fonts/ so the site doesn't load
# anything from Google Fonts (privacy: no visitor IPs sent to Google).
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p assets/fonts
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
curl -fsSL -A "$UA" "https://fonts.googleapis.com/css2?family=Manrope:wght@400..700&display=swap" -o /tmp/manrope.css
cp /tmp/manrope.css assets/fonts/manrope.css
i=0
for url in $(grep -oE 'https://fonts\.gstatic\.com/[^)]+\.woff2' /tmp/manrope.css | sort -u); do
  i=$((i+1)); name="manrope-$i.woff2"
  curl -fsSL "$url" -o "assets/fonts/$name"
  perl -pi -e "s#\Q$url\E#$name#g" assets/fonts/manrope.css
done
echo "Saved $i font files"
