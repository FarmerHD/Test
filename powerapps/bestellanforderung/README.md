# Power App: Bestellanforderung

Canvas-App für den Freigabeprozess einer Bestellanforderung, im gleichen Stil wie die
Maschinendaten-App (Modern Controls, `AppTheme`, Karten mit 620 px Breite, Navigation links).

## Prozess

```
Antragsteller ──► FK ──┬── Wert > 5.000 € ──► Geschäftsführung ──► MaWi Werk 5 / Werk 6
                       │                                            Info: Q + Beschaffung
                       │
                       └── Wert ≤ 5.000 € ──────────────────────► MaWi Werk 5 / Werk 6
                                                                    Info: Q + Beschaffung + GF
```

| Status          | Wer handelt                    | Mail beim Erreichen                        |
|-----------------|--------------------------------|--------------------------------------------|
| Wartet auf FK   | eingetragene Führungskraft     | an FK                                      |
| Wartet auf GF   | alle mit Rolle `GF`            | an GF                                      |
| Bei MaWi        | MaWi des gewählten Werks       | an MaWi + Info an Q, Beschaffung (ggf. GF) |
| Abgeschlossen   | –                              | an Antragsteller                           |
| Abgelehnt       | –                              | an Antragsteller, mit Begründung           |

Genau 5.000 € gilt als „≤ 5.000 €“ (keine GF-Freigabe). Grenze in `nfWertgrenze` änderbar.

## Screens

| Datei                     | Screen             | Zweck                                                   |
|---------------------------|--------------------|---------------------------------------------------------|
| `scrAntrag.pa.yaml`       | `scrAntrag`        | Neuer Antrag inkl. Dateien, FK automatisch aus M365     |
| `scrMeineAntraege.pa.yaml`| `scrMeineAntraege` | Eigene Anträge mit Status-Filter                        |
| `scrFreigaben.pa.yaml`    | `scrFreigaben`     | Offene Aufgaben für FK, GF und MaWi                     |
| `scrDetail.pa.yaml`       | `scrDetail`        | Details, Dateien, Verlauf, Freigeben/Ablehnen/Erledigt  |

## 1. SharePoint-Listen anlegen

### Liste `Antraege`

Spaltennamen genau so anlegen (Power Apps nutzt diese Namen in den Formeln).
Anlagen sind bei SharePoint-Listen standardmäßig aktiv – aktiviert lassen.

| Spalte              | Typ                       | Pflicht | Hinweis                                           |
|---------------------|---------------------------|---------|---------------------------------------------------|
| Titel               | Text (Standard)           | ja      | wird automatisch gefüllt                          |
| Fachbereich         | Auswahl                   | ja      | eigene Werte, z. B. Produktion, Q, Instandhaltung |
| Werk                | Auswahl                   | ja      | `Werk 5`, `Werk 6`                                |
| Artikelnummer       | Text                      | ja      |                                                   |
| Stueckzahl          | Zahl                      | ja      |                                                   |
| Wert                | Währung (€)               | ja      | Gesamtwert der Anforderung                        |
| Kostenstelle        | Text                      | nein    |                                                   |
| Lagerort            | Text                      | nein    | „Wo liegt die Ware“                               |
| Status              | Auswahl                   | ja      | `Wartet auf FK`, `Wartet auf GF`, `Bei MaWi`, `Abgeschlossen`, `Abgelehnt` |
| AntragstellerName   | Text                      | nein    |                                                   |
| AntragstellerEmail  | Text                      | nein    |                                                   |
| FKName              | Text                      | nein    |                                                   |
| FKEmail             | Text                      | nein    |                                                   |
| FKDatum             | Datum und Uhrzeit         | nein    |                                                   |
| GFName              | Text                      | nein    |                                                   |
| GFDatum             | Datum und Uhrzeit         | nein    |                                                   |
| MaWiName            | Text                      | nein    |                                                   |
| MaWiDatum           | Datum und Uhrzeit         | nein    |                                                   |

In SharePoint nur `Titel` als Pflicht markieren. Die Pflichtprüfung der übrigen Felder
übernimmt die App (Button „Antrag absenden“ ist erst aktiv, wenn alles ausgefüllt ist).

### Liste `Kommentare`

Alle Kommentare liegen in einer eigenen Liste – gleicher Aufbau wie
`KommentareRueckfragen` in der Material- & Dienstleisteranforderung.

| Spalte         | Typ                              | Werte / Hinweis                                     |
|----------------|----------------------------------|-----------------------------------------------------|
| Titel          | Text (Standard)                  | in SharePoint auf „nicht erforderlich“ stellen      |
| AnforderungsID | Nachschlagen → `Antraege`, Titel | Bezug zum Antrag                                    |
| RückfrageTyp   | Auswahl                          | `Info`, `Freigabe`, `Ablehnung`, `Erledigt`         |
| RückfrageText  | Mehrere Textzeilen (Nur-Text)    |                                                     |
| Person         | Person oder Gruppe               |                                                     |

Woher Einträge kommen:

- **Info**: Feld „Kommentar“ beim Absenden und `+` im Kommentarbereich des Detail-Screens.
  Eigene Info-Kommentare sind bearbeitbar/löschbar, bis der Antrag abgeschlossen oder abgelehnt ist.
- **Freigabe / Ablehnung**: Kommentar von FK oder GF bei der Entscheidung (Ablehnung nur mit Text).
- **Erledigt**: Kommentar der MaWi beim Abschließen.

Entscheidungs-Kommentare sind nicht bearbeitbar.

### Liste `Empfaenger`

Steuert Rollen und Mailverteiler. Pflege direkt in SharePoint.

| Spalte | Typ     | Werte                              |
|--------|---------|------------------------------------|
| Titel  | Text    | Name der Person                    |
| Rolle  | Auswahl | `GF`, `MaWi`, `Q`, `Beschaffung`   |
| Werk   | Auswahl | `Werk 5`, `Werk 6` (nur bei MaWi)  |
| Email  | Text    | Mailadresse (= Anmeldename in M365) |

Beispiel:

| Titel         | Rolle       | Werk   | Email                 |
|---------------|-------------|--------|-----------------------|
| Max Chef      | GF          |        | max.chef@firma.de     |
| Lager W5      | MaWi        | Werk 5 | mawi-w5@firma.de      |
| Lager W6      | MaWi        | Werk 6 | mawi-w6@firma.de      |
| Qualität      | Q           |        | qualitaet@firma.de    |
| Einkauf       | Beschaffung |        | einkauf@firma.de      |

Mehrere Personen pro Rolle sind möglich – jede Zeile bekommt die Mail.
Die Führungskraft steht nicht in dieser Liste: sie kommt pro Antrag aus Microsoft 365
(Manager des Antragstellers) und ist im Antrag überschreibbar.

## 2. App einrichten

1. Neue Canvas-App (Tablet-Format) anlegen.
2. **Daten** hinzufügen: SharePoint `Antraege`, `Kommentare`, `Empfaenger`,
   **Office 365 Outlook**, **Office 365 Users**.
3. **Einstellungen > Updates**: „Modern controls and themes“ aktivieren.
4. **App > Formulas**: kompletten Inhalt aus `App.Formulas.txt` einfügen.
   Die Datei ist in deutscher Formel-Syntax (`;` zwischen Argumenten, `;;` zwischen
   Formeln), passend zu deutschem Power Apps Studio. Die `.pa.yaml`-Dateien bleiben
   in englischer Syntax – das ist beim Einfügen von YAML immer so.
   Web-Link der App später in `nfAppLink` eintragen (Details > Web-Link), damit der
   Link in den Mails direkt den Antrag öffnet.
5. **App > StartScreen**: `If(!IsBlank(Param("antragId")); scrDetail; scrAntrag)`
6. Screens einfügen: Inhalt einer `.pa.yaml`-Datei kopieren, in der Strukturansicht
   Rechtsklick > **Einfügen**. Reihenfolge: `scrAntrag`, `scrMeineAntraege`,
   `scrFreigaben`, `scrDetail`. Fehler wegen noch fehlender Screens verschwinden,
   sobald alle vier eingefügt sind.

### Dateien-Upload (`frmAnhaenge`)

Das Anlagen-Steuerelement funktioniert nur innerhalb eines Formulars. Deshalb einmal
von Hand einfügen:

1. Auf `scrAntrag` in `Card_Antrag`: **Einfügen > Formular bearbeiten**.
2. Name: `frmAnhaenge`
3. `DataSource`: `Antraege`
4. `DefaultMode`: `FormMode.New`
5. Felder bearbeiten: alle Felder entfernen, nur **Anlagen** hinzufügen.
6. Position: `X = 164`, `Y = 528`, `Width = 420`, `Height = 78`.
7. Label `lblAnhaengePlatzhalter` löschen.

Beim Absenden übernimmt `Patch(..., frmAnhaenge.Updates, {...})` die Dateien mit.
Im Detail-Screen werden die Dateien über `varAntrag.Attachments` angezeigt und per
Button geöffnet.

### App bleibt leer (nur Header sichtbar)

Fast immer ein Fehler in **App > Formulas**. Dann fehlt `AppTheme`, alle Farben werden
leer/transparent und Texte und Karten sind unsichtbar.

1. App-Objekt in der Strukturansicht wählen, Eigenschaft `Formulas` öffnen.
2. Rote Unterstreichung suchen. Häufige Ursachen:
   - Liste `Empfaenger` noch nicht als Datenquelle verbunden.
   - Spaltenname abweichend (z. B. `Rolle`, `Email`, `Werk`).
   - In Named Formulas Variablen oder Steuerelemente verwendet – das ist nicht erlaubt.
3. Sobald `Formulas` fehlerfrei ist, erscheint der Inhalt.

Alles, was vom geöffneten Antrag abhängt (Rechte, MaWi-Empfänger, Mail-Text), wird
deshalb im `OnVisible` von `scrDetail` als Variable gesetzt (`varDarfFK`, `varDarfGF`,
`varDarfMaWi`, `varMailMaWi`, `varMailDetails`).

## 3. Test

1. Eigenen Benutzer in `Empfaenger` als `GF` und als `MaWi` für `Werk 5` eintragen.
2. Antrag mit Wert 1.000 € anlegen, eigene Mail als Führungskraft eintragen.
3. In „Freigaben“ als FK freigeben → Status `Bei MaWi`, Mails an MaWi und Info-Verteiler.
4. Als MaWi „Als erledigt markieren“ → Status `Abgeschlossen`, Mail an Antragsteller.
5. Das Gleiche mit 6.000 € → nach FK-Freigabe zuerst `Wartet auf GF`.
6. Ablehnen ohne Kommentar ist gesperrt; mit Kommentar geht Mail an Antragsteller.
7. Im Detail-Screen über `+` einen Kommentar anlegen, bearbeiten, löschen.

## Anpassen

- **Wertgrenze**: `nfWertgrenze` in App.Formulas.
- **Weitere Werke**: Auswahlwert in `Antraege.Werk` und `Empfaenger.Werk` ergänzen,
  MaWi-Zeile in `Empfaenger` anlegen. Keine Formeländerung nötig.
- **Fachbereiche**: Auswahlwerte der Spalte `Antraege.Fachbereich` pflegen – das
  Dropdown liest sie über `Choices(Antraege.Fachbereich)`.
- **Farben**: `AppTheme` in App.Formulas, identisch mit den anderen Apps.
