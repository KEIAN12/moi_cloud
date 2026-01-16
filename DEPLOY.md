# デプロイガイド

## 前提条件

- GitHubアカウント
- Vercelアカウント（無料プランで可）
- Supabaseアカウント（無料プランで可）
- Google AI Studioアカウント（Gemini APIキー取得用）

## ステップ1: Supabaseプロジェクトのセットアップ

1. [Supabase](https://supabase.com) にログイン
2. 「New Project」をクリック
3. プロジェクト名を入力（例: `moi-cloud`）
4. データベースパスワードを設定
5. リージョンを選択（推奨: `Northeast Asia (Tokyo)`）
6. プロジェクトを作成

### データベーススキーマの適用

1. Supabaseダッシュボードで「SQL Editor」を開く
2. `docs/supabase-schema.sql` の内容をコピー
3. SQL Editorに貼り付けて実行
4. 成功メッセージを確認

### Supabase認証情報の取得

1. プロジェクト設定 → API
2. 以下の値をコピー：
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## ステップ2: Gemini APIキーの取得

1. [Google AI Studio](https://aistudio.google.com/) にアクセス
2. 「Get API Key」をクリック
3. 新しいAPIキーを作成
4. キーをコピー（後で使用）

## ステップ3: GitHubリポジトリの準備

1. このプロジェクトをGitHubにプッシュ
2. リポジトリのURLをメモ

## ステップ4: Vercelへのデプロイ

1. [Vercel](https://vercel.com) にログイン
2. 「Add New...」→「Project」をクリック
3. GitHubリポジトリを選択
4. プロジェクト設定：
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`（デフォルト）
   - **Build Command**: `npm run build`（デフォルト）
   - **Output Directory**: `.next`（デフォルト）

### 環境変数の設定

「Environment Variables」セクションで以下を追加：

| 変数名 | 値 | 説明 |
|--------|-----|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | SupabaseプロジェクトURL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJxxx...` | Supabase匿名キー |
| `GEMINI_API_KEY` | `AIza...` | Gemini APIキー |
| `CRON_SECRET` | ランダムな文字列 | Cron認証用（例: `openssl rand -hex 32`） |

### デプロイの実行

1. 「Deploy」をクリック
2. ビルドが完了するまで待機（約2-3分）
3. デプロイURLを確認（例: `https://moi-cloud.vercel.app`）

## ステップ5: 初期設定

### 初期テンプレートの作成

デプロイ後、以下のいずれかの方法で初期テンプレートを作成：

**方法1: ブラウザから**
```
https://your-app.vercel.app/api/templates/init
```
にアクセス（GETリクエストでも動作する場合は、POSTリクエストを送信）

**方法2: curlコマンド**
```bash
curl -X POST https://your-app.vercel.app/api/templates/init
```

### Vercel Cron Jobsの確認

1. Vercelダッシュボード → プロジェクト → Settings → Cron Jobs
2. `weekly-generate` が登録されていることを確認
3. スケジュール: `0 18 * * 0` (毎週日曜18:00 UTC)

**注意**: Vercelの無料プランではCron Jobsが制限される場合があります。
手動で週次生成を実行する場合は、ダッシュボードの「週を生成」ボタンを使用してください。

## ステップ6: 動作確認

1. **ログインページ**
   - デプロイURLにアクセス
   - パスコードでログインできることを確認

2. **タスク生成**
   - ダッシュボードで「週を生成」ボタンをクリック
   - タスクが生成されることを確認

3. **翻訳機能**
   - タスクを作成して、フランス語翻訳が生成されることを確認

4. **マキシム画面**
   - マキシムでログイン
   - 自分担当の作業のみ表示されることを確認

## トラブルシューティング

### ビルドエラー

- `npm run build` をローカルで実行してエラーを確認
- TypeScriptエラーを修正

### 環境変数エラー

- Vercelの環境変数が正しく設定されているか確認
- 再デプロイを実行

### データベース接続エラー

- SupabaseのURLとキーが正しいか確認
- Supabaseプロジェクトがアクティブか確認

### Cron Jobsが動作しない

- Vercelのプランを確認（Proプランが必要な場合あり）
- 手動で `/api/cron/weekly-generate` にアクセスしてテスト

## 次のステップ

デプロイが完了したら：

1. 実際のユーザー（かおり・まいちゃん・マキシム）にURLを共有
2. パスコードを安全に共有
3. 初期テンプレートを実際の運用に合わせて調整
4. 用語集を実際の用語で更新
