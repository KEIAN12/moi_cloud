# 簡単デプロイ手順（3人に配布用）

## 🚀 5分で本番環境を立ち上げる

### ステップ1: Vercelアカウント作成（2分）

1. [https://vercel.com/signup](https://vercel.com/signup) にアクセス
2. **「Continue with GitHub」**をクリック（GitHubアカウントでログイン）
3. 必要に応じてGitHubの認証を許可

**注意**: Vercelは完全無料で使えます。クレジットカード不要です。

---

### ステップ2: プロジェクトをデプロイ（3分）

1. Vercelダッシュボードで **「Add New...」→「Project」** をクリック
2. GitHubリポジトリ `KEIAN12/moi_cloud` を選択
3. プロジェクト設定はそのまま（Next.jsが自動検出されます）
4. **「Environment Variables」** セクションで以下を追加：

| 変数名 | 値 | どこで取得？ |
|--------|-----|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Supabaseプロジェクト設定 → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJxxx...` | Supabaseプロジェクト設定 → API |
| `GEMINI_API_KEY` | `AIza...` | [Google AI Studio](https://aistudio.google.com/) |

5. **「Deploy」** をクリック
6. 2-3分待つとデプロイ完了！

---

### ステップ3: デプロイURLを確認

デプロイが完了すると、以下のようなURLが発行されます：
```
https://moi-cloud-xxxxx.vercel.app
```

このURLを3人（かおり・まいちゃん・マキシム）に共有してください。

---

## 📋 事前準備が必要なもの

### 1. Supabaseプロジェクト（まだの場合）

1. [https://supabase.com](https://supabase.com) にアクセス
2. 「New Project」でプロジェクト作成
3. プロジェクト設定 → API で以下をコピー：
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. SQL Editorで `docs/supabase-schema-safe.sql` を実行

### 2. Gemini APIキー（まだの場合）

1. [https://aistudio.google.com/](https://aistudio.google.com/) にアクセス
2. 「Get API Key」をクリック
3. 新しいAPIキーを作成してコピー

---

## ✅ デプロイ後の確認

1. **ログインページ**
   - デプロイURLにアクセス
   - パスコード（`1234`）でログインできるか確認

2. **初期テンプレート作成**
   - ブラウザで以下にアクセス：
   ```
   https://your-app.vercel.app/api/templates/init
   ```
   - または、ダッシュボードの「週を生成」ボタンをクリック

3. **動作確認**
   - タスクが表示されるか確認
   - 翻訳機能が動作するか確認

---

## 🔗 3人への配布方法

以下の情報を3人に共有してください：

```
【moi Cloud タスク管理システム】

URL: https://your-app.vercel.app
パスコード: 1234

使い方:
1. 上記URLにアクセス
2. パスコードを入力してログイン
3. ユーザー選択画面で自分の名前を選択
   - かおり → 「Kaori」
   - まいちゃん → 「Mai-chan」
   - マキシム → 「Maxime」

※ スマホでも使えます
```

---

## ⚠️ トラブルシューティング

### デプロイが失敗する場合

1. **環境変数が正しく設定されているか確認**
   - Vercelダッシュボード → Settings → Environment Variables

2. **ビルドログを確認**
   - Vercelダッシュボード → Deployments → 最新のデプロイ → Build Logs

3. **Supabaseの接続を確認**
   - Supabaseプロジェクトがアクティブか確認
   - SQL Editorでテーブルが作成されているか確認

### アプリが動作しない場合

1. **ブラウザのコンソールを確認**
   - F12キーで開発者ツールを開く
   - Consoleタブでエラーを確認

2. **ネットワークタブを確認**
   - 開発者ツール → Networkタブ
   - エラーが出ているAPIを確認

---

## 📞 サポート

問題が発生した場合は、以下を確認してください：
- Vercelダッシュボードのデプロイログ
- Supabaseダッシュボードのログ
- ブラウザのコンソールエラー
