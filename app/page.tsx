"use client";

import { AuthForm } from "@/components/auth/auth-form";
import { TodoList } from "@/components/todos/todo-list";
import { useAuth } from "@/hooks/use-auth";

export default function Home() {
  const auth = useAuth();
  const hasWorkspace = !!auth.user || auth.guest;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f6f2] p-5 text-[#18231e]">
      <section className={`w-full ${hasWorkspace ? "max-w-2xl" : "max-w-md"} rounded-3xl bg-white p-7 shadow-[0_24px_80px_rgba(29,50,39,0.12)] sm:p-10`}>
        <div className="mb-8 flex size-11 items-center justify-center rounded-xl bg-[#244b38] text-xl font-semibold text-white" aria-hidden="true">✓</div>
        {auth.initializing ? (
          <p role="status" className="py-8 text-center text-sm text-gray-500">読み込み中...</p>
        ) : hasWorkspace ? (
          <>
            <p className="text-xs font-bold tracking-[0.18em] text-emerald-700">{auth.user ? "ログイン中" : "ゲストモード"}</p>
            <h1 className="mt-3 text-3xl font-semibold">今日のタスクを整理しましょう。</h1>
            <p className="mt-3 break-all text-sm text-gray-600">{auth.user ? auth.user.email : "登録せずに、すぐにタスクを管理できます。"}</p>
            {!auth.user && (
              <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">タスクはこのブラウザーに保存されます。サイトデータを削除すると失われ、別の端末とは同期されません。アカウントのタスクとは別に管理されます。</p>
            )}
            {auth.notice && (
              <p role="status" className={`mt-4 rounded-xl p-3 text-sm ${auth.notice.kind === "error" ? "bg-rose-50 text-rose-800" : "bg-emerald-50 text-emerald-800"}`}>{auth.notice.text}</p>
            )}
            <TodoList key={auth.user?.id ?? "guest"} mode={auth.user ? "account" : "guest"} />
            {auth.user ? (
              <button type="button" onClick={auth.signOut} disabled={auth.busy} className="mt-6 h-12 w-full rounded-xl border border-gray-200 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60">{auth.busy ? "処理中..." : "ログアウト"}</button>
            ) : (
              <button type="button" onClick={() => auth.changeGuestMode(false)} className="mt-6 h-12 w-full rounded-xl border border-gray-200 text-sm font-semibold hover:bg-gray-50">ログイン・新規登録へ</button>
            )}
          </>
        ) : (
          <AuthForm
            mode={auth.mode}
            email={auth.email}
            password={auth.password}
            notice={auth.notice}
            busy={auth.busy}
            onModeChange={auth.changeMode}
            onEmailChange={auth.setEmail}
            onPasswordChange={auth.setPassword}
            onSubmit={auth.submit}
            onGuestStart={() => auth.changeGuestMode(true)}
          />
        )}
      </section>
    </main>
  );
}
