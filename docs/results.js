import { apiOrigin } from "./config.js";
import { questions } from "./content.js";

const login = document.querySelector(".login");
const loginButton = login.querySelector("button");
const keyInput = document.querySelector("#access-key");
const dashboard = document.querySelector("#dashboard");
const search = document.querySelector("#search");
const refresh = document.querySelector("#refresh");
const exportButton = document.querySelector("#export");
const status = document.querySelector("#status");
const list = document.querySelector("#submissions");
const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });
let rows = [];
let filtered = [];
let key = "";
let pending;

loginButton.disabled = !apiOrigin;
if (!apiOrigin) status.textContent = "The response database is not connected yet.";

function element(tag, text, className) {
  const node = document.createElement(tag);
  node.textContent = text;
  if (className) node.className = className;
  return node;
}

function render() {
  const query = search.value.trim().toLowerCase();
  filtered = rows.filter((row) => !query || [row.id, ...questions.map(({ key }) => row[key])]
    .some((answer) => answer.toLowerCase().includes(query)));
  document.querySelector("#total").textContent = rows.length;
  document.querySelector("#answer-count").textContent = rows.length * questions.length;
  document.querySelector("#filter-summary").textContent =
    filtered.length + " of " + rows.length + " submissions shown. CSV exports the current results.";
  exportButton.disabled = filtered.length === 0;
  list.replaceChildren();
  if (filtered.length === 0) {
    list.append(element("div", rows.length ? "No matching submissions." : "No submissions yet. Completed activities will appear here.", "empty"));
    return;
  }
  for (const row of filtered) {
    const details = element("details", "", "result");
    const summary = document.createElement("summary");
    const time = element("time", dateFormat.format(new Date(row.submittedAt)));
    time.dateTime = row.submittedAt;
    summary.append(element("strong", "Submission"), time,
      element("span", "Show more", "toggle-label expand-label"),
      element("span", "Show less", "toggle-label collapse-label"));
    details.append(summary, element("p", "Response code · " + row.id, "response-code eyebrow"));
    questions.forEach(({ key, title }, index) => {
      const section = document.createElement("section");
      section.append(element("h2", (index + 1) + " · " + title), element("p", row[key]));
      details.append(section);
    });
    list.append(details);
  }
}

function lock(message = "") {
  pending?.abort();
  key = "";
  keyInput.value = "";
  rows = [];
  filtered = [];
  list.replaceChildren();
  search.value = "";
  dashboard.hidden = true;
  login.hidden = false;
  status.textContent = message;
  keyInput.focus();
}

async function load() {
  if (pending || !key) return;
  const request = new AbortController();
  pending = request;
  status.textContent = "";
  loginButton.disabled = true;
  refresh.disabled = true;
  try {
    const response = await fetch(apiOrigin + "/api/results", {
      headers: { Authorization: "Bearer " + key },
      signal: request.signal,
      cache: "no-store",
    });
    if (response.status === 401) {
      lock("Check your facilitator access key.");
      return;
    }
    if (!response.ok) throw new Error("Results unavailable");
    const nextRows = await response.json();
    if (request.signal.aborted) return;
    rows = nextRows;
    const wasLocked = dashboard.hidden;
    keyInput.value = "";
    login.hidden = true;
    dashboard.hidden = false;
    render();
    if (wasLocked) document.querySelector(".findings-heading").focus();
  } catch {
    if (!request.signal.aborted) status.textContent = "Could not load responses. Please try again.";
  } finally {
    pending = null;
    loginButton.disabled = !apiOrigin;
    refresh.disabled = false;
  }
}

login.addEventListener("submit", (event) => {
  event.preventDefault();
  key = keyInput.value.trim();
  if (apiOrigin) load();
});
refresh.addEventListener("click", load);
search.addEventListener("input", render);
document.querySelector("#lock").addEventListener("click", () => lock());

function csvCell(text) {
  const safe = /^\s*[=+@-]|^[\t\r\n]/.test(text) ? "'" + text : text;
  return '"' + safe.replaceAll('"', '""') + '"';
}

exportButton.addEventListener("click", () => {
  const records = [
    ["Response code", "Submitted at (UTC)", ...questions.map(({ title }) => title)],
    ...filtered.map((row) => [row.id, row.submittedAt, ...questions.map(({ key }) => row[key])]),
  ];
  const csv = "\uFEFF" + records.map((record) => record.map(csvCell).join(",")).join("\r\n") + "\r\n";
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "workshop-responses-" + new Date().toISOString().slice(0, 10) + ".csv";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
