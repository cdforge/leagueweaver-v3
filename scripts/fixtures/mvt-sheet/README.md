# MVT sheet — golden fixtures (authoritative expected outputs)

Source: user's MVT Google Sheet —
https://docs.google.com/spreadsheets/d/1xZItJvFRPzJdsC0GZyQna16d2SbcCTlbp4ovpDaq43w/edit
Pulled 2026-08-01. **These files are the authoritative expected values for TEST-0 / AS-1 / MVT-1.** They win
over the reference PNGs (`reference images/MVT and All Star/*`) if they disagree — the sheet is newer.

## Files
- `mvt-source.xlsx` — the full workbook, all 28 tabs (canonical).
- `mvt-20.csv` — **MVT 2.0**: per-team MVT totals + every award's winners/points (Positional, Achievement,
  Div/League, Bonus). → golden truth for **MVT-1**. Read GREEN's actual MVT total here (NOT the PNG's 55.50).
- `all-stars.csv` — **All-Stars**: weekly All-Star team per slot + weekly totals + per-team season counts.
  → golden truth for **AS-1**. Confirmed: Wk1 TOTAL `288.42`, GREEN `23`.
- `mvt-scoring.csv` — **MVT SCORING**: the point rules / tables behind each award (cross-check §AW).
- `league-standings.csv` — **League Standings**: MVTS-SCORE/RANK + ALL-STARS-COUNT/RANK → **STD-1**.
- `settings.csv` — **Settings**: league config (blowout threshold etc. — confirm the exact value here).
- `weekly-scores.csv` — **Weekly Scores**: per-team weekly totals (cross-check Total-Score awards).

## Refresh
`curl -sL "https://docs.google.com/spreadsheets/d/<ID>/export?format=xlsx" -o mvt-source.xlsx`
Per tab: `curl -sL "https://docs.google.com/spreadsheets/d/<ID>/gviz/tq?tqx=out:csv&sheet=<Tab%20Name>"`.

## Note
CSVs are wide/merged (award blocks are laid out horizontally, some `#NAME?`/formula cells). TEST-0's parser
should locate values by header labels, not fixed column indexes.
