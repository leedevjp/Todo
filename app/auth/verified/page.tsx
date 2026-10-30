import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { VerifiedNotice } from "./verified-notice";
export const instant = false;

export default async function VerifiedPage({
  searchParams,
}: {
  searchParams: Promise<{ flow?: string }>;
}) {
  const { flow = "" } = await searchParams;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f6f2] p-5">
        <section className="w-full max-w-md rounded-3xl bg-white p-10 text-center shadow-xl">
          <h1 className="text-2xl font-semibold">인증 상태를 확인할 수 없어요</h1>
          <p className="mt-3 text-sm leading-6 text-gray-600">링크가 만료됐거나 이미 사용됐을 수 있어요. 회원가입 화면에서 다시 시도해 주세요.</p>
          <Link href="/" className="mt-7 inline-flex h-11 items-center rounded-xl bg-[#244b38] px-5 text-sm font-semibold text-white">회원가입으로</Link>
        </section>
      </main>
    );
  }

  return <VerifiedNotice flow={flow} />;
}
