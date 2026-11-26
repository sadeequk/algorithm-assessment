import { z } from "zod";


export const refund_post = z.object({
  orderId: z.coerce.number().int("orderId must be an integer"),
  amountCents: z.coerce.number().int("amountCents must be an integer"),
  reason: z.string().trim().min(1).optional().default("Direct refund API"),
});

export type RefundPost = z.infer<typeof refund_post>;
