import { MAX_TITLE_LENGTH, type Todo } from "./types";

export const GUEST_TODOS_KEY = "todo:guest:todos:v1";
export const GUEST_MODE_KEY = "todo:guest:active";

function storage(): Storage {
  try { return window.localStorage; }
  catch { throw new Error("ブラウザーの保存機能を利用できません。Cookie・サイトデータの設定を確認してください。"); }
}

export function isGuestMode() {
  try { return storage().getItem(GUEST_MODE_KEY) === "true"; }
  catch { return false; }
}

export function setGuestMode(active: boolean) {
  try {
    if (active) storage().setItem(GUEST_MODE_KEY, "true");
    else storage().removeItem(GUEST_MODE_KEY);
  } catch {
    throw new Error("ゲストモードの設定を保存できません。ブラウザーのサイトデータ設定を確認してください。");
  }
}

function isTodo(value: unknown): value is Todo {
  if (!value || typeof value !== "object") return false;
  const todo = value as Record<string, unknown>;
  return typeof todo.id === "string" && /^[0-9a-f-]{36}$/i.test(todo.id)
    && typeof todo.title === "string" && !!todo.title.trim() && todo.title.length <= MAX_TITLE_LENGTH
    && typeof todo.completed === "boolean"
    && typeof todo.createdAt === "string" && Number.isFinite(Date.parse(todo.createdAt))
    && typeof todo.updatedAt === "string" && Number.isFinite(Date.parse(todo.updatedAt));
}

export function readGuestTodos(): Todo[] {
  let raw: string | null;
  try { raw = storage().getItem(GUEST_TODOS_KEY); }
  catch { throw new Error("ゲストのタスクを読み込めません。ブラウザーのサイトデータ設定を確認してください。"); }
  if (raw === null) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== "object" || !("version" in data) || data.version !== 1
      || !("todos" in data) || !Array.isArray(data.todos) || !data.todos.every(isTodo)
      || new Set(data.todos.map((todo) => todo.id)).size !== data.todos.length) throw new Error();
    return data.todos.map(({ id, title, completed, createdAt, updatedAt }) => ({ id, title, completed, createdAt, updatedAt }));
  } catch {
    // Keep the original data intact rather than overwriting an unreadable list.
    throw new Error("保存されたゲストデータを読み込めません。サイトデータを確認してください。元のデータは変更していません。");
  }
}

function save(todos: Todo[]) {
  try { storage().setItem(GUEST_TODOS_KEY, JSON.stringify({ version: 1, todos })); }
  catch { throw new Error("タスクを保存できません。ブラウザーの空き容量とサイトデータ設定を確認してください。"); }
}

function titleValue(title: string) {
  const value = title.trim();
  if (!value || value.length > MAX_TITLE_LENGTH) throw new Error(`タスクは1〜${MAX_TITLE_LENGTH}文字で入力してください。`);
  return value;
}

export const guestTodos = {
  async list(signal?: AbortSignal) { signal?.throwIfAborted(); return readGuestTodos(); },
  async create(title: string) {
    const todos = readGuestTodos();
    const now = new Date().toISOString();
    const todo: Todo = { id: crypto.randomUUID(), title: titleValue(title), completed: false, createdAt: now, updatedAt: now };
    save([todo, ...todos]);
    return todo;
  },
  async update(id: string, changes: { title?: string; completed?: boolean }) {
    const todos = readGuestTodos();
    const original = todos.find((todo) => todo.id === id);
    if (!original) throw new Error("タスクが見つかりません。一覧を更新してください。");
    const todo = { ...original, updatedAt: new Date().toISOString() };
    if (changes.title !== undefined) todo.title = titleValue(changes.title);
    if (changes.completed !== undefined) todo.completed = changes.completed;
    save(todos.map((item) => item.id === id ? todo : item));
    return todo;
  },
  async remove(id: string) {
    const todos = readGuestTodos();
    save(todos.filter((todo) => todo.id !== id));
  },
};
