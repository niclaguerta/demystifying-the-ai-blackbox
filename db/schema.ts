import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const responses = sqliteTable("responses", {
  id: text("id").primaryKey(),
  submittedAt: text("submitted_at").notNull(),
  corpus: text("corpus").notNull(),
  tokenization: text("tokenization").notNull(),
  embeddings: text("embeddings").notNull(),
  lossFunction: text("loss_function").notNull(),
  trainedModel: text("trained_model").notNull(),
});
