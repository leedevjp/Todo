import "server-only";
import { createClient } from "@/lib/supabase/server";
import { MAX_TITLE_LENGTH } from "./types";

export class TodoError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export function json(value: unknown, status = 200) {
  return Response.json(value, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function withUser(request: Request, handler: (userId: string) => Promise<Response>) {
  try {
    if (request.method !== "GET") {
      const origin = request.headers.get("origin");
      if ((origin && origin !== new URL(request.url).origin) || request.headers.get("sec-fetch-site") === "cross-site") {
        throw new TodoError("許可されていないリクエストです。", 403);
      }
    }
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw new TodoError("ログインが必要です。もう一度ログインしてください。", 401);
    return await handler(data.user.id);
  } catch (error) {
    if (error instanceof TodoError) return json({ error: error.message }, error.status);
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
      return json({ error: "タスクが見つかりません。一覧を更新してください。" }, 404);
    }
    // Never expose database connection details or credentials.
    console.error("Todo request failed:", error instanceof Error ? error.name : "UnknownError");
    return json({ error: "タスクを処理できませんでした。しばらく待ってから再度お試しください。" }, 503);
  }
}

export async function readBody(request: Request): Promise<Record<string, unknown>> {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    throw new TodoError("JSON形式でリクエストしてください。", 415);
  }
  let body: unknown;
  try { body = await request.json(); } catch { throw new TodoError("リクエストの形式が正しくありません。"); }
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new TodoError("リクエストの形式が正しくありません。");
  return body as Record<string, unknown>;
}

export function readTitle(value: unknown) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > MAX_TITLE_LENGTH) {
    throw new TodoError(`タスクは1〜${MAX_TITLE_LENGTH}文字で入力してください。`);
  }
  return value.trim();
}

export function checkId(id: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    throw new TodoError("タスクが見つかりません。", 404);
  }
}
