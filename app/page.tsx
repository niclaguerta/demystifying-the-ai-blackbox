import { questions, workshopTitle } from "./content";
import { WorkshopForm } from "./workshop-form";

export default function WorkshopPage() {
  return (
    <>
      <header className="site-header">
        <a className="wordmark" href="/">{workshopTitle}</a>
        <a href="/results">Facilitator results</a>
      </header>
      <main id="workshop">
        <section className="intro" aria-labelledby="workshop-title">
          <div className="wrap intro-content">
            <p className="eyebrow">WORKSHOP ACTIVITY</p>
            <h1 id="workshop-title">{workshopTitle}</h1>
            <p>Write a response to each question. Submit all five together when you’re ready.</p>
          </div>
        </section>
        <nav className="wrap topic-nav" aria-label="Workshop questions">
          {questions.map(({ key, title }, index) => (
            <a key={key} href={"#" + key}><span className="number">{index + 1}</span> {title}</a>
          ))}
        </nav>
        <WorkshopForm />
      </main>
    </>
  );
}
