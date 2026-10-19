---
title: Fake News Detector
emoji: 📰
colorFrom: blue
colorTo: green
sdk: docker
app_port: 7860
pinned: false
---

# Fake News Detector

A Flask application that predicts whether a news headline is real or fake and
can provide an additional explanation using Google's Gemini API.

## Run locally

1. Install Python 3.11 and the dependencies:

   ```bash
   pip install -r requirements.txt
   ```

2. Set `GEMINI_API_KEY` in your environment to enable Gemini explanations.
   The app can still run its local model without this optional key.
3. Start the app:

   ```bash
   python main.py
   ```

The app listens on `http://localhost:5000` by default.

## Deploy on Render

This repository includes a Render Blueprint in `render.yaml`. Create a new
Blueprint from the GitHub repository in Render. To enable Gemini explanations,
add `GEMINI_API_KEY` in the service's environment settings. Do not commit API
keys or `.env` files. The local prediction model works without the Gemini key.

## Deploy on GitHub Pages

The browser-only version in `static_site/` runs the trained model directly in
the visitor's browser; it does not require a Python server or expose an API key.
To publish it, deploy the contents of `static_site/` to a `gh-pages` branch and
select that branch as the GitHub Pages source in the repository's Pages
settings.

For changes to the model or its pickle files, regenerate the browser model with
`python scripts/export_static_model.py` and commit the updated
`static_site/model.bin`.

## Enable Gemini on the free GitHub Pages app

The browser-based fake/real prediction runs on GitHub Pages. For private Gemini
API calls without publishing an API key, deploy `cloudflare_worker/` as a
Cloudflare Worker and set `GEMINI_API_KEY` as a Worker secret. Never put the key
in this repository or `static_site/api-config.js`. Set
`window.TRUTHLENS_API_URL` in `static_site/api-config.js` to the Worker endpoint
and publish the updated `static_site/` files to the `gh-pages` branch.