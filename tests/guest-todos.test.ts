import { beforeEach, test, mock } from "node:test";
import assert from "node:assert/strict";
import { GUEST_MODE_KEY, GUEST_TODOS_KEY, guestTodos, isGuestMode, readGuestTodos, setGuestMode } from "../lib/todos/guest-storage";
import { accountTodos } from "../lib/todos/http-client";
import { authErrorMessage } from "../lib/supabase/auth-message";

class MemoryStorage implements Storage {
  values = new Map<string, string>();
  denyRead = false;
  denyWrite = false;
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  getItem(key: string) {
    if (this.denyRead) throw new DOMException("Blocked", "SecurityError");
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    if (this.denyWrite) throw new DOMException("Full", "QuotaExceededError");
    this.values.set(key, value);
  }
  removeItem(key: string) { this.values.delete(key); }
}

let storage: MemoryStorage;
beforeEach(() => {
  mock.restoreAll();
  storage = new MemoryStorage();
  Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: storage } });
});

test("guest CRUD persists across reads without making network requests", async () => {
  const network = mock.method(globalThis, "fetch", async () => { throw new Error("Guest must not use the network"); });
  assert.deepEqual(readGuestTodos(), []);
  assert.equal(storage.length, 0);
  const first = await guestTodos.create("  買い物  ");
  const second = await guestTodos.create("勉強");
  assert.deepEqual((await guestTodos.list()).map((todo) => todo.id), [second.id, first.id]);
  const changed = await guestTodos.update(first.id, { title: "読書", completed: true });
  assert.equal(changed.title, "読書");
  assert.equal(readGuestTodos().find((todo) => todo.id === first.id)?.completed, true);
  await guestTodos.remove(second.id);
  assert.deepEqual(readGuestTodos(), [changed]);
  assert.equal(network.mock.callCount(), 0);
});

test("leaving and reopening guest mode preserves tasks and unrelated storage", async () => {
  storage.setItem("unrelated", "keep");
  const todo = await guestTodos.create("残すタスク");
  setGuestMode(true);
  assert.equal(isGuestMode(), true);
  assert.equal(storage.getItem(GUEST_MODE_KEY), "true");
  setGuestMode(false);
  assert.equal(isGuestMode(), false);
  assert.deepEqual(readGuestTodos(), [todo]);
  setGuestMode(true);
  assert.deepEqual(await guestTodos.list(), [todo]);
  assert.equal(storage.getItem("unrelated"), "keep");
});

test("corrupt or unsupported data is never silently overwritten", async () => {
  for (const raw of ["broken JSON", JSON.stringify({ version: 2, todos: [] }), JSON.stringify({ version: 1, todos: [{ title: "invalid" }] })]) {
    storage.setItem(GUEST_TODOS_KEY, raw);
    await assert.rejects(guestTodos.create("上書き禁止"), /元のデータは変更していません/);
    assert.equal(storage.getItem(GUEST_TODOS_KEY), raw);
  }
});

test("quota failure keeps the last successfully saved task data", async () => {
  await guestTodos.create("保存済み");
  const before = storage.getItem(GUEST_TODOS_KEY);
  storage.denyWrite = true;
  await assert.rejects(guestTodos.create("保存失敗"), /タスクを保存できません/);
  assert.equal(storage.getItem(GUEST_TODOS_KEY), before);
});

test("blocked storage produces Japanese errors instead of reporting success", async () => {
  storage.denyRead = true;
  assert.equal(isGuestMode(), false);
  await assert.rejects(guestTodos.list(), /ゲストのタスクを読み込めません/);
  storage.denyWrite = true;
  assert.throws(() => setGuestMode(true), /ゲストモードの設定を保存できません/);
});

test("invalid titles and missing tasks cannot change stored data", async () => {
  const todo = await guestTodos.create("保持");
  const before = storage.getItem(GUEST_TODOS_KEY);
  await assert.rejects(guestTodos.create("   "), /1〜200文字/);
  await assert.rejects(guestTodos.update(todo.id, { title: "a".repeat(201) }), /1〜200文字/);
  await assert.rejects(guestTodos.update(crypto.randomUUID(), { title: "存在しない" }), /見つかりません/);
  assert.equal(storage.getItem(GUEST_TODOS_KEY), before);
});

test("account repository uses the authenticated API without reading guest storage", async () => {
  storage.denyRead = true;
  const network = mock.method(globalThis, "fetch", async () => Response.json({ todos: [] }));
  assert.deepEqual(await accountTodos.list(), []);
  assert.equal(network.mock.calls[0].arguments[0], "/api/todos");
});

test("authentication errors always have a Japanese fallback", () => {
  assert.match(authErrorMessage({ code: "invalid_credentials" }), /パスワード/);
  assert.match(authErrorMessage({ code: "email_not_confirmed" }), /メール認証/);
  assert.match(authErrorMessage({ code: "unknown_future_error" }), /認証処理に失敗/);
});
