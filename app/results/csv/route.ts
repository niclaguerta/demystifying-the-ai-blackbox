import { isFacilitator } from "../access";
import { questions } from "../../content";
import { listResponses } from "../data";

export const dynamic = "force-dynamic";

function csvCell(value: string) {
  const safeValue = /^\s*[=+@-]|^[\t\r\n]/.test(value) ? "'" + value : value;
  return '"' + safeValue.replaceAll('"', '""') + '"';
}

export async function GET(request: Request) {
  if (!isFacilitator(request.headers)) {
    return new Response("Facilitator access is required.", {
      status: 403,
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  const responses = await listResponses();
  const rows = [
    ["Submitted at (UTC)", ...questions.map(({ title }) => title)],
    ...responses.map((row) => [row.submittedAt, ...questions.map(({ key }) => row[key])]),
  ];
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");

  return new Response("\uFEFF" + csv + "\r\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="idea-workshop-responses.csv"',
      "Cache-Control": "private, no-store",
    },
  });
}
