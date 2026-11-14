# Werkomgeving effectenoogst: bouwbestanden

Begin van de werkomgeving (14-11-2026). Dit is werk in uitvoering: er is nog niets getest of gepubliceerd. De opdracht en het ontwerp staan in de overdrachtsprompt die Nele meegeeft.

## Wat hier staat

| Bestand | Wat |
|---|---|
| `base.css` | Gedeelde huisstijl uit het Perspectivity Design System: kleuren, typografie, knoppen, vlakken, tags, lagen en treden van zekerheid |
| `build.py` | Bouwscript: maakt van `src/<naam>.html` een los html-bestand (`uit/static`), een openbare variant (`uit/publiek`) en een fragment voor de Artifact-tool (`uit/artifact`) |
| `fonts.css` | Quicksand en Bitter (vrije lettertypen), ingesloten |
| `ds/` | Logo en het ei uit het design system, verkleind |
| `src/oogstwerkplaats.html` | Scherm en alle stijlen van de Oogstwerkplaats |
| `src/owp-data.js` | Voorbeeldgegevens: de verzonnen coalitie Jong en Zeker, tien veranderingen, vier documenten, vier aannames |

## Wat nog ontbreekt

- `src/owp-app.js`: de logica van de Oogstwerkplaats. `oogstwerkplaats.html` verwijst er al naar; het bouwscript stopt zolang het bestand er niet is.
- De andere drie apps: `src/oogstwijzer.html`, `src/voorstelbouwer.html`, `src/acquisitiebord.html`.

## Lettertypen en beeld

Netto OT en Caecilia zijn gekochte lettertypen en staan bewust niet in deze repo. Zonder die bestanden gebruikt het bouwscript overal Quicksand en Bitter. Zet je `NettoOT-Regular.otf`, `NettoOT-Bold.otf` en de drie `CaeciliaLTPro-*.ttf` uit het design system in `ds/` (staan in `.gitignore`), dan krijgen de besloten varianten de echte lettertypen.

`build.py` kent ook `@PERSOON@` (`ds/person-red-small.png`) en `@PATROON@` (`ds/pattern-s.png`). Die beelden staan in het design system; ontbreken ze, dan vult het script een doorzichtig beeldpunt in.

## Bouwen

```bash
python3 build.py oogstwerkplaats
```
