import { z } from "zod";
import { getDb } from "../../../db";
import { responses } from "../../../db/schema";
import { maxAnswerLength, questions } from "../../content";

const answer = z.string().trim().min(1).max(maxAnswerLength);
const payload = z.object({
  id: z.string().uuid(),
  answers: z.object({
    corpus: answer,
    tokenization: answer,
    embeddings: answer,
    lossFunction: answer,
    trainedModel: answer,
  }),
});
const maxBodyLength = questions.length * maxAnswerLength * 6 + 1024;

export async function POST(request: Request) {
  if (request.headers.get("content-type")?.split(";")[0] !== "application/json") {
    return new Response(null, { status: 415 });
  }

  let data: unknown;
  try {
    const body = await request.text();
    if (body.length > maxBodyLength) return new Response(null, { status: 413 });
    data = JSON.parse(body);
  } catch {
    return new Response(null, { status: 400 });
  }

  const result = payload.safeParse(data);
  if (!result.success) return new Response(null, { status: 400 });

  const { id, answers } = result.data;
  await getDb().insert(responses).values({
    id,
    submittedAt: new Date().toISOString(),
    ...answers,
  }).onConflictDoNothing({ target: responses.id });

  return new Response(null, { status: 204 });
}
