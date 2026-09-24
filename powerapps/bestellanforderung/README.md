# Power App: Bestellanforderung

Nur die Funktionsweise der App: Screens, Buttons, Statuswechsel und Kommentare.
E-Mails verschickst du über Power Automate Child Flows, die du an den unten genannten
Buttons aufrufst. In `App.Formulas` wird nichts benötigt außer dem vorhandenen `AppTheme`.

## Ablauf

```
Antragsteller ──► Vorgesetzter ──┬── Wert > 5000 ──► GF ──► MaWi
                                 └── Wert ≤ 5000 ─────────► MaWi
```

Statuswerte: `Wartet auf FK` → `Wartet auf GF` (nur über 5000) → `Bei MaWi` → `Erledigt`.
`Abgelehnt` kann der Vorgesetzte (FK) oder die GF setzen.

## SharePoint-Listen

### `Antraege` (Anlagen aktiviert)

| Spalte        | Typ                 | Werte                                                       |
|---------------|---------------------|-------------------------------------------------------------|
| Titel         | Text                | wird mit der Artikelnummer gefüllt                          |
| Fachbereich   | Auswahl             | eure Fachbereiche                                           |
| Artikelnummer | Text                |                                                             |
| Stueckzahl    | Zahl                |                                                             |
| Wert          | Währung             |                                                             |
| Kostenstelle  | Text                |                                                             |
| Lagerort      | Text                | „Wo liegt die Ware“                                         |
| Status        | Auswahl             | `Wartet auf FK`, `Wartet auf GF`, `Bei MaWi`, `Erledigt`, `Abgelehnt` |
| Antragsteller | Person              |                                                             |
| Vorgesetzter  | Person              | aus `'Office365-Benutzer'.ManagerV2(User().EntraObjectId)`  |

### `Kommentare`

| Spalte         | Typ                              | Werte                                       |
|----------------|----------------------------------|---------------------------------------------|
| AnforderungsID | Nachschlagen → `Antraege` (Titel)|                                             |
| RückfrageTyp   | Auswahl                          | `Info`, `Freigabe`, `Ablehnung`, `Erledigt` |
| RückfrageText  | Mehrere Textzeilen               |                                             |
| Person         | Person                           |                                             |

Jede Entscheidung (Freigeben, Ablehnen, Erledigt) schreibt ebenfalls einen Eintrag.
Die Kommentarliste ist damit gleichzeitig der Verlauf.

### `Rollen`

| Spalte | Typ     | Werte        |
|--------|---------|--------------|
| Titel  | Text    | frei         |
| Person | Person  |              |
| Rolle  | Auswahl | `GF`, `MaWi` |

Der Vorgesetzte (FK) steht nicht in dieser Liste, er kommt aus dem Entra ID.

## Einrichtung (Reihenfolge einhalten)

1. **Modern Controls aktivieren**: Einstellungen > Updates > Neu > „Moderne Steuerelemente
   und Designs“ einschalten. Ohne diese Einstellung bricht das Einfügen beim ersten
   modernen Steuerelement ab (Dropdown, Button, Texteingabe) – übrig bleiben nur Header,
   Container und Labels.
2. SharePoint-Listen `Antraege`, `Kommentare`, `Rollen` anlegen.
3. Datenquellen hinzufügen: `Antraege`, `Kommentare`, `Rollen`, `Office365-Benutzer`.
4. Halb eingefügte Screens löschen.
5. Screens einfügen, jeweils kompletten Dateiinhalt kopieren und in der Strukturansicht
   einfügen: `scrAntrag`, `scrMeineAntraege`, `scrFreigaben`, `scrDetail`.
   Rote Formeln wegen noch fehlender Screens verschwinden, sobald alle vier da sind.
6. Datei-Upload: auf `scrAntrag` in `Card_Antrag` ein Formular einfügen
   - Name `frmAnhaenge`, DataSource `Antraege`, DefaultMode `FormMode.New`
   - Felder: nur Anlagen
   - X `164`, Y `358`, Width `420`, Height `180`

Kontrolle nach dem Einfügen von `scrAntrag`: In `Card_Antrag` müssen 19 Elemente stehen,
in `Container_Content_A` zusätzlich drei Nav-Buttons.

## Wo die Child Flows aufgerufen werden

Nach dem `Patch` auf `Antraege` enthält `varAntrag` den gespeicherten Datensatz (inkl. `ID`).

| Screen / Button               | Neuer Status                        | Typischer Empfänger                       |
|-------------------------------|-------------------------------------|-------------------------------------------|
| `scrAntrag` / `btnAbsenden`   | `Wartet auf FK`                     | Vorgesetzter                              |
| `scrDetail` / `btnFreigeben`  | `Wartet auf GF` oder `Bei MaWi`     | GF bzw. MaWi + Info Q/Beschaffung (+GF)   |
| `scrDetail` / `btnAblehnen`   | `Abgelehnt`                         | Antragsteller                             |
| `scrDetail` / `btnErledigt`   | `Erledigt`                          | Antragsteller                             |
