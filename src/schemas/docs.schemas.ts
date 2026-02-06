import { z } from "zod";

export const DocUploadMetaSchema = z.object({
  kind: z.enum(["cv", "certificate", "other"]).default("other"),
  source: z.string().optional(), // e.g. "linkedin_export", "manual_upload"
});

export type DocUploadMeta = z.infer<typeof DocUploadMetaSchema>;
