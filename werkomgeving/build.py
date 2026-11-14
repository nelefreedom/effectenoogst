#!/usr/bin/env python3
"""Bouwt de werkomgeving effectenoogst in de huisstijl van het Perspectivity Design System.
Bron: src/<naam>.html met bovenaan <title> en <style> (met /*@BASE@*/), dan <!--BODY--> en de pagina-inhoud.
Uit:  uit/static/<Naam>.html    volledig html-bestand met Netto OT en Caecilia (lokaal gebruik, werkt zonder internet)
      uit/publiek/<Naam>.html   zelfde, met de vrije lettertypen Quicksand en Bitter (voor een openbare website)
      uit/artifact/<naam>.html  fragment voor de Artifact-tool, met Netto OT en Caecilia
Gebruik: python3 build.py [naam ...]
"""
import base64, os, re, sys
HIER = os.path.dirname(os.path.abspath(__file__))
LEEG = "R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="  # doorzichtig beeldpunt als een bestand ontbreekt
def b64(p):
    pad = os.path.join(HIER, "ds", p)
    return base64.b64encode(open(pad, "rb").read()).decode() if os.path.exists(pad) else LEEG
def face(fam, f, fmt, w, mime):
    return ('@font-face{font-family:"%s";src:url(data:%s;base64,%s) format("%s");font-weight:%s;font-style:normal;font-display:swap}'
            % (fam, mime, b64(f), fmt, w))
HEEFT_HUISFONTS = os.path.exists(os.path.join(HIER, "ds", "NettoOT-Regular.otf"))
FONTS_HUIS = "\n".join([
    face("Netto OT", "NettoOT-Regular.otf", "opentype", 400, "font/otf"),
    face("Netto OT", "NettoOT-Bold.otf", "opentype", 700, "font/otf"),
    face("Caecilia LT Pro", "CaeciliaLTPro-45Light.ttf", "truetype", 300, "font/ttf"),
    face("Caecilia LT Pro", "CaeciliaLTPro-55Roman.ttf", "truetype", 400, "font/ttf"),
    face("Caecilia LT Pro", "CaeciliaLTPro-75Bold.ttf", "truetype", 700, "font/ttf"),
])
FONTS_VRIJ = open(os.path.join(HIER, "fonts.css"), encoding="utf-8").read()  # Quicksand en Bitter (OFL)
if not HEEFT_HUISFONTS:  # de gekochte lettertypen staan niet in de openbare repo
    FONTS_HUIS = FONTS_VRIJ
IMG = {
    "@EI@": "data:image/png;base64," + b64("egg-s.png"),
    "@LOGO@": "data:image/png;base64," + b64("logo-red-s.png"),
    "@LOGOWIT@": "data:image/png;base64," + b64("logo-red-white-s.png"),
    "@PERSOON@": "data:image/png;base64," + b64("person-red-small.png"),
    "@PATROON@": "data:image/png;base64," + b64("pattern-s.png"),
}
BASE = open(os.path.join(HIER, "base.css"), encoding="utf-8").read()
NAMEN = {
    "oogstwerkplaats": "Oogstwerkplaats.html",
    "oogstwijzer": "Oogstwijzer.html",
    "voorstelbouwer": "Voorstelbouwer.html",
    "acquisitiebord": "Acquisitiebord.html",
}

def bouw(naam):
    src = open(os.path.join(HIER, "src", naam + ".html"), encoding="utf-8").read()
    for m in re.findall(r"/\*@INCLUDE:([\w.\-]+)@\*/", src):
        src = src.replace("/*@INCLUDE:%s@*/" % m, open(os.path.join(HIER, "src", m), encoding="utf-8").read())
    def vul(s, fonts, omg):
        s = s.replace("/*@BASE@*/", fonts + "\n" + BASE)
        for k, v in IMG.items():
            if k in s: s = s.replace(k, v)
        return s.replace("/*@OMGEVING@*/", "window.OMGEVING='%s';" % omg)
    kop, lijf = src.split("<!--BODY-->", 1)
    def doc(k, l):
        return ('<!DOCTYPE html>\n<html lang="nl">\n<head>\n<meta charset="utf-8">\n'
                '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
                + k.strip() + "\n</head>\n<body>\n" + l.strip() + "\n</body>\n</html>\n")
    uit = {}
    uit["static"] = vul(doc(kop, lijf), FONTS_HUIS, "static")
    uit["publiek"] = vul(doc(kop, lijf), FONTS_VRIJ, "publiek")
    uit["artifact"] = vul('<meta name="claude:viewport-fit-sides" content="cover">\n' + kop.strip() + "\n" + lijf.strip() + "\n", FONTS_HUIS, "artifact")
    for soort, tekst in uit.items():
        d = os.path.join(HIER, "uit", soort); os.makedirs(d, exist_ok=True)
        open(os.path.join(d, NAMEN[naam] if soort != "artifact" else naam + ".html"), "w", encoding="utf-8").write(tekst)
    print("%-16s static %5.0f kB · publiek %5.0f kB · artifact %5.0f kB" % (naam, *[len(uit[s]) / 1024 for s in ("static", "publiek", "artifact")]))

if __name__ == "__main__":
    for n in (sys.argv[1:] or [n for n in NAMEN if os.path.exists(os.path.join(HIER, "src", n + ".html"))]):
        bouw(n)
