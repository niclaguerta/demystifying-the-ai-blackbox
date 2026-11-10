# Demystifying the AI Blackbox · IDEA Workshop

Five written questions (corpus, tokenization, embeddings, loss function, trained model), a required name, and a facilitator page that lists responses and exports them to CSV. It uses the same palette as the authorship site. Headings use Science Gothic, numbers use the original Anisette numerals, and answers use Atkinson Hyperlegible. There are no graphics.

- **Participants:** https://niclaguerta.github.io/demystifying-the-ai-blackbox/
- **Facilitators:** https://niclaguerta.github.io/demystifying-the-ai-blackbox/results.html
- **Backend:** Cloudflare Worker `blackbox-responses` (https://blackbox-responses.niclaguerta.workers.dev) with D1 database `workshop-responses`

## How it fits together

- **Website (GitHub Pages):** `index.html` (participants) and `results.html` (facilitators). These are plain HTML, CSS and JavaScript, so there's no build step.
- **Backend (Cloudflare Worker):** `worker/worker.js` saves submissions in a Cloudflare D1 database. Viewing, deleting and exporting responses require the facilitator key. Responses are never stored in this repository.

## Changing the questions

Edit `config.js`. Each question has a `short` label for the step menu and the full `text`. The results page and the CSV column headers use the same file.

## One-time setup

### 1. Cloudflare (backend)

1. Sign in at dash.cloudflare.com (a free account is enough).
2. **Storage & Databases → D1 → Create database.** Name it `workshop-responses`.
3. **Compute → Workers & Pages → Create → Worker.** Name it, deploy the starter, then click **Edit code**. Replace everything with the contents of `worker/worker.js` and click **Deploy**.
4. In the Worker, go to **Settings → Bindings → Add → D1 database**. Set the variable name to `DB` and choose the `workshop-responses` database.
5. In **Settings → Variables and Secrets → Add**, choose type **Secret**, name it `ADMIN_KEY`, and set its value to the facilitator access key you want.
6. Copy the Worker's address (it looks like `https://<name>.<your-subdomain>.workers.dev`).

The database table is created automatically on the first request.

### 2. GitHub (website)

1. Put the Worker address in `config.js` as `apiBase`.
2. Push the files to the repository's `main` branch.
3. Go to **Settings → Pages → Build and deployment**, choose **Deploy from a branch**, then select `main` and `/ (root)`.
4. The site will be at `https://niclaguerta.github.io/<repo-name>/`, and the facilitator page at `.../results.html`.

If the site is ever served from a different address, add that origin to `ALLOWED_ORIGINS` at the top of `worker/worker.js`.

## CSV export

Columns: `response_code`, `submitted_at` (UTC), `name`, then one column per question, with the question text as the header. The export includes whatever the search box is currently filtering to. Cells that start with `=`, `+`, `-` or `@` get a leading `'` so spreadsheet apps don't treat them as formulas.
