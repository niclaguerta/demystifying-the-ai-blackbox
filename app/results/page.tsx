import { headers } from "next/headers";
import { isFacilitator } from "./access";
import { questions, workshopTitle } from "../content";
import { listResponses } from "./data";

export const dynamic = "force-dynamic";

const dateFormat = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export default async function ResultsPage() {
  if (!isFacilitator(await headers())) {
    return (
      <main className="results wrap">
        <p className="eyebrow">FACILITATOR VIEW</p>
        <h1>Workshop responses</h1>
        <p>Sign in with the facilitator account to see the results.</p>
        <p className="access-links">
          <a className="button" href="/signin-with-chatgpt?return_to=%2Fresults" target="_top">Sign in with ChatGPT</a>
          <a href="/">Back to workshop</a>
        </p>
      </main>
    );
  }

  const responses = await listResponses();

  return (
    <>
      <header className="site-header">
        <a className="wordmark" href="/">{workshopTitle}</a>
        <a href="/">Back to workshop</a>
      </header>
      <main className="results wrap">
        <p className="eyebrow">FACILITATOR VIEW</p>
        <h1>Workshop responses</h1>
        <div className="results-toolbar">
          <p><strong>{responses.length}</strong> {responses.length === 1 ? "submission" : "submissions"}</p>
          <a className="button" href="/results/csv" download>Export CSV</a>
        </div>
        {responses.length === 0 ? (
          <div className="empty"><h2>No submissions yet</h2><p>Completed workshop responses will appear here.</p></div>
        ) : responses.map((response, index) => (
          <details key={response.id} className="result">
            <summary>
              <strong>Submission {responses.length - index}</strong>
              <time dateTime={response.submittedAt}>{dateFormat.format(new Date(response.submittedAt))} UTC</time>
            </summary>
            {questions.map(({ key, title }) => (
              <section key={key}>
                <h2>{title}</h2>
                <p>{response[key]}</p>
              </section>
            ))}
          </details>
        ))}
      </main>
    </>
  );
}
