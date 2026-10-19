import gzip
import json
import pickle
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent

with (ROOT / "FakeNews.pkl").open("rb") as model_file:
    model = pickle.load(model_file)

with (ROOT / "vectorizer.pkl").open("rb") as vectorizer_file:
    vectorizer = pickle.load(vectorizer_file)

# The deployed Flask environment uses this legacy pickle with scikit-learn
# 1.5.2, where the pickled transformer has no idf_ attribute. Its transform
# therefore normalizes term counts without applying IDF weights.
idf_values = [1.0] * len(vectorizer.vocabulary_)
terms = [
    [
        term,
        float(idf_values[index]),
        float(model.coef_[0, index]),
    ]
    for term, index in vectorizer.vocabulary_.items()
]

model_data = {
    "bias": float(model.intercept_[0]),
    "classes": [str(label) for label in model.classes_],
    "stop_words": sorted(vectorizer.get_stop_words()),
    "terms": terms,
}

output_path = ROOT / "static_site" / "model.bin"
with gzip.open(output_path, "wt", encoding="utf-8", compresslevel=9) as output:
    json.dump(model_data, output, separators=(",", ":"))

print(f"Exported {len(terms)} terms to {output_path}")
