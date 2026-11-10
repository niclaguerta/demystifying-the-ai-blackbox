(() => {
  const { questions, apiBase, edition } = window.WORKSHOP;
  const STORE = "blackbox-workshop-v1";
  const $ = id => document.getElementById(id);
  const total = questions.length;

  let state = { answers: questions.map(() => ""), name: "", id: newId(), submitted: false };
  let step = 0, busy = false;

  function newId() { return crypto.randomUUID ? crypto.randomUUID() : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)); }
  try { const saved = JSON.parse(localStorage.getItem(STORE)); if (saved && Array.isArray(saved.answers)) state = { ...state, ...saved, answers: questions.map((_, i) => saved.answers[i] || "") }; } catch {}
  const save = () => { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch {} };

  $("edition").textContent = edition;

  function renderNav() {
    $("steps").innerHTML = "";
    questions.forEach((q, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = i === step ? "active" : "";
      if (i === step) b.setAttribute("aria-current", "step");
      b.innerHTML = `<b>${String(i + 1).padStart(2, "0")}</b><span></span>`;
      b.querySelector("span").textContent = q.short;
      b.onclick = () => go(i);
      $("steps").appendChild(b);
    });
  }

  function render() {
    const last = step === total - 1;
    $("app").className = "workshop tone-" + step;
    $("number").textContent = step + 1;
    $("question").textContent = questions[step].text;
    $("answer").value = state.answers[step];
    $("answer").disabled = state.submitted;
    $("count").textContent = state.answers[step].length.toLocaleString() + " / 20,000";
    $("submit-panel").hidden = !last;
    $("submit-form").hidden = state.submitted;
    $("submitted").hidden = !state.submitted;
    $("name").value = state.name;
    $("prev").disabled = step === 0;
    $("next").hidden = last;
    $("position").textContent = `${step + 1} / ${total}`;
    renderNav();
  }

  function go(i) { step = i; $("status").textContent = ""; render(); window.scrollTo({ top: 0, behavior: "smooth" }); }

  $("answer").addEventListener("input", e => {
    state.answers[step] = e.target.value;
    $("count").textContent = e.target.value.length.toLocaleString() + " / 20,000";
    save();
  });
  $("name").addEventListener("input", e => { state.name = e.target.value; save(); });
  $("prev").onclick = () => go(step - 1);
  $("next").onclick = () => go(step + 1);

  $("submit").onclick = async () => {
    if (busy) return;
    const status = $("status");
    const missing = state.answers.map((a, i) => a.trim() ? null : i + 1).filter(Boolean);
    if (missing.length) { status.textContent = `Please answer question${missing.length > 1 ? "s" : ""} ${missing.join(", ")} before submitting.`; return; }
    if (!state.name.trim()) { status.textContent = "Please enter your name before submitting."; $("name").focus(); return; }
    busy = true; $("submit").disabled = true; $("submit").textContent = "Submitting…"; status.textContent = "";
    try {
      const res = await fetch(apiBase + "/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: state.id, name: state.name, answers: state.answers })
      });
      if (!res.ok) throw new Error();
      state.submitted = true; save(); render();
    } catch {
      status.textContent = "We couldn’t submit your responses. Your draft is still here; please try again.";
    } finally {
      busy = false; $("submit").disabled = false; $("submit").textContent = "Submit";
    }
  };

  $("again").onclick = () => {
    state = { answers: questions.map(() => ""), name: "", id: newId(), submitted: false };
    save(); go(0);
  };

  render();
})();
