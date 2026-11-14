# Werkomgeving effectenoogst: bouwbestanden

Vier apps bij het aanbod Meer impact met een effectenoogst. Elke app is één html-bestand zonder afhankelijkheden en werkt zonder internet.

| App | Voor wie | Bron | Waar het staat |
|---|---|---|---|
| Oogstwerkplaats | klanten en prospects | `src/oogstwerkplaats.html`, `src/owp-app.js`, `src/owp-data.js` | `Oogstwerkplaats.html` in de hoofdmap van de site, en als Artifact |
| Oogstwijzer | prospects | `src/oogstwijzer.html` | `Oogstwijzer.html` in de hoofdmap van de site, en als Artifact |
| Voorstelbouwer | alleen intern | niet in deze repo | besloten Artifact |
| Acquisitiebord | alleen intern | niet in deze repo | besloten Artifact |

## Wat hier staat

| Bestand | Wat |
|---|---|
| `base.css` | Gedeelde huisstijl uit het Perspectivity Design System: kleuren, typografie, knoppen, vlakken, tags, lagen en treden van zekerheid |
| `build.py` | Bouwscript: maakt van `src/<naam>.html` een los html-bestand (`uit/static`), een openbare variant (`uit/publiek`) en een fragment voor de Artifact-tool (`uit/artifact`) |
| `fonts.css` | Quicksand en Bitter (vrije lettertypen), ingesloten |
| `ds/` | Logo en het ei uit het design system, verkleind |
| `src/` | Bron van de twee openbare apps |

## Wat hier bewust niet staat

- De bron van de Voorstelbouwer en het Acquisitiebord. Die bevatten prijzen, uren en werkwijze en horen niet in een openbare repo. Het bouwscript zoekt ze in `prive/` (staat in `.gitignore`). De bron hangt als bijlage aan de besloten Artifact (`bron/<naam>.src.txt`); zet die terug in `prive/<naam>.html` om verder te bouwen.
- Netto OT en Caecilia. Dat zijn gekochte lettertypen. Zet `NettoOT-Regular.otf`, `NettoOT-Bold.otf` en de drie `CaeciliaLTPro-*.ttf` uit het design system in `ds/` (staan in `.gitignore`), dan krijgen de varianten `static` en `artifact` de echte lettertypen. Zonder die bestanden gebruikt het bouwscript overal Quicksand en Bitter. De openbare variant gebruikt altijd de vrije lettertypen.
- Het klantenregister. Dat laadt de gebruiker zelf in het Acquisitiebord; het blijft in de browser.

## Bouwen en publiceren

```bash
python3 build.py
```

```bash
cp uit/publiek/Oogstwerkplaats.html uit/publiek/Oogstwijzer.html ..
```

De openbare site verandert alleen via een samenvoegverzoek.

## Hoe de pagina weet waar ze draait

Het bouwscript zet `window.OMGEVING` op `static`, `publiek` of `artifact`.

- `artifact`: printen en downloaden via een link werken daar niet. De apps gebruiken `claude.use("downloads")` om een bestand te bewaren en `claude.use("sample")` om Claude een geplakte tekst te laten lezen. De navraaglink en de antwoordcode staan daar uit.
- `static` en `publiek`: printen via de browser, bewaren via een download, navraag met een deelbare link en een antwoordcode.

## Testen

Alles is met Playwright doorgeklikt op 1280 en 390 breed: de zes stappen van de Oogstwerkplaats met de voorbeeldgegevens, zonder fouten in de console en zonder horizontaal scrollen. De teksten van de tien veranderingen zijn vergeleken met `Dashboard De oogst.md`.
