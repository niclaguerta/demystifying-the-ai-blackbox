import { apiOrigin } from "./config.js";
import { maxAnswerLength, questions } from "./content.js";

const nav = document.querySelector(".topic-nav");
const container = document.querySelector("#questions");
const template = document.querySelector("#question-template");
const form = document.querySelector("#workshop-form");
const button = form.querySelector("button");
const error = document.querySelector("#submit-error");
let requestId;

for (const [index, { key, title, prompt, color }] of questions.entries()) {
  const fragment = template.content.cloneNode(true);
  const section = fragment.querySelector("section");
  section.id = key;
  section.classList.add(color);
  section.setAttribute("aria-labelledby", key + "-title");
  fragment.querySelector(".number").textContent = index + 1;
  const heading = fragment.querySelector("h2");
  heading.id = key + "-title";
  heading.textContent = title;
  const description = fragment.querySelector("p");
  description.id = key + "-prompt";
  description.textContent = prompt;
  const label = fragment.querySelector("label");
  label.htmlFor = key + "-answer";
  label.querySelector("span").textContent = "to " + title;
  const textarea = fragment.querySelector("textarea");
  textarea.id = label.htmlFor;
  textarea.name = key;
  textarea.maxLength = maxAnswerLength;
  textarea.setAttribute("aria-describedby", description.id);
  container.append(fragment);

  const link = document.createElement("a");
  const number = document.createElement("span");
  number.className = "number";
  number.textContent = index + 1;
  link.href = "#" + key;
  link.append(number, title);
  nav.append(link);
}

function showError(message) {
  error.textContent = message;
  error.hidden = !message;
}

button.disabled = !apiOrigin;
if (!apiOrigin) showError("Online submissions are not open yet.");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (button.disabled) return;
  const answers = Object.fromEntries(new FormData(form));
  const blank = questions.find(({ key }) => !answers[key].trim());
  if (blank) {
    showError("Write a response to each of the five questions.");
    form.elements.namedItem(blank.key).focus();
    return;
  }

  const fields = form.querySelectorAll("textarea");
  showError("");
  button.disabled = true;
  button.textContent = "Submitting…";
  fields.forEach((field) => { field.readOnly = true; });
  try {
    requestId ??= crypto.randomUUID();
    const response = await fetch(apiOrigin + "/api/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: requestId, answers }),
    });
    if (response.status !== 204) throw new Error("Submission failed");
    nav.hidden = true;
    form.hidden = true;
    const confirmation = document.querySelector(".confirmation");
    confirmation.hidden = false;
    confirmation.querySelector("h2").focus();
  } catch {
    showError("Your responses could not be saved. Your text is still here. Try submitting again.");
  } finally {
    button.disabled = false;
    button.textContent = "Submit responses";
    fields.forEach((field) => { field.readOnly = false; });
  }
});
