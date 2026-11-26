import { NextResponse } from "next/server";
import { CONFLICT_CODES } from "@/constants";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ status: "success", data }, { status });
}

export function apiCreated<T>(data: T) {
  return jsonOk(data, 201);
}

export function apiFail(message: string, status = 400) {
  return NextResponse.json({ error: message, status: "fail", data: message }, { status });
}

export function apiError(message = "Server Error", status = 500) {
  return NextResponse.json(
    { error: message, status: "error", data: message },
    { status },
  );
}

export function apiActionResult(result: {
  ok: boolean;
  code?: string;
  message?: string;
  data?: unknown;
}) {
  if (!result.ok) {
    const status = result.code && CONFLICT_CODES.has(result.code) ? 409 : 400;
    return NextResponse.json(result, { status });
  }
  return NextResponse.json(result);
}
