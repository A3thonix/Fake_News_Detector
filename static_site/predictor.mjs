export async function loadModel() {
  const response = await fetch(new URL("model.bin", window.location.href));
  if (!response.ok) {
    throw new Error(`Could not load the prediction model (${response.status}).`);
  }
  if (!("DecompressionStream" in window)) {
    throw new Error("This browser does not support loading the model. Please try a recent version of Chrome, Edge, Firefox, or Safari.");
  }
  const decompressed = response.body.pipeThrough(new DecompressionStream("gzip"));
  const data = await new Response(decompressed).json();
  return {
    bias: data.bias,
    classes: data.classes,
    stopWords: new Set(data.stop_words),
    terms: new Map(data.terms.map(([term, idf, coefficient]) => [
      term,
      [idf, coefficient],
    ])),
  };
}

function tokenize(text) {
  const counts = new Map();
  const tokens = text.toLowerCase().match(/[\p{L}\p{N}_]+/gu) || [];
  for (const token of tokens) {
    if (token.length >= 2) {
      counts.set(token, (counts.get(token) || 0) + 1);
    }
  }
  return counts;
}

export function predict(text, model) {
  let dotProduct = 0;
  let squaredNorm = 0;
  const signals = [];
  for (const [token, count] of tokenize(text)) {
    if (model.stopWords.has(token)) continue;
    const feature = model.terms.get(token);
    if (!feature) continue;
    const [idf, coefficient] = feature;
    const tfidf = count * idf;
    dotProduct += tfidf * coefficient;
    squaredNorm += tfidf * tfidf;
    signals.push({ token, impact: tfidf * coefficient });
  }

  const margin = squaredNorm === 0
    ? model.bias
    : dotProduct / Math.sqrt(squaredNorm) + model.bias;
  const label = margin > 0 ? model.classes[1] : model.classes[0];
  signals.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
  return { label, signals: signals.slice(0, 5) };
}
