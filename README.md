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

## Deploy as a Hugging Face Space

Create a new Space with the Docker SDK, then push this repository to the Space's
Git remote. The included `Dockerfile` serves the complete Flask app on port
7860. Add `GEMINI_API_KEY` to the Space's secrets to enable Gemini explanations;
the local prediction model works without it.