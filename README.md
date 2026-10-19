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