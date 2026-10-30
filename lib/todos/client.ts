import type { Todo } from "./types";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, { ...options, cache: "no-store", headers: { "Content-Type": "application/json" } });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new Error("通信に失敗しました。接続を確認して、もう一度お試しください。");
  }
  let data;
  try { data = await response.json(); }
  catch { throw new Error("サーバーからの応答を読み込めませんでした。もう一度お試しください。"); }
  if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "リクエストを処理できませんでした。");
  return data as T;
}

export const accountTodos = {
  async list(signal?: AbortSignal) { return (await request<{ todos: Todo[] }>("/api/todos", { signal })).todos; },
  async create(title: string) {
    return (await request<{ todo: Todo }>("/api/todos", { method: "POST", body: JSON.stringify({ title }) })).todo;
  },
  async update(id: string, changes: { title?: string; completed?: boolean }) {
    return (await request<{ todo: Todo }>(`/api/todos/${id}`, { method: "PATCH", body: JSON.stringify(changes) })).todo;
  },
  async remove(id: string) { await request(`/api/todos/${id}`, { method: "DELETE" }); },
};
