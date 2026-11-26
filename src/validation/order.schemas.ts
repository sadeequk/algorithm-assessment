import { z } from "zod";

export const order_get_params = z.object({
  id: z.coerce.number().int("Invalid order id"),
});

export type OrderGetParams = z.infer<typeof order_get_params>;
