(() => {
  const { questions, apiBase } = window.WORKSHOP;
  const $ = id => document.getElementById(id);
  const qKeys = questions.map((_, i) => "q" + (i + 1));
  let key = "", rows = [], busy = false;

  const setStatus = t => { $("status").textContent = t; };
  const auth = () => ({ Authorization: "Bearer " + key });

  async function load() {
    if (busy) return;
    busy = true; $("view").disabled = $("refresh").disabled = true; $("view").textContent = "Loading…"; setStatus("");
    try {
      const r = await fetch(apiBase + "/api/results", { headers: auth(), cache: "no-store" });
      if (!r.ok) throw new Error(r.status === 401 ? "Check your facilitator access key." : "Could not load responses. Please try again.");
      rows = await r.json();
      $("login").hidden = true; $("dashboard").hidden = false;
      render();
    } catch (e) {
      setStatus(e.message || "Could not load responses. Please try again.");
    } finally {
      busy = false; $("view").disabled = $("refresh").disabled = false; $("view").textContent = "View responses →";
    }
  }

  const filtered = () => {
    const q = $("search").value.toLowerCase();
    return rows.filter(r => [r.id, r.name, ...qKeys.map(k => r[k])].join(" ").toLowerCase().includes(q));
  };

  function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  function render() {
    $("stat-subs").textContent = rows.length;
    $("stat-resp").textContent = rows.length * questions.length;
    $("stat-names").textContent = new Set(rows.map(r => r.name.trim().toLowerCase())).size;
    const list = $("list"), shown = filtered();
    $("shown").textContent = `${shown.length} of ${rows.length} submissions shown. CSV exports the current results.`;
    list.innerHTML = "";
    if (!shown.length) { list.appendChild(el("div", "empty", rows.length ? "No matching submissions." : "No submissions yet. Completed responses will appear here.")); return; }
    for (const r of shown) {
      const d = el("details"), s = el("summary");
      s.append(el("b", "", r.name), el("span", "", new Date(r.created_at).toLocaleString()));
      const t = el("span", "response-toggle"); t.append(el("span", "expand-label", "Show more"), el("span", "collapse-label", "Show less")); s.append(t);
      d.append(s, el("p", "eyebrow", "RESPONSE CODE · " + r.id));
      questions.forEach((q, i) => { const sec = el("section"); sec.append(el("h3", "", `${i + 1} · ${q.text}`), el("p", "answer", r[qKeys[i]])); d.append(sec); });
      const dc = el("div", "delete-controls");
      const ask = () => {
        dc.innerHTML = "";
        const del = el("button", "delete-confirm", "Delete response"), cancel = el("button", "", "Cancel");
        del.type = cancel.type = "button";
        del.onclick = () => remove(r.id, del); cancel.onclick = idle;
        dc.append(el("p", "", "Delete this response permanently? This cannot be undone."), del, cancel);
      };
      const idle = () => { dc.innerHTML = ""; const b = el("button", "", "Delete response"); b.type = "button"; b.onclick = ask; dc.append(b); };
      idle(); d.append(dc); list.append(d);
    }
  }

  async function remove(id, btn) {
    btn.disabled = true; btn.textContent = "Deleting…"; setStatus("");
    try {
      const r = await fetch(apiBase + "/api/results", { method: "DELETE", headers: { ...auth(), "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      if (!r.ok) throw new Error(r.status === 401 ? "Your access key was rejected. Lock the page and sign in again." : "Could not delete this response. Please try again.");
      rows = rows.filter(x => x.id !== id); render(); setStatus("Response deleted.");
    } catch (e) { setStatus(e.message); btn.disabled = false; btn.textContent = "Delete response"; }
  }

  function csv() {
    // Prefix cells that start with = + - @ so spreadsheet apps don't run them as formulas.
    const cell = v => '"' + (/^\s*[=+@-]/.test(v) ? "'" : "") + String(v ?? "").replaceAll('"', '""') + '"';
    const header = ["response_code", "submitted_at", "name", ...questions.map((q, i) => `Q${i + 1}. ${q.text}`)];
    const lines = [header.map(cell).join(","), ...filtered().map(r => [r.id, r.created_at, r.name, ...qKeys.map(k => r[k])].map(cell).join(","))];
    const url = URL.createObjectURL(new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = "language-models-responses-" + new Date().toISOString().slice(0, 10) + ".csv";
    document.body.append(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  $("login").onsubmit = e => { e.preventDefault(); key = $("key").value; load(); };
  $("refresh").onclick = load;
  $("search").oninput = render;
  $("csv").onclick = csv;
  $("lock").onclick = () => { key = ""; rows = []; $("key").value = ""; $("search").value = ""; $("dashboard").hidden = true; $("login").hidden = false; setStatus(""); };
})();
