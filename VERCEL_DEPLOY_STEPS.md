# Vercelデプロイ手順（3人に配布用）

## 🎯 目標
Vercelの無料アカウントで本番環境を立ち上げ、3人（かおり・まいちゃん・マキシム）にURLを配布する

---

## 📝 ステップ1: Vercelアカウント作成（2分）

1. **Vercelにアクセス**
   - [https://vercel.com/signup](https://vercel.com/signup) を開く

2. **GitHubでログイン**
   - 「Continue with GitHub」をクリック
   - GitHubの認証を許可

3. **完了**
   - アカウント作成完了（無料、クレジットカード不要）

---

## 🚀 ステップ2: プロジェクトをデプロイ（5分）

### 2-1. プロジェクトをインポート

1. Vercelダッシュボードで **「Add New...」→「Project」** をクリック
2. **「Import Git Repository」** をクリック
3. GitHubリポジトリ `KEIAN12/moi_cloud` を選択
   - もし表示されない場合は「Configure GitHub App」で権限を許可

### 2-2. プロジェクト設定

1. **Project Name**: `moi-cloud`（そのまま）
2. **Framework Preset**: `Next.js`（自動検出）
3. **Root Directory**: `./`（そのまま）
4. **Build Command**: `npm run build`（そのまま）
5. **Output Directory**: `.next`（そのまま）

### 2-3. 環境変数を設定

**「Environment Variables」** セクションで以下を追加：

| 変数名 | 値の例 | 取得方法 |
|--------|--------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Supabase → プロジェクト設定 → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Supabase → プロジェクト設定 → API → anon public key |
| `GEMINI_API_KEY` | `AIzaSy...` | [Google AI Studio](https://aistudio.google.com/) → Get API Key |

**追加方法**:
1. 「Add」ボタンをクリック
2. 変数名と値を入力
3. 「Save」をクリック
4. 3つすべて追加するまで繰り返し

### 2-4. デプロイ実行

1. すべての環境変数を追加したら、**「Deploy」** をクリック
2. ビルドが開始されます（2-3分かかります）
3. 完了すると **「Success」** と表示されます

---

## ✅ ステップ3: デプロイURLを確認

デプロイが完了すると、以下のようなURLが表示されます：

```
https://moi-cloud-xxxxx.vercel.app
```

または、カスタムドメインを設定している場合：

```
https://moi-cloud.vercel.app
```

**このURLをメモしてください！**

---

## 🎁 ステップ4: 初期設定

### 4-1. 初期テンプレートを作成

デプロイ後、ブラウザで以下にアクセス：

```
https://your-app.vercel.app/api/templates/init
```

または、ダッシュボードにログインして「週を生成」ボタンをクリック

### 4-2. 動作確認

1. **ログインページ**
   - デプロイURLにアクセス
   - パスコード `1234` でログインできるか確認

2. **ユーザー選択**
   - かおり・まいちゃん・マキシムの選択肢が表示されるか確認

3. **タスク表示**
   - ダッシュボードでタスクが表示されるか確認

---

## 📤 ステップ5: 3人にURLを配布

以下のテンプレートをコピーして、3人に送ってください：

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【moi Cloud タスク管理システム】

本番環境が準備できました！

📱 アクセスURL:
https://your-app.vercel.app

🔐 ログインパスコード:
1234

👥 使い方:
1. 上記URLにアクセス
2. パスコード「1234」を入力
3. ユーザー選択画面で自分の名前を選択
   - かおり → 「Kaori」
   - まいちゃん → 「Mai-chan」
   - マキシム → 「Maxime」

📱 スマホでも使えます
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🔧 事前準備（まだの場合）

### Supabaseプロジェクトの作成

1. [https://supabase.com](https://supabase.com) にアクセス
2. 「New Project」をクリック
3. プロジェクト名: `moi-cloud`
4. データベースパスワード: 任意（メモしておく）
5. リージョン: `Northeast Asia (Tokyo)`
6. 「Create new project」をクリック

**スキーマの適用**:
1. Supabaseダッシュボード → SQL Editor
2. `docs/supabase-schema-safe.sql` の内容をコピー
3. SQL Editorに貼り付けて実行
4. 成功メッセージを確認

**認証情報の取得**:
1. プロジェクト設定 → API
2. `Project URL` をコピー → `NEXT_PUBLIC_SUPABASE_URL`
3. `anon public` key をコピー → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Gemini APIキーの取得

1. [https://aistudio.google.com/](https://aistudio.google.com/) にアクセス
2. 「Get API Key」をクリック
3. 新しいAPIキーを作成
4. キーをコピー → `GEMINI_API_KEY`

---

## ⚠️ トラブルシューティング

### デプロイが失敗する

1. **環境変数を確認**
   - Vercelダッシュボード → Settings → Environment Variables
   - 3つすべて設定されているか確認

2. **ビルドログを確認**
   - Deployments → 最新のデプロイ → Build Logs
   - エラーメッセージを確認

3. **Supabaseの接続を確認**
   - Supabaseプロジェクトがアクティブか確認
   - SQL Editorでテーブルが作成されているか確認

### アプリが動作しない

1. **ブラウザのコンソールを確認**
   - F12キーで開発者ツール
   - Consoleタブでエラーを確認

2. **ネットワークタブを確認**
   - 開発者ツール → Networkタブ
   - エラーが出ているAPIを確認

### GitHubリポジトリが見つからない

1. **GitHubにプッシュされているか確認**
   ```bash
   git push origin main
   ```

2. **VercelでGitHubアプリの権限を確認**
   - Vercelダッシュボード → Settings → Git
   - GitHubアプリの権限を確認

---

## 📞 サポート

問題が発生した場合：
1. Vercelダッシュボードのデプロイログを確認
2. Supabaseダッシュボードのログを確認
3. ブラウザのコンソールエラーを確認

---

## 🎉 完了！

デプロイが完了したら、3人にURLを配布して使い始めましょう！
