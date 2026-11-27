"""
Builds data/world.json (country outlines for the atlas map) from Natural Earth 1:110m
admin-0 countries (public domain). Keeps ISO3 code, name and coordinates rounded to
0.1 degree, so the file stays small.
"""
import json, urllib.request

URL = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson"
gj = json.loads(urllib.request.urlopen(URL, timeout=120).read().decode("utf-8"))

def ring(r):
    out = []
    for lon, lat, *_ in r:
        p = [round(lon, 1), round(lat, 1)]
        if not out or out[-1] != p:
            out.append(p)
    return out

feats = []
for f in gj["features"]:
    p = f["properties"]
    iso = p.get("ISO_A3")
    if not iso or iso == "-99":
        iso = p.get("ADM0_A3")
    if iso == "ATA":
        continue  # Antarctica
    g = f["geometry"]
    polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
    rings = [ring(r) for poly in polys for r in poly]
    feats.append({"a": iso, "n": p.get("NAME"), "r": [r for r in rings if len(r) > 2]})

json.dump(feats, open("data/world.json", "w"), separators=(",", ":"))
print(f"world.json: {len(feats)} countries")
