import { z } from "zod";


export function validate<T extends z.ZodType>(
  schema: T,
  data: unknown,
): z.infer<T> {
  return schema.parse(data);
}

export async function validateJson<T extends z.ZodType>(
  schema: T,
  req: Request,
): Promise<z.infer<T>> {
  const body = await req.json().catch(() => ({}));
  return schema.parse(body);
}
