"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { maxAnswerLength, questions } from "./content";

export function WorkshopForm() {
  const requestId = useRef<string | null>(null);
  const pending = useRef(false);
  const successHeading = useRef<HTMLHeadingElement>(null);
  const [status, setStatus] = useState<"idle" | "pending" | "submitted">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "submitted") successHeading.current?.focus();
  }, [status]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;

    const answers = Object.fromEntries(new FormData(event.currentTarget));
    if (questions.some(({ key }) => !String(answers[key] ?? "").trim())) {
      setError("Write a response to each of the five questions.");
      return;
    }

    pending.current = true;
    setStatus("pending");
    setError("");
    try {
      requestId.current ??= crypto.randomUUID();
      const response = await fetch("/api/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: requestId.current, answers }),
      });
      if (!response.ok) throw new Error("Submission failed");
      setStatus("submitted");
    } catch {
      setStatus("idle");
      setError("Your responses could not be saved. Your text is still here. Try submitting again.");
    } finally {
      pending.current = false;
    }
  }

  if (status === "submitted") {
    return (
      <section className="wrap confirmation">
        <p className="eyebrow">WORKSHOP ACTIVITY</p>
        <h2 ref={successHeading} tabIndex={-1}>Responses submitted</h2>
        <p>All five answers have been saved.</p>
        <a href="/">Return to the workshop</a>
      </section>
    );
  }

  return (
    <form onSubmit={submit}>
      {questions.map(({ key, title, prompt, color }, index) => (
        <section key={key} id={key} className={"question-band " + color} aria-labelledby={key + "-title"}>
          <div className="wrap question">
            <div className="question-heading">
              <span className="number">{index + 1}</span>
              <h2 id={key + "-title"}>{title}</h2>
            </div>
            <div className="paper">
              <p id={key + "-prompt"}>{prompt}</p>
              <label htmlFor={key + "-answer"}>Your response <span className="sr-only">to {title}</span></label>
              <textarea id={key + "-answer"} name={key} aria-describedby={key + "-prompt"} required maxLength={maxAnswerLength} rows={5} readOnly={status === "pending"} />
            </div>
          </div>
        </section>
      ))}
      <div className="wrap submit-bar">
        <p>All five responses are required.</p>
        {error && <p role="alert" className="error">{error}</p>}
        <button className="button" type="submit" disabled={status === "pending"}>
          {status === "pending" ? "Submitting…" : "Submit responses"}
        </button>
      </div>
    </form>
  );
}
