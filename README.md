# Todoアプリ

## 1. 公開URL・主な機能

**公開URL： [https://todo-lee.vercel.app/](https://todo-lee.vercel.app/)**

1. メール認証による新規登録、ログイン・ログアウト
2. Todoの追加・一覧表示・編集・削除、完了状態の変更
3. 登録不要のゲストモードと、localStorageによるデータの保存・復元

## 2. ディレクトリ構成

```text
Todo/
│
├─ app/                              ページ・サーバーAPIのエントリーポイント
│  ├─ page.tsx                       メイン画面の切り替え・レイアウト
│  ├─ layout.tsx                     共通HTML・言語・フォント・メタデータ
│  ├─ globals.css                    共通スタイル
│  ├─ error.tsx                      ページのエラー画面
│  ├─ not-found.tsx                  404画面
│  │
│  ├─ api/todos/                     Next.jsサーバーで実行
│  │  ├─ route.ts                    GET：一覧取得 / POST：追加
│  │  └─ [id]/route.ts               PATCH：編集・完了状態変更 / DELETE：削除
│  │
│  └─ auth/                          メール認証の処理
│     ├─ callback/route.ts           認証コードをセッションに交換・Cookie設定
│     ├─ verified/
│     │  ├─ page.tsx                 サーバー側で認証ユーザーを確認
│     │  └─ verified-notice.tsx      完了画面・元のタブへの認証完了通知
│     └─ error/page.tsx              メール認証の失敗画面
│
├─ components/                       画面コンポーネント
│  ├─ auth/
│  │  └─ auth-form.tsx               新規登録・ログインの入力画面
│  └─ todos/
│     └─ todo-list.tsx               Todo一覧・入力・編集・フィルターと表示状態
│
├─ hooks/                            画面で使用する認証状態・操作
│  └─ use-auth.ts                    認証の初期化・状態監視・新規登録・ログイン
│                                    ログアウト・ゲストモードの切り替え
│
└─ lib/                              接続・保存・検証処理
   ├─ supabase/
   │  ├─ client.ts                   ブラウザー用Supabaseクライアント
   │  ├─ server.ts                   サーバー用Supabaseクライアント・Cookie連携
   │  └─ auth-message.ts             認証エラーを日本語の案内に変換
   └─ todos/
      ├─ http-client.ts              ブラウザーから/api/todosを呼び出す処理
      ├─ guest-storage.ts            ゲストTodo・モードのlocalStorage保存
      ├─ server-utils.ts             サーバー側の認証・入力検証・エラー応答
      └─ types.ts                    Todoの共通型・タイトルの文字数制限
```

## 3. 作業内容

1. Supabaseのアカウントとプロジェクトを作成しました。
2. Next.jsプロジェクトを作成し、TypeScript、Tailwind CSS、ESLint、pnpmによる開発環境を構築しました。
3. Supabaseのクライアントパッケージを導入し、接続に必要な環境変数を設定しました。
4. ブラウザー用・サーバー用のSupabaseクライアントを構成し、メール認証とアカウント機能を実装しました。
5. PrismaとPostgreSQLドライバーを導入し、Todoモデルとマイグレーションを作成しました。
6. Next.jsのAPIとPrismaを使用し、ユーザーごとのTodo CRUDを実装しました。
7. localStorageを使用したゲストモードを追加し、アカウントのデータと分離しました。
8. GitHubでソースコードを管理し、Vercelにビルド設定と環境変数を登録してデプロイしました。

## 4. 注意点

### データアクセスとユーザー権限

- アカウントのTodoは、次の経路で処理します。

  ```text
  ブラウザー → Next.js API → Prisma → PostgreSQL
  ```

- サーバー側でSupabase Authによるユーザー確認を行い、すべてのTodo操作に対象ユーザーの`userId`を条件として適用します。
- TodoテーブルではRLSを有効化し、`anon`・`authenticated`ロールのテーブルアクセス権限を削除しています。
- 現在、PrismaはRLSをバイパスできる`postgres` DBアカウントで接続しています。**ユーザーごとのアクセス制限はサーバーコードが担うため、取得・更新・削除処理では所有者を確認する条件が必要です。**

### DB接続と環境変数

- アプリのDB接続にはTransaction pooler、マイグレーションにはSession poolerを使用します。
- DB接続時は、公開CA証明書を使用してサーバー証明書を検証します。
- 公開キーとDBパスワードを区別し、DB接続情報はサーバー専用の環境変数として管理します。
- `.env.local`はGitの管理対象に含めません。Vercelの環境変数を変更した場合は再デプロイが必要です。

### ゲストデータとメール認証

- ゲストデータは利用中のブラウザーに保存され、サイトデータを削除すると失われます。
- メール認証の完了を元の登録画面に通知する機能は、同じブラウザー内で動作します。
- 公開URLを変更した場合は、SupabaseのSite URLと許可するリダイレクトURLも確認する必要があります。
