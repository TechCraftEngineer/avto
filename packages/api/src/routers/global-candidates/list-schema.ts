import { organizationIdSchema, uuidv7Schema } from "@qbs-autonaim/validators";
import { z } from "zod";

export const listInputSchema = z.object({
  organizationId: organizationIdSchema,
  limit: z.number().int().min(1).max(200).default(50),
  cursor: uuidv7Schema.optional(),
  search: z.string().optional(),
  status: z.array(z.enum(["ACTIVE", "BLACKLISTED", "HIRED"])).optional(),
  vacancyId: z.string().optional(),
  skills: z.array(z.string()).optional(),
  sortBy: z
    .enum(["createdAt", "updatedAt", "fullName", "lastActivity"])
    .default("updatedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  lastActivityFrom: z.coerce.date().optional(),
  lastActivityTo: z.coerce.date().optional(),
});

export type ListInput = z.infer<typeof listInputSchema>;
