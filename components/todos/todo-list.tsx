"use client";

import { useEffect, useState, type FormEvent } from "react";
import { MAX_TITLE_LENGTH, type Todo } from "@/lib/todos/types";
import { accountTodos } from "@/lib/todos/http-client";
import { GUEST_TODOS_KEY, guestTodos } from "@/lib/todos/guest-storage";

const field = "h-11 min-w-0 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10 disabled:opacity-50";
const button = "rounded-lg px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40";

export function TodoList({ mode = "account" }: { mode?: "guest" | "account" }) {
  const repository = mode === "guest" ? guestTodos : accountTodos;
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const load = () => repository.list(controller.signal)
      .then((todos) => { if (!controller.signal.aborted) { setTodos(todos); setError(""); } })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "一覧を読み込めませんでした。");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    void load();
    function sync(event: StorageEvent) {
      if (mode === "guest" && (event.key === GUEST_TODOS_KEY || event.key === null)) void load();
    }
    window.addEventListener("storage", sync);
    return () => { controller.abort(); window.removeEventListener("storage", sync); };
  }, [revision, repository, mode]);

  async function mutate(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    try { await action(); }
    catch (error) { setError(error instanceof Error ? error.message : "リクエストを処理できませんでした。"); }
    finally { setBusy(false); }
  }

  function add(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || busy || loading) return;
    void mutate(async () => {
      const todo = await repository.create(title);
      setTodos((previous) => [todo, ...previous]);
      setTitle("");
    });
  }

  function update(id: string, changes: { title?: string; completed?: boolean }) {
    void mutate(async () => {
      const todo = await repository.update(id, changes);
      setTodos((previous) => previous.map((item) => item.id === id ? todo : item));
      if ("title" in changes) setEditingId(null);
    });
  }

  function remove(id: string) {
    void mutate(async () => {
      await repository.remove(id);
      setTodos((previous) => previous.filter((item) => item.id !== id));
      if (editingId === id) setEditingId(null);
    });
  }

  const remaining = todos.filter((todo) => !todo.completed).length;
  const visible = todos.filter((todo) => filter === "all" || (filter === "completed" ? todo.completed : !todo.completed));

  return (
    <div className="mt-7 border-t border-gray-100 pt-6" aria-busy={loading || busy}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-semibold">タスク一覧</h2>
        <span className="text-xs text-gray-500">全{todos.length}件・未完了{remaining}件</span>
      </div>
      <form onSubmit={add} noValidate className="mt-4 flex gap-2">
        <label htmlFor="new-todo" className="sr-only">新しいタスク</label>
        <input id="new-todo" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={MAX_TITLE_LENGTH} required disabled={busy || loading} placeholder="やることを入力してください" className={`${field} flex-1`} />
        <button disabled={busy || loading || !title.trim()} className={`${button} shrink-0 bg-[#244b38] text-white hover:bg-[#193d2c]`}>追加</button>
      </form>
      <div className="mt-4 flex flex-wrap items-center gap-1">
        {([['all', 'すべて'], ['active', '未完了'], ['completed', '完了']] as const).map(([value, label]) => (
          <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className={`${button} ${filter === value ? "bg-emerald-50 text-emerald-800" : "text-gray-500 hover:bg-gray-50"}`}>{label}</button>
        ))}
        <button type="button" disabled={busy || loading} onClick={() => { setLoading(true); setRevision((previous) => previous + 1); }} className={`${button} ml-auto text-gray-500 hover:bg-gray-50`}>更新</button>
      </div>
      {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      {loading ? <p role="status" className="py-10 text-center text-sm text-gray-500">一覧を読み込み中...</p> : visible.length === 0 ? (
        <p className="my-5 rounded-2xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-500">{todos.length === 0 ? "最初のタスクを追加しましょう。" : "該当するタスクはありません。"}</p>
      ) : (
        <ul className="mt-3 divide-y divide-gray-100">
          {visible.map((todo) => (
            <li key={todo.id} className="flex items-start gap-3 py-4">
              <input type="checkbox" checked={todo.completed} onChange={(event) => update(todo.id, { completed: event.target.checked })} disabled={busy || editingId === todo.id} aria-label={`${todo.title} の完了状態`} className="mt-3 size-4 shrink-0 accent-[#244b38]" />
              {editingId === todo.id ? (
                <form noValidate className="flex min-w-0 flex-1 flex-wrap gap-2" onSubmit={(event) => { event.preventDefault(); if (draft.trim() && !busy) update(todo.id, { title: draft }); }}>
                  <label htmlFor={`edit-${todo.id}`} className="sr-only">タスクを編集</label>
                  <input id={`edit-${todo.id}`} autoFocus value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={MAX_TITLE_LENGTH} required disabled={busy} className={`${field} w-full`} />
                  <button disabled={busy || !draft.trim()} className={`${button} bg-[#244b38] text-white`}>保存</button>
                  <button type="button" disabled={busy} onClick={() => setEditingId(null)} className={`${button} text-gray-500`}>キャンセル</button>
                </form>
              ) : (
                <>
                  <p className={`min-w-0 flex-1 break-words py-2 text-sm leading-6 ${todo.completed ? "text-gray-400 line-through" : "text-gray-800"}`}>{todo.title}</p>
                  <div className="flex shrink-0 flex-col sm:flex-row">
                    <button type="button" disabled={busy} onClick={() => { setEditingId(todo.id); setDraft(todo.title); }} aria-label={`${todo.title} 編集`} className={`${button} text-gray-500 hover:bg-gray-50`}>編集</button>
                    <button type="button" disabled={busy} onClick={() => remove(todo.id)} aria-label={`${todo.title} 削除`} className={`${button} text-rose-600 hover:bg-rose-50`}>削除</button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
