"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-5">
      <section className="w-full max-w-md rounded-3xl bg-white p-10 text-center shadow-xl">
        <h1 className="text-2xl font-semibold">ページを表示できませんでした</h1>
        <p className="mt-3 text-sm text-gray-600">しばらく待ってから、もう一度お試しください。</p>
        <button onClick={reset} className="mt-7 rounded-xl bg-[#244b38] px-5 py-3 text-sm font-semibold text-white">もう一度試す</button>
      </section>
    </main>
  );
}
