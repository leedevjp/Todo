export function authErrorMessage(error: { code?: string } | null) {
  switch (error?.code) {
    case "invalid_credentials": return "メールアドレスまたはパスワードが正しくありません。";
    case "email_not_confirmed": return "メール認証が完了していません。確認メールのリンクを開いてください。";
    case "user_already_exists":
    case "email_exists": return "このメールアドレスは登録済みです。ログインしてください。";
    case "weak_password": return "より安全なパスワードを設定してください。";
    case "email_address_invalid":
    case "validation_failed": return "入力内容を確認してください。";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit": return "リクエストが多すぎます。しばらく待ってから再度お試しください。";
    case "signup_disabled": return "現在、新規登録を受け付けていません。";
    case "session_not_found":
    case "refresh_token_not_found": return "セッションの有効期限が切れました。もう一度ログインしてください。";
    default: return "認証処理に失敗しました。入力内容と接続を確認し、もう一度お試しください。";
  }
}
