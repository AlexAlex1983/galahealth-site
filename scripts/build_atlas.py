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
            "clean_fuels": (["access-to-clean-fuels-and-technologies-for-cooking", "share-of-the-population-with-access-to-clean-fuels-for-cooking"], "Population using clean fuels for cooking", "%", "WHO / World Bank via Our World in Data"),
    "pm25": (["pm25-air-pollution", "concentrations-of-fine-particulate-matter-pm25"], "Average PM2.5 exposure", "µg/m³", "World Bank / Brauer et al. via Our World in Data"),
    "smoking": (["share-of-adults-who-smoke", "share-of-adults-smoking"], "Adults who smoke tobacco", "%", "WHO via Our World in Data"),
    "hap_death_rate": (["death-rate-household-air-pollution"], "Death rate from household air pollution", "per 100,000", "IHME Global Burden of Disease via Our World in Data"),
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


# WHO GHO indicator codes (NCD Country Capacity Survey and SDG 3.4.1)
GHO_CODES = {
    "spirometry": "NCD_CCS_Spirom",
    "peak_flow": "NCD_CCS_PeakFlow",
    "crd_guidelines": "NCD_CCS_CRD_GUIDE",
    "crd_plan": "NCD_CCS_CRDPlan",
    "ncd_plan": "NCD_CCS_integNCDplan",
    "bronchodilators": "NCD_CCS_Bronchodilators",
    "steroid_inhalers": "NCD_CCS_Steroid",
    "combo_inhaler": "NCD_CCS_ComboInhaler",
    "ncd_premature": "NCDMORT3070",
}
EXTRA_OWID_WHO = {
    "crd_death_rate_who": (["chronic-respiratory-diseases-death-rate-who-mdb"], "Chronic respiratory disease death rate (WHO Mortality Database, age-standardised)", "per 100,000", "WHO Mortality Database via Our World in Data"),
}
# World Bank indicators for the investment-case calculator
WB = {
    "che_pc": ("SH.XPD.CHEX.PC.CD", "Current health expenditure per capita", "US$"),
    "gdp_pc": ("NY.GDP.PCAP.CD", "GDP per capita", "US$"),
}
WB_AGE = ["3034", "3539", "4044", "4549", "5054", "5559", "6064", "6569", "7074", "7579"]


def wb(code):
    txt = get(f"https://api.worldbank.org/v2/country/all/indicator/{code}?format=json&per_page=400&mrnev=1")
    out = {}
    try:
        for d in json.loads(txt)[1] or []:
            iso = d.get("countryiso3code")
            if iso and d.get("value") is not None:
                out[iso] = (float(d["value"]), int(d["date"]))
    except Exception as e:
        print(f"  ! World Bank {code}: {e}", file=sys.stderr)
    return out


CATALOGUE_WORDS = ["respiratory", "copd", "asthma", "obstructive pulmonary", "lung"]


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
        val = d.get("NumericValue")  # numeric indicators; "Value" is text like "12.0 [7.3-18.8]"
        if val is None:
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

    for key, (slugs, label, unit, src) in EXTRA_OWID_WHO.items():
        slug, colname, data = owid(slugs)
        if not data:
            missing.append({"key": key, "tried": slugs}); continue
        years = sorted({y for _, y, _ in data.values()})
        sources[key] = {"label": label, "unit": unit, "source": src, "column": colname,
                        "url": f"https://ourworldindata.org/grapher/{slug}", "years": [years[0], years[-1]]}
        for iso, (v, yr, name) in data.items():
            countries.setdefault(iso, {"name": name})[key] = [round(v, 3), yr]

    for key, (code, label, unit) in WB.items():
        data = wb(code)
        if not data:
            missing.append({"key": key, "code": code}); continue
        years = sorted({y for _, y in data.values()})
        sources[key] = {"label": label, "unit": unit, "source": "World Bank", "code": code,
                        "url": f"https://data.worldbank.org/indicator/{code}", "years": [years[0], years[-1]]}
        for iso, (v, yr) in data.items():
            if iso in countries:
                countries[iso][key] = [round(v, 1), yr]
    # 5-year age groups are published as % of the male / female population, so weight by those totals
    tot = {"MA": wb("SP.POP.TOTL.MA.IN"), "FE": wb("SP.POP.TOTL.FE.IN")}
    parts = {sx: [wb(f"SP.POP.{a}.{sx}.5Y") for a in WB_AGE] for sx in ("MA", "FE")}
    if all(tot.values()) and all(all(p) for p in parts.values()):
        isos = set.intersection(*[set(p) for sx in parts for p in parts[sx]], set(tot["MA"]), set(tot["FE"]))
        for iso in isos:
            if iso in countries:
                n = sum(tot[sx][iso][0] * sum(p[iso][0] for p in parts[sx]) / 100 for sx in parts)
                countries[iso]["pop_30_79"] = [round(n), max(p[iso][1] for sx in parts for p in parts[sx])]
        sources["pop_30_79"] = {"label": "Population aged 30–79", "unit": "people", "source": "World Bank (UN population estimates)",
                                "url": "https://data.worldbank.org/indicator/SP.POP.TOTL", "years": []}
    else:
        missing.append({"key": "pop_30_79"})

    inds = gho_indicators()
    names = {i["IndicatorCode"]: i["IndicatorName"] for i in inds}
    catalogue = [{"code": c, "name": n} for c, n in names.items() if any(w in (n or "").lower() for w in CATALOGUE_WORDS)]
    for key, code in GHO_CODES.items():
        data = gho_data(code)
        if not data:
            missing.append({"key": key, "code": code}); continue
        years = sorted({y for _, y in data.values()})
        sources[key] = {"label": names.get(code, code), "unit": "%" if code == "NCDMORT3070" else "",
                        "source": "WHO Global Health Observatory",
                        "url": f"https://www.who.int/data/gho/data/indicators/indicator-details/GHO/{code}",
                        "code": code, "years": [years[0], years[-1]]}
        for iso, (v, yr) in data.items():
            if iso in countries:
                try:
                    v = round(float(v), 2)
                except (TypeError, ValueError):
                    pass
                countries[iso][key] = [v, yr]

    json.dump({"generated": time.strftime("%Y-%m-%d"), "sources": sources, "countries": countries},
              open("data/atlas.json", "w"), ensure_ascii=False, separators=(",", ":"))
    json.dump({"generated": time.strftime("%Y-%m-%d"), "sources": sources, "missing": missing, "gho_candidates": catalogue},
              open("data/atlas-sources.json", "w"), ensure_ascii=False, indent=1)
    print(f"Wrote {len(countries)} countries, {len(sources)} series; missing: {[m['key'] for m in missing]}", file=sys.stderr)


if __name__ == "__main__":
    main()
