"""
Builds data/atlas.json for the Lung Health Atlas (atlas.html) from public sources:
  - Our World in Data grapher CSVs (IHME GBD, WHO, World Bank data)
  - WHO Global Health Observatory OData API (NCD Country Capacity Survey items)
Runs in GitHub Actions (.github/workflows/atlas-data.yml). Every series that is
found is listed in data/atlas-sources.json with its source and year; anything
that cannot be fetched is skipped and logged, never invented.
"""
import csv, io, json, sys, time, urllib.parse, urllib.request

UA = {"User-Agent": "GALA-Health-Atlas/1.0 (info@galahealth.org)"}


def get(url, tries=3):
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=90) as r:
                return r.read().decode("utf-8")
        except Exception as e:
            print(f"  ! {url} -> {e}", file=sys.stderr)
            time.sleep(3 * (i + 1))
    return None


# key: (candidate OWID slugs, label, unit, source)
OWID = {
    "crd_death_rate": (["respiratory-disease-death-rate"], "Chronic respiratory disease death rate (age-standardised)", "per 100,000", "IHME Global Burden of Disease via Our World in Data"),
    "crd_deaths": (["deaths-from-respiratory-disease"], "Deaths from chronic respiratory diseases", "deaths", "IHME Global Burden of Disease via Our World in Data"),
    "crd_prevalence": (["share-of-population-with-chronic-respiratory-diseases", "chronic-respiratory-diseases-prevalence", "prevalence-of-chronic-respiratory-diseases"], "People living with a chronic respiratory disease", "% of population", "IHME Global Burden of Disease via Our World in Data"),
    "copd_death_rate": (["copd-death-rate", "death-rate-from-copd", "chronic-obstructive-pulmonary-disease-death-rate"], "COPD death rate", "per 100,000", "IHME Global Burden of Disease via Our World in Data"),
    "clean_fuels": (["access-to-clean-fuels-and-technologies-for-cooking", "share-of-the-population-with-access-to-clean-fuels-for-cooking"], "Population using clean fuels for cooking", "%", "WHO / World Bank via Our World in Data"),
    "pm25": (["pm25-air-pollution", "concentrations-of-fine-particulate-matter-pm25"], "Average PM2.5 exposure", "µg/m³", "World Bank / Brauer et al. via Our World in Data"),
    "smoking": (["share-of-adults-who-smoke", "share-of-adults-smoking"], "Adults who smoke tobacco", "%", "WHO via Our World in Data"),
    "hap_death_rate": (["death-rate-from-indoor-air-pollution", "death-rate-household-air-pollution", "indoor-pollution-death-rate"], "Death rate from household air pollution", "per 100,000", "IHME Global Burden of Disease via Our World in Data"),
    "population": (["population"], "Population", "people", "UN WPP via Our World in Data"),
}


def owid(slugs):
    for slug in slugs:
        txt = get(f"https://ourworldindata.org/grapher/{slug}.csv?v=1&csvType=full&useColumnShortNames=false")
        if not txt or not txt.startswith("Entity"):
            continue
        rows = list(csv.reader(io.StringIO(txt)))
        head, out = rows[0], {}
        col = 3  # Entity, Code, Year, value...
        for r in rows[1:]:
            if len(r) <= col or not r[1] or r[1].startswith("OWID") or r[col] == "":
                continue
            iso, yr = r[1], int(r[2])
            try:
                v = float(r[col])
            except ValueError:
                continue
            if iso not in out or yr > out[iso][1]:
                out[iso] = (v, yr, r[0])
        print(f"  OWID {slug}: {len(out)} countries, column '{head[col]}'", file=sys.stderr)
        return slug, head[col], out
    return None, None, {}


GHO_SEARCH = {
    "spirometry": ["spirometry", "peak flow"],
    "crd_guidelines": ["chronic respiratory disease", "guidelines for the management of chronic respiratory", "evidence-based national guidelines"],
    "ncd_plan": ["operational multisectoral national NCD policy", "operational NCD policy", "national NCD policy"],
    "inhaled_meds": ["steroid inhaler", "bronchodilator", "inhaler"],
}


def gho_indicators():
    txt = get("https://ghoapi.azureedge.net/api/Indicator")
    if not txt:
        return []
    return json.loads(txt).get("value", [])


def gho_data(code):
    url = "https://ghoapi.azureedge.net/api/" + urllib.parse.quote(code) + "?$filter=" + urllib.parse.quote("SpatialDimType eq 'COUNTRY'")
    txt = get(url)
    if not txt:
        return {}
    out = {}
    for d in json.loads(txt).get("value", []):
        iso, yr = d.get("SpatialDim"), d.get("TimeDim") or 0
        if (d.get("Dim1") or "") not in ("", "SEX_BTSX", "BTSX") and d.get("Dim1Type") == "SEX":
            continue
        val = d.get("Value")
        if iso and val not in (None, "") and (iso not in out or yr > out[iso][1]):
            out[iso] = (val, yr)
    return out


def main():
    countries, sources, missing = {}, {}, []
    for key, (slugs, label, unit, src) in OWID.items():
        slug, colname, data = owid(slugs)
        if not data:
            missing.append({"key": key, "tried": slugs})
            continue
        years = sorted({y for _, y, _ in data.values()})
        sources[key] = {"label": label, "unit": unit, "source": src, "column": colname,
                        "url": f"https://ourworldindata.org/grapher/{slug}", "years": [years[0], years[-1]]}
        for iso, (v, yr, name) in data.items():
            c = countries.setdefault(iso, {"name": name})
            c[key] = [round(v, 3), yr]

    inds = gho_indicators()
    print(f"GHO indicators: {len(inds)}", file=sys.stderr)
    catalogue = []
    for key, words in GHO_SEARCH.items():
        hits = [i for i in inds if any(w.lower() in (i.get("IndicatorName") or "").lower() for w in words)]
        for h in hits:
            catalogue.append({"key": key, "code": h["IndicatorCode"], "name": h["IndicatorName"]})
        best = None
        for h in hits:
            data = gho_data(h["IndicatorCode"])
            if len(data) > 60:
                best = (h, data)
                break
        if not best:
            missing.append({"key": key, "candidates": [h["IndicatorCode"] for h in hits][:10]})
            continue
        h, data = best
        years = sorted({y for _, y in data.values()})
        sources[key] = {"label": h["IndicatorName"], "unit": "", "source": "WHO Global Health Observatory (NCD Country Capacity Survey)",
                        "url": f"https://www.who.int/data/gho/data/indicators/indicator-details/GHO/{h['IndicatorCode']}",
                        "code": h["IndicatorCode"], "years": [years[0], years[-1]]}
        for iso, (v, yr) in data.items():
            if iso in countries:
                countries[iso][key] = [v, yr]

    json.dump({"generated": time.strftime("%Y-%m-%d"), "sources": sources, "countries": countries},
              open("data/atlas.json", "w"), ensure_ascii=False, separators=(",", ":"))
    json.dump({"generated": time.strftime("%Y-%m-%d"), "sources": sources, "missing": missing, "gho_candidates": catalogue},
              open("data/atlas-sources.json", "w"), ensure_ascii=False, indent=1)
    print(f"Wrote {len(countries)} countries, {len(sources)} series; missing: {[m['key'] for m in missing]}", file=sys.stderr)


if __name__ == "__main__":
    main()
