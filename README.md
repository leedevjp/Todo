# Todoアプリ

Next.js と Supabase Auth を使った、メールアドレス認証付き Todo アプリの学習・実践プロジェクトです。メールアドレスとパスワードでの新規登録、メール確認、ログインを実装しています。

## プロジェクトの構成

- **Next.js App Router**: 画面と認証コールバックを実装
- **Supabase Auth**: ユーザー登録、メール確認、ログインを管理
- **`@supabase/ssr`**: Next.js のブラウザー／サーバー環境に応じた Supabase クライアントを作成し、認証セッションを Cookie で共有
- **`@supabase/supabase-js`**: Supabase JavaScript クライアントの基盤
- **pnpm**: パッケージ管理

### 現在の実装範囲

Supabase のメール認証、Prisma によるログインユーザーごとの Todo CRUD、localStorage によるゲストモードを実装しています。画面・認証案内・API エラーは日本語で表示します。Supabase Auth が管理するユーザー情報と、アプリ独自の Todo データは別のものとして扱います。

登録画面の「登録せずにゲストで始める」から、アカウントなしでタスクを追加・編集・完了・削除できます。ゲストのタスクとモードはこのブラウザーの localStorage に保存され、再読み込み後も復元されます。ログイン画面に戻ってもタスクは残り、アカウントのタスクへ自動で移行・同期されません。ブラウザーのサイトデータを削除するとゲストのタスクも削除されます。

## 開発環境

- Node.js 20.9 以上
- pnpm 11.15.1
- Supabase プロジェクト

## 新規プロジェクトの作成手順

Windows のコマンドプロンプトまたは PowerShell で、作成先の親フォルダーへ移動して Next.js プロジェクトを作成します。

```powershell
cd C:\Public
pnpm create next-app@latest Todo
```

セットアップ時は TypeScript、ESLint、Tailwind CSS、App Router を選択します。作成後、プロジェクトのフォルダーへ移動して Supabase パッケージを追加します。

```powershell
cd Todo
pnpm add @supabase/ssr @supabase/supabase-js
```

このリポジトリをすでに取得している場合は、`create-next-app` による作成は不要です。次の手順で依存関係をインストールしてください。

```powershell
pnpm install
```

## Supabase プロジェクトの準備

1. Supabase にアカウント登録してログインします。
2. Supabase Dashboard でプロジェクトを作成します。
3. プロジェクトの URL を確認します。
4. **Project Settings → API Keys** で Publishable key を確認します。キーがまだ発行されていない場合は作成します。
5. Authentication のメール確認を有効にし、ローカル開発時の Site URL と許可する Redirect URL に `http://localhost:3000` を設定します。

## 環境変数

プロジェクトのルートに `.env.local` を作成します。Supabase Dashboard の Project URL と Publishable key を設定してください。

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
DATABASE_URL=postgresql://<database-user>:<encoded-password>@<pooler-host>:6543/postgres?sslmode=verify-full&sslrootcert=certs/supabase-ca.crt
DIRECT_URL=postgresql://<database-user>:<encoded-password>@<pooler-host>:5432/postgres?sslmode=verify-full&sslrootcert=certs/supabase-ca.crt
```

`NEXT_PUBLIC_` が付いた値はブラウザー側のコードから参照できる公開設定です。Publishable key はクライアント利用を想定したキーです。Secret key や `service_role` key はブラウザーに公開せず、`NEXT_PUBLIC_` 環境変数にも設定しないでください。データベースを利用する際は、テーブルの Row Level Security (RLS) と適切なポリシーでアクセスを制御します。

`.env.local` は Git の追跡対象外です。共有用の変数名だけを記載した `.env.example` を参照してください。環境変数を変更した場合は、開発サーバーを再起動してください。

## ローカルでの起動

Todo 用の `DATABASE_URL` は Supabase の **Connect → Transaction pooler**（ポート 6543）から取得します。マイグレーション用の `DIRECT_URL` は **Session pooler**（ポート 5432）から取得します。DB パスワードの特殊文字は URL エンコードしてください。これらはサーバー専用であり、`NEXT_PUBLIC_` を付けません。初回起動前に次のコマンドで Todo テーブルを作成します。

```powershell
pnpm db:migrate
```

アプリは `DATABASE_URL`、Prisma CLI のマイグレーションは `DIRECT_URL` を使用します。ローカル環境でも Vercel でも同じ役割で設定します。

Todo の操作はブラウザーから Next.js の `/api/todos` に送信します。サーバーで Supabase Auth のユーザーを検証し、そのユーザー ID を条件に Prisma から PostgreSQL を操作します。ブラウザーから渡されたユーザー ID は使用しません。Todo テーブルは RLS を有効にし、`anon` / `authenticated` ロールによる Data API 経由の直接アクセスを許可していません。Prisma の接続にはテーブル操作権限を持つサーバー専用の DB ロールが必要です。

```powershell
pnpm dev
```

ブラウザーで [http://localhost:3000](http://localhost:3000) を開きます。

## Supabase クライアントの使い分け

クライアント生成関数は `lib/supabase/` にまとめています。

- `lib/supabase/client.ts` は `@supabase/ssr` の `createBrowserClient()` を使います。Client Component での新規登録、ログイン、ログイン状態の表示など、ブラウザーで実行する処理に使用します。
- `lib/supabase/server.ts` は `createServerClient()` と Next.js の `cookies()` を接続します。Route Handler や Server Component など、サーバーで実行する認証処理に使用します。
- `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` は両方のクライアント生成に渡します。`@supabase/ssr` が Cookie の読み書きを仲介し、ブラウザーとサーバーで認証セッションを扱えるようにします。

`@supabase/ssr` は Supabase API の代わりではありません。Auth やデータベース API を呼び出すクライアント機能は `@supabase/supabase-js` が提供し、`@supabase/ssr` は Next.js のサーバー・ブラウザー間で Cookie ベースのセッションを扱うための仕組みを提供します。

## メール認証の流れ

1. `app/page.tsx` からブラウザー用クライアントで `signUp()` を呼び出します。
2. Supabase Auth がユーザー登録を処理し、確認メールを送信します。
3. メール内のリンクは Next.js の `/auth/callback` Route Handler に戻ります。
4. `app/auth/callback/route.ts` がサーバー用クライアントで認証コードを `exchangeCodeForSession()` によりセッションへ交換します。
5. サーバー用クライアントが Cookie を設定し、認証完了画面 `/auth/verified` へリダイレクトします。
6. 完了画面がユーザーを確認し、`BroadcastChannel` で同じブラウザーにある元の登録画面へ認証完了を通知します。

メール確認に失敗した場合やリンクが無効な場合は `/auth/error` を表示します。

## 主なコマンド

```powershell
pnpm dev      # 開発サーバー
pnpm lint     # ESLint
pnpm test     # ゲスト保存・データ分離・エラー処理のテスト
pnpm build    # 本番用ビルド
pnpm start    # 本番ビルドの起動
```

## 参考資料

- [Supabase: Next.js で Supabase を使用する](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Supabase: SSR クライアントの作成](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Supabase: API Keys](https://supabase.com/docs/guides/getting-started/api-keys)
- [Next.js: インストールと create-next-app](https://nextjs.org/docs/app/getting-started/installation)
