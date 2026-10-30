"use client";

import Link from "next/link";
import { useEffect } from "react";

export function VerifiedNotice({ flow }: { flow: string }) {
  useEffect(() => {
    if (!flow || typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel("todo-auth");
    channel.postMessage({ type: "email-verified", flow });
    channel.close();
  }, [flow]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f6f2] p-5 text-[#18231e]">
      <section className="w-full max-w-md rounded-3xl bg-white p-10 text-center shadow-xl">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700" aria-hidden="true">✓</div>
        <h1 className="text-2xl font-semibold">メール認証が完了しました</h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">メールアドレスを確認しました。同じブラウザーで開いている登録画面にも認証完了が表示されます。</p>
        <Link href="/" className="mt-7 inline-flex h-11 items-center rounded-xl bg-[#244b38] px-5 text-sm font-semibold text-white">Todoに戻る</Link>
      </section>
    </main>
  );
}
