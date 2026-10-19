import { loadModel, predict } from "./predictor.mjs";

const form = document.querySelector("#detector-form");
const input = document.querySelector("#news-input");
const button = document.querySelector("#check-button");
const charCount = document.querySelector("#char-count");
const errorMessage = document.querySelector("#error-message");
const resultCard = document.querySelector("#result");
let modelPromise;

input.addEventListener("input", () => {
  charCount.textContent = `${input.value.length.toLocaleString()} / 10,000`;
});

function showResult(prediction) {
  const isReal = prediction.label === "REAL";
  document.querySelector("#verdict").textContent = isReal
    ? "Model leans toward real"
    : "Model flags this as potentially fake";
  const badge = document.querySelector("#verdict-badge");
  badge.textContent = prediction.label;
  badge.className = `verdict-badge ${isReal ? "real" : "fake"}`;

  const signalsList = document.querySelector("#signals-list");
  signalsList.replaceChildren();
  for (const signal of prediction.signals) {
    const item = document.createElement("li");
    const supportsReal = signal.impact > 0;
    item.className = supportsReal ? "real" : "fake";
    item.textContent = `${signal.token} ${supportsReal ? "↑" : "↓"}`;
    signalsList.append(item);
  }
  document.querySelector("#signals-section").hidden = prediction.signals.length === 0;
  resultCard.hidden = false;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorMessage.hidden = true;
  resultCard.hidden = true;
  button.disabled = true;
  button.querySelector("span").textContent = "Checking...";
  try {
    const model = await loadModel();
    showResult(predict(input.value, model));
  } catch (error) {
    errorMessage.textContent = error.message;
    errorMessage.hidden = false;
  } finally {
    button.disabled = false;
    button.querySelector("span").textContent = "Check this story";
  }
});
