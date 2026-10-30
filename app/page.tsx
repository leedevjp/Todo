"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { TodoList } from "@/components/todos/todo-list";
import { isGuestMode, setGuestMode } from "@/lib/todos/guest";
import { authErrorMessage } from "@/lib/supabase/auth-message";

type Mode = "signup" | "login";
type Notice = { kind: "success" | "error"; text: string };

export default function Home() {
  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [busy, setBusy] = useState(false);
  const [guest, setGuest] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const pendingFlow = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let subscription: { unsubscribe(): void } | undefined;
    async function initialize() {
      setGuest(isGuestMode());
      try {
        const supabase = createClient();
        subscription = supabase.auth.onAuthStateChange((_event, session) => {
          if (mounted) setUser(session?.user ?? null);
        }).data.subscription;
        const { data } = await supabase.auth.getUser();
        if (mounted) setUser(data.user);
      } catch {
        if (mounted) setNotice({ kind: "error", text: "認証サービスに接続できません。ゲストモードはログインせずに利用できます。" });
      } finally {
        if (mounted) setInitializing(false);
      }
    }
    void initialize();

    const channel = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel("todo-auth");
    if (channel) {
      channel.onmessage = (event: MessageEvent<{ type?: string; flow?: string }>) => {
        if (event.data?.type === "email-verified" && event.data.flow === pendingFlow.current) {
          pendingFlow.current = null;
          setMode("login");
          setNotice({ kind: "success", text: "メール認証が完了しました。ログインできます。" });
        }
      };
    }

    return () => {
      mounted = false;
      subscription?.unsubscribe();
      channel?.close();
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || password.length < 8) {
      setNotice({ kind: "error", text: "有効なメールアドレスと8文字以上のパスワードを入力してください。" });
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const supabase = createClient();
      const cleanEmail = email.trim();

      if (mode === "signup") {
        const flow = window.crypto.randomUUID();
        pendingFlow.current = flow;
        const redirectTo = new URL("/auth/callback", window.location.origin);
        redirectTo.searchParams.set("flow", flow);

        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: { emailRedirectTo: redirectTo.toString() },
        });

        if (error) {
          pendingFlow.current = null;
          setNotice({ kind: "error", text: authErrorMessage(error) });
        } else if (data.session && data.user) {
          setUser(data.user);
          setNotice({ kind: "success", text: "登録とログインが完了しました。" });
        } else {
          setNotice({ kind: "success", text: "確認メールを送信しました。同じブラウザーでリンクを開くと、この画面にも認証完了が表示されます。" });
        }
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      if (error) {
        setNotice({ kind: "error", text: authErrorMessage(error) });
      } else {
        setUser(data.user);
        setNotice({ kind: "success", text: "ログインしました。" });
      }
    } catch {
      setNotice({ kind: "error", text: "認証サービスに接続できませんでした。しばらく待ってから再度お試しください。" });
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    try {
      const { error } = await createClient().auth.signOut();
      if (error) {
        setNotice({ kind: "error", text: authErrorMessage(error) });
        return;
      }
      setUser(null);
      setGuest(false);
      try { setGuestMode(false); } catch { /* Signing out must work even if local storage is unavailable. */ }
      setPassword("");
      setNotice({ kind: "success", text: "ログアウトしました。" });
    } catch {
      setNotice({ kind: "error", text: "ログアウトできませんでした。接続を確認して、もう一度お試しください。" });
    } finally {
      setBusy(false);
    }
  }

  function changeGuestMode(active: boolean) {
    try {
      setGuestMode(active);
      setGuest(active);
      setNotice(null);
      setMode("login");
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "ゲストモードを変更できませんでした。" });
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f6f2] p-5 text-[#18231e]">
      <section className={`w-full ${user || guest ? "max-w-2xl" : "max-w-md"} rounded-3xl bg-white p-7 shadow-[0_24px_80px_rgba(29,50,39,0.12)] sm:p-10`}>
        <div className="mb-8 flex size-11 items-center justify-center rounded-xl bg-[#244b38] text-xl font-semibold text-white" aria-hidden="true">✓</div>
        {initializing ? <p role="status" className="py-8 text-center text-sm text-gray-500">読み込み中...</p> : user || guest ? (
          <>
            <p className="text-xs font-bold tracking-[0.18em] text-emerald-700">{user ? "ログイン中" : "ゲストモード"}</p>
            <h1 className="mt-3 text-3xl font-semibold">今日のタスクを整理しましょう。</h1>
            <p className="mt-3 break-all text-sm text-gray-600">{user ? user.email : "登録せずに、すぐにタスクを管理できます。"}</p>
            {!user && <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">タスクはこのブラウザーに保存されます。サイトデータを削除すると失われ、別の端末とは同期されません。アカウントのタスクとは別に管理されます。</p>}
            {notice && <p role="status" className={`mt-4 rounded-xl p-3 text-sm ${notice.kind === "error" ? "bg-rose-50 text-rose-800" : "bg-emerald-50 text-emerald-800"}`}>{notice.text}</p>}
            <TodoList key={user?.id ?? "guest"} mode={user ? "account" : "guest"} />
            {user ? <button type="button" onClick={signOut} disabled={busy} className="mt-6 h-12 w-full rounded-xl border border-gray-200 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60">{busy ? "処理中..." : "ログアウト"}</button>
              : <button type="button" onClick={() => changeGuestMode(false)} className="mt-6 h-12 w-full rounded-xl border border-gray-200 text-sm font-semibold hover:bg-gray-50">ログイン・新規登録へ</button>}
          </>
        ) : (
          <>
            <p className="text-xs font-bold tracking-[0.18em] text-emerald-700">タスク管理</p>
            <h1 className="mt-3 text-3xl font-semibold">{mode === "signup" ? "アカウントを作成" : "おかえりなさい"}</h1>
            <p className="mt-3 text-sm leading-6 text-gray-600">{mode === "signup" ? "メールアドレスで登録して、タスク管理を始めましょう。" : "登録したメールアドレスとパスワードでログインしてください。"}</p>

            <div className="mt-7 grid grid-cols-2 rounded-xl bg-gray-100 p-1">
              <button type="button" onClick={() => { setMode("signup"); setNotice(null); }} className={"h-10 rounded-lg text-sm font-semibold " + (mode === "signup" ? "bg-white text-[#244b38] shadow-sm" : "text-gray-500")}>新規登録</button>
              <button type="button" onClick={() => { setMode("login"); setNotice(null); }} className={"h-10 rounded-lg text-sm font-semibold " + (mode === "login" ? "bg-white text-[#244b38] shadow-sm" : "text-gray-500")}>ログイン</button>
            </div>

            <form onSubmit={submit} noValidate className="mt-6 space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold">メールアドレス</label>
                <input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="h-12 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10" />
              </div>
              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-semibold">パスワード</label>
                <input id="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="8文字以上で入力してください" className="h-12 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10" />
              </div>
              {notice && <p role="status" aria-live="polite" className={"rounded-xl p-3 text-sm leading-6 " + (notice.kind === "success" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800")}>{notice.text}</p>}
              <button type="submit" disabled={busy} className="h-12 w-full rounded-xl bg-[#244b38] px-5 text-sm font-semibold text-white transition hover:bg-[#193d2c] disabled:cursor-not-allowed disabled:opacity-60">{busy ? "処理中..." : mode === "signup" ? "登録して確認メールを受け取る" : "ログイン"}</button>
            </form>
            <div className="mt-6 border-t border-gray-100 pt-6">
              <button type="button" disabled={busy} onClick={() => changeGuestMode(true)} className="h-12 w-full rounded-xl border border-[#244b38] px-4 text-sm font-semibold text-[#244b38] hover:bg-emerald-50 disabled:opacity-50">登録せずにゲストで始める</button>
              <p className="mt-2 text-center text-xs leading-5 text-gray-500">ゲストのタスクはこのブラウザーにのみ保存されます。</p>
            </div>
            <p className="mt-6 text-center text-xs leading-5 text-gray-500">登録後、メール認証を完了するとアカウントを利用できます。</p>
          </>
        )}
      </section>
    </main>
  );
}
