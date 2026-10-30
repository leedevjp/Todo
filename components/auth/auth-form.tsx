import type { FormEvent } from "react";
import type { AuthMode, AuthNotice } from "@/hooks/use-auth";

type AuthFormProps = {
  mode: AuthMode;
  email: string;
  password: string;
  notice: AuthNotice | null;
  busy: boolean;
  onModeChange: (mode: AuthMode) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onGuestStart: () => void;
};

export function AuthForm({
  mode, email, password, notice, busy,
  onModeChange, onEmailChange, onPasswordChange, onSubmit, onGuestStart,
}: AuthFormProps) {
  return (
    <>
      <p className="text-xs font-bold tracking-[0.18em] text-emerald-700">タスク管理</p>
      <h1 className="mt-3 text-3xl font-semibold">{mode === "signup" ? "アカウントを作成" : "おかえりなさい"}</h1>
      <p className="mt-3 text-sm leading-6 text-gray-600">{mode === "signup" ? "メールアドレスで登録して、タスク管理を始めましょう。" : "登録したメールアドレスとパスワードでログインしてください。"}</p>

      <div className="mt-7 grid grid-cols-2 rounded-xl bg-gray-100 p-1">
        <button type="button" onClick={() => onModeChange("signup")} className={"h-10 rounded-lg text-sm font-semibold " + (mode === "signup" ? "bg-white text-[#244b38] shadow-sm" : "text-gray-500")}>新規登録</button>
        <button type="button" onClick={() => onModeChange("login")} className={"h-10 rounded-lg text-sm font-semibold " + (mode === "login" ? "bg-white text-[#244b38] shadow-sm" : "text-gray-500")}>ログイン</button>
      </div>

      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-5">
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-semibold">メールアドレス</label>
          <input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => onEmailChange(event.target.value)} placeholder="you@example.com" className="h-12 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10" />
        </div>
        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-semibold">パスワード</label>
          <input id="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={8} required value={password} onChange={(event) => onPasswordChange(event.target.value)} placeholder="8文字以上で入力してください" className="h-12 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10" />
        </div>
        {notice && <p role="status" aria-live="polite" className={"rounded-xl p-3 text-sm leading-6 " + (notice.kind === "success" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800")}>{notice.text}</p>}
        <button type="submit" disabled={busy} className="h-12 w-full rounded-xl bg-[#244b38] px-5 text-sm font-semibold text-white transition hover:bg-[#193d2c] disabled:cursor-not-allowed disabled:opacity-60">{busy ? "処理中..." : mode === "signup" ? "登録して確認メールを受け取る" : "ログイン"}</button>
      </form>
      <div className="mt-6 border-t border-gray-100 pt-6">
        <button type="button" disabled={busy} onClick={onGuestStart} className="h-12 w-full rounded-xl border border-[#244b38] px-4 text-sm font-semibold text-[#244b38] hover:bg-emerald-50 disabled:opacity-50">登録せずにゲストで始める</button>
        <p className="mt-2 text-center text-xs leading-5 text-gray-500">ゲストのタスクはこのブラウザーにのみ保存されます。</p>
      </div>
      <p className="mt-6 text-center text-xs leading-5 text-gray-500">登録後、メール認証を完了するとアカウントを利用できます。</p>
    </>
  );
}
