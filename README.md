<p align="center"><img src="assets/somneiros-logo.png" alt="Somneiros logo" width="720"></p>

# Somneiros

**Understand • Insight • Transform**

Somneiros is a privacy-conscious progressive web app for recording dreams, exploring personal patterns, searching an extensive Dream Interpretation Database, and learning about dreams through scientific, historical, cultural, and psychological perspectives.

## Try the app live

### [https://davidfliesen.github.io/somneiros](https://davidfliesen.github.io/somneiros)

## Features

- One-submit dream interpretation form
- Private local dream journal and JSON export
- Searchable Dream Interpretation Database covering hundreds of symbols and experiences
- Category filters for actions, emotions, people, animals, places, objects, nature, health, life events, and dream phenomena
- Interpretation suggestions based on matched dream elements and personal context
- Understanding Your Dreams learning center
- Evidence labels for documented historical accounts and scientific material
- Dark and light modes
- Installable PWA with offline caching

## Project structure

```text
somneiros/
├── index.html
├── styles.css
├── app.js
├── manifest.webmanifest
├── sw.js
├── assets/
├── data/
│   ├── did_app.json
│   └── understanding_dreams.json
└── notebooks/
    └── Somneiros_DID_Production_Builder.ipynb
```

## Build the production DID

Open `notebooks/Somneiros_DID_Production_Builder.ipynb` in Google Colab. Add the required API key through Colab Secrets, review the production settings, and choose **Build Production DID**. The notebook checkpoints every term, rejects unsupported claims, and exports an upload-ready `did_app.json` plus the full source, QA, graph, CSV, SQLite, and archive files.

The app reads `data/did_app.json`. Replace that file with the notebook’s accepted-record export after a completed production run.

## Evidence policy

Somneiros keeps contemporary sleep science, historical theories, religious and cultural traditions, documented biographical accounts, and reflective symbolism separate. It does not present a universal dream dictionary, diagnosis, prophecy, recovered memory, or supernatural certainty.

## Run locally

```bash
python -m http.server 8000
```

Open `http://localhost:8000`.

## GitHub Pages

Publish from the `main` branch and repository root under **Settings → Pages**.

## License

Choose a code license before public release. Brand and logo assets may use separate terms.
