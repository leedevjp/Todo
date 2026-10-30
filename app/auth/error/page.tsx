import Link from "next/link";
export default function AuthErrorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f6f2] p-5">
      <section className="w-full max-w-md rounded-3xl bg-white p-10 text-center shadow-xl">
        <h1 className="text-2xl font-semibold">認証リンクを処理できませんでした</h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">リンクの有効期限が切れているか、すでに使用されている可能性があります。登録画面から再度お試しください。</p>
        <Link href="/" className="mt-7 inline-flex h-11 items-center rounded-xl bg-[#244b38] px-5 text-sm font-semibold text-white">もう一度試す</Link>
      </section>
    </main>
  );
}
