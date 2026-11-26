import { z } from "zod";


export const request_post = z.object({
  customerMessage: z
    .string()
    .trim()
    .min(1, "customerMessage is required"),
  customerEmail: z
    .string()
    .trim()
    .email("customerEmail must be a valid email")
    .toLowerCase()
    .optional(),
});


export const request_get_params = z.object({
  id: z.string().uuid("Invalid request id"),
});

export type RequestPost = z.infer<typeof request_post>;
export type RequestGetParams = z.infer<typeof request_get_params>;
