from flask import Flask, render_template, request
import pickle
import google.generativeai as genai
import os

app = Flask(__name__)

gemini_api_key = os.getenv("GEMINI_API_KEY")
gemini_model = None
if gemini_api_key:
    genai.configure(api_key=gemini_api_key)
    gemini_model = genai.GenerativeModel('gemini-2.0-flash')

ml_model=pickle.load(open("FakeNews.pkl",'rb'))
vector=pickle.load(open("vectorizer.pkl",'rb'))

def check_fake_news(news_text):
    if gemini_model is None:
        return "Gemini AI is unavailable: GEMINI_API_KEY is not configured."

    prompt = f"""
You are a fake news detection expert. Analyze the following news headline and reply in **very simple language** using this **exact format**:

---
Headline: <Insert headline>

Verdict: REAL or FAKE

Why:
- Bullet point 1 (use simple words)
- Bullet point 2 (use simple words)

What’s the truth:
- If FAKE: Explain what the truth might be in 1–2 lines.
- If REAL: Confirm it with a short note.

Use simple and clear English. Do NOT write long paragraphs. Add line breaks after each section.
---

Headline: "{news_text}"
"""
    try:
        response = gemini_model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        return f"Error while connecting to Gemini AI: {str(e)}"


@app.route('/', methods=['GET', 'POST'])
def home():
    result = None
    gemini = None
    input_text = None

    if request.method == 'POST':
        input_text = request.form.get('News', '')
        if input_text:
            try:
                vect_input = vector.transform([input_text])
                result = ml_model.predict(vect_input)[0]
            except Exception as e:
                result = f"Error during prediction: {e}"
            gemini = check_fake_news(input_text)

    return render_template('index.html', result=result, gemini=gemini, input=input_text)


@app.route('/prediction', methods=['GET', 'POST'])
def prediction():
    result = None
    gemini = None
    input_text = None

    if request.method == "POST":
        input_text = request.form.get("News")
        if input_text:
            try:
                vect_input = vector.transform([input_text])
                result = ml_model.predict(vect_input)[0]
            except Exception as e:
                result = f"Error during prediction: {e}"

            gemini = check_fake_news(input_text)

        return render_template('prediction.html', result=result, gemini=gemini, input=input_text)

    return render_template('prediction.html')



if __name__ == "__main__":
    app.run(host='0.0.0.0', port=int(os.getenv("PORT", "5000")))
