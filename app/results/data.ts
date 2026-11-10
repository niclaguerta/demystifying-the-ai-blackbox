import { desc } from "drizzle-orm";
import { getDb } from "../../db";
import { responses } from "../../db/schema";

export function listResponses() {
  return getDb().select().from(responses).orderBy(desc(responses.submittedAt), desc(responses.id));
}
