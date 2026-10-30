"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isGuestMode, setGuestMode } from "@/lib/todos/guest-storage";
import { authErrorMessage } from "@/lib/supabase/auth-message";

export type AuthMode = "signup" | "login";
export type AuthNotice = { kind: "success" | "error"; text: string };

export function useAuth() {
  const [mode, setMode] = useState<AuthMode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [notice, setNotice] = useState<AuthNotice | null>(null);
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

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setNotice(null);
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


  return {
    user, guest, initializing, mode, email, password, notice, busy,
    setEmail, setPassword, changeMode, submit, signOut, changeGuestMode,
  };
}
