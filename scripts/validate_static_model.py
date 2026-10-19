import csv
import json
import pickle
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
import export_static_model  # noqa: E402


with (ROOT / "FakeNews.pkl").open("rb") as model_file:
    model = pickle.load(model_file)

with (ROOT / "vectorizer.pkl").open("rb") as vectorizer_file:
    vectorizer = pickle.load(vectorizer_file)

headlines = [
    "Scientists report a major breakthrough in clean energy research",
    "Government secretly replaces all drinking water with chemicals",
    "The local football team won its championship final",
    "Doctors discover that eating one fruit cures every disease",
    "Officials announce new public transport schedule for Monday",
    "This unbelievable miracle will change your life overnight",
    "The committee released its annual report on economic growth",
    "Celebrity says shocking truth about secret world leaders",
]

with (ROOT / "fake_or_real_news.csv").open(
    encoding="utf-8", newline="", errors="replace"
) as dataset_file:
    for row in csv.DictReader(dataset_file):
        headline = row.get("title", "").strip()
        if headline:
            headlines.append(headline)
        if len(headlines) >= 208:
            break

node_script = """
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { predict } from './static_site/predictor.mjs';
const data = JSON.parse(gunzipSync(readFileSync('./static_site/model.bin')));
const model = {
  bias: data.bias,
  classes: data.classes,
  stopWords: new Set(data.stop_words),
  terms: new Map(data.terms.map(([term, idf, coefficient]) => [
    term, [idf, coefficient]
  ])),
};
let input = '';
for await (const chunk of process.stdin) input += chunk;
const headlines = JSON.parse(input);
console.log(JSON.stringify(headlines.map((headline) => predict(headline, model).label)));
"""

process = subprocess.run(
    ["node", "--input-type=module", "-e", node_script],
    input=json.dumps(headlines),
    text=True,
    capture_output=True,
    cwd=ROOT,
    check=True,
)
browser_labels = json.loads(process.stdout)
python_labels = model.predict(vectorizer.transform(headlines)).tolist()

if browser_labels != python_labels:
    mismatches = [
        (headline, expected, actual)
        for headline, expected, actual in zip(headlines, python_labels, browser_labels)
        if expected != actual
    ]
    raise SystemExit(f"Static/browser model mismatches: {mismatches[:10]}")

print(f"Static predictor matches scikit-learn on all {len(headlines)} headlines.")
