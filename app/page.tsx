"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type Mode = "signup" | "login";
type Notice = { kind: "success" | "error"; text: string };

export default function Home() {
  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [busy, setBusy] = useState(false);
  const pendingFlow = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      if (mounted) setUser(data.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    const channel = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel("todo-auth");
    if (channel) {
      channel.onmessage = (event: MessageEvent<{ type?: string; flow?: string }>) => {
        if (event.data?.type === "email-verified" && event.data.flow === pendingFlow.current) {
          pendingFlow.current = null;
          setMode("login");
          setNotice({ kind: "success", text: "승인 완료! 이제 로그인할 수 있어요." });
        }
      };
    }

    return () => {
      mounted = false;
      subscription.unsubscribe();
      channel?.close();
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
          setNotice({ kind: "error", text: error.message });
        } else if (data.session && data.user) {
          setUser(data.user);
          setNotice({ kind: "success", text: "회원가입과 로그인이 완료됐어요." });
        } else {
          setNotice({ kind: "success", text: "인증 메일을 보냈어요. 같은 브라우저에서 링크를 열면 이 화면도 승인 완료로 바뀝니다." });
        }
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      if (error) {
        setNotice({ kind: "error", text: error.message });
      } else {
        setUser(data.user);
        setNotice({ kind: "success", text: "로그인됐어요." });
      }
    } catch {
      setNotice({ kind: "error", text: "Supabase 설정을 확인해 주세요. .env.local과 개발 서버를 확인하면 돼요." });
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    const { error } = await createClient().auth.signOut();
    setBusy(false);
    if (error) {
      setNotice({ kind: "error", text: error.message });
      return;
    }
    setUser(null);
    setPassword("");
    setNotice({ kind: "success", text: "로그아웃했어요." });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f6f2] p-5 text-[#18231e]">
      <section className="w-full max-w-md rounded-3xl bg-white p-7 shadow-[0_24px_80px_rgba(29,50,39,0.12)] sm:p-10">
        <div className="mb-8 flex size-11 items-center justify-center rounded-xl bg-[#244b38] text-xl font-semibold text-white" aria-hidden="true">✓</div>
        {user ? (
          <>
            <p className="text-xs font-bold tracking-[0.18em] text-emerald-700">SIGNED IN</p>
            <h1 className="mt-3 text-3xl font-semibold">로그인됐어요.</h1>
            <p className="mt-3 break-all text-sm text-gray-600">{user.email}</p>
            <p className="mt-7 rounded-xl bg-[#f4f6f2] p-4 text-sm leading-6 text-gray-600">계정 연결이 완료됐어요. Todo 목록 기능은 다음 단계에서 추가할 수 있어요.</p>
            <button type="button" onClick={signOut} disabled={busy} className="mt-6 h-12 w-full rounded-xl border border-gray-200 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60">{busy ? "처리 중..." : "로그아웃"}</button>
          </>
        ) : (
          <>
            <p className="text-xs font-bold tracking-[0.18em] text-emerald-700">{mode === "signup" ? "START YOUR SPACE" : "WELCOME BACK"}</p>
            <h1 className="mt-3 text-3xl font-semibold">{mode === "signup" ? "계정 만들기" : "다시 만나 반가워요"}</h1>
            <p className="mt-3 text-sm leading-6 text-gray-600">{mode === "signup" ? "이메일로 가입하고 할 일 공간을 시작해 보세요." : "가입한 이메일과 비밀번호로 로그인하세요."}</p>

            <div className="mt-7 grid grid-cols-2 rounded-xl bg-gray-100 p-1">
              <button type="button" onClick={() => { setMode("signup"); setNotice(null); }} className={"h-10 rounded-lg text-sm font-semibold " + (mode === "signup" ? "bg-white text-[#244b38] shadow-sm" : "text-gray-500")}>회원가입</button>
              <button type="button" onClick={() => { setMode("login"); setNotice(null); }} className={"h-10 rounded-lg text-sm font-semibold " + (mode === "login" ? "bg-white text-[#244b38] shadow-sm" : "text-gray-500")}>로그인</button>
            </div>

            <form onSubmit={submit} className="mt-6 space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold">이메일</label>
                <input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="h-12 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10" />
              </div>
              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-semibold">비밀번호</label>
                <input id="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="8자 이상 입력해 주세요" className="h-12 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10" />
              </div>
              {notice && <p role="status" aria-live="polite" className={"rounded-xl p-3 text-sm leading-6 " + (notice.kind === "success" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800")}>{notice.text}</p>}
              <button type="submit" disabled={busy} className="h-12 w-full rounded-xl bg-[#244b38] px-5 text-sm font-semibold text-white transition hover:bg-[#193d2c] disabled:cursor-not-allowed disabled:opacity-60">{busy ? "잠시만 기다려 주세요..." : mode === "signup" ? "회원가입하고 메일 받기" : "로그인"}</button>
            </form>
            <p className="mt-6 text-center text-xs leading-5 text-gray-500">가입하면 이메일 확인 후 계정을 사용할 수 있어요.</p>
          </>
        )}
      </section>
    </main>
  );
}
