import { z } from "zod";
import { DEFAULT_REVIEWER } from "@/constants";

export const escalation_params = z.object({
  id: z.string().uuid("Invalid escalation id"),
});

export const escalation_approve_post = z.object({
  reviewer: z.string().trim().min(1).default(DEFAULT_REVIEWER),
});

export const escalation_reject_post = z.object({
  reviewer: z.string().trim().min(1).default(DEFAULT_REVIEWER),
});

export type EscalationParams = z.infer<typeof escalation_params>;
export type EscalationApprovePost = z.infer<typeof escalation_approve_post>;
export type EscalationRejectPost = z.infer<typeof escalation_reject_post>;
