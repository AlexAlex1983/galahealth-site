#!/usr/bin/env bash
# Downloads every image the site still loads from Tilda's CDN into assets/img/
# and rewrites the HTML/JS to use the local copies.
# Run ONCE from this folder, BEFORE you cancel the Tilda subscription:
#   bash localize-images.sh
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p assets/img

urls=$(grep -ohE 'https://static\.tildacdn\.one/[^"'"'"' )]+' *.html assets/*.js | sort -u)
for url in $urls; do
  id=$(echo "$url" | cut -d/ -f4 | cut -c1-12)          # e.g. tild6165-323
  name="${id}-$(basename "$url")"
  echo "↓ $name"
  curl -fsSL "$url" -o "assets/img/$name"
  # HTML files sit in the root -> assets/img/...; site.js is injected into the same pages.
  perl -pi -e "s#\Q$url\E#assets/img/$name#g" *.html assets/site.js
done
echo "Done. $(ls assets/img | wc -l) images saved to assets/img/"
