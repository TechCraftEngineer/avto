import { z } from "zod";

export interface GigDocument {
  title?: string;
  description?: string;
  deliverables?: string;
  requiredSkills?: string;
  budgetRange?: string;
  timeline?: string;
}

export interface GigAIResponse {
  message?: string;
  quickReplies?: string[];
  document?: GigDocument;
}

export const gigChatRequestSchema = z.object({
  workspaceId: z.string().uuid(),
  message: z.string().min(1).max(2000),
  currentDocument: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      deliverables: z.string().optional(),
      requiredSkills: z.string().optional(),
      budgetRange: z.string().optional(),
      timeline: z.string().optional(),
    })
    .optional(),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .max(20)
    .optional(),
});

export type GigChatRequest = z.infer<typeof gigChatRequestSchema>;
