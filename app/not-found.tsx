import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center p-5">
      <section className="w-full max-w-md rounded-3xl bg-white p-10 text-center shadow-xl">
        <h1 className="text-2xl font-semibold">ページが見つかりません</h1>
        <p className="mt-3 text-sm text-gray-600">URLを確認するか、トップページに戻ってください。</p>
        <Link href="/" className="mt-7 inline-flex rounded-xl bg-[#244b38] px-5 py-3 text-sm font-semibold text-white">Todoに戻る</Link>
      </section>
    </main>
  );
}
