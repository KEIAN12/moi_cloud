# moi タスク運用システム

![Brand Color](https://img.shields.io/badge/color-%23205134?style=flat-square&label=Primary%20Color)

**Primary Color:** `#205134` (深い緑色)

---

## 📋 プロジェクト概要

moi（蒲郡）の運営を効率化するタスク管理システム。週1営業（将来的に週2営業）を基本に、3名のスタッフ（かおり・まいちゃん・マキシム）が協力して運営するためのタスク運用プラットフォームです。

### 🎯 解決する課題

1. **抜け漏れ防止** - 投稿、取り置き、仕込み、開店準備、締めなどの業務漏れを防止
2. **情報の一元化** - LINEや口頭に散らばる情報をシステムに集約
3. **段階的な委譲** - まいちゃんへの業務移譲を型化して支援
4. **言語対応** - フランス語話者のマキシムが自分担当の作業だけを見て実行可能
5. **継続的改善** - 運用ログを蓄積し、分析・改善提案・自動改善（承認制）につなげる

## 👥 ユーザーと権限

### 管理者（かおり・まいちゃん）
- 全タスク・全チェック項目・全コメントの閲覧・編集が可能
- タスク作成・編集、担当割り当て、期限変更、テンプレ編集が可能
- マキシムのタスクも閲覧・管理が可能

### 実行者（マキシム）
- 自分に割り当てられた「作業」（チェック項目）のみ表示
- 進行状況更新、チェック完了、コメント投稿が可能
- フランス語表示がデフォルト

## ✨ 主要機能

### 1. 週次テンプレート自動生成
- 毎週の定型タスクを自動生成（デフォルト：木曜営業基準）
- 営業日例外に対応した期限自動再計算
- 投稿・取り置き運用をテンプレート化

### 2. チェックリスト管理
- タスクを最小行動単位（チェック項目）まで分解
- チェック項目ごとに担当者を設定可能
- マキシムは自分担当のみを一覧表示

### 3. 多言語対応（Gemini API）
- 日本語 ↔ フランス語の双方向翻訳
- タスク、チェック項目、コメントを自動翻訳
- 用語集による翻訳品質向上

### 4. 取り置き運用管理
- 公式LINEでの取り置き受付を管理
- 簡易集計フォーム（顧客名、商品、個数、ステータス）
- 受付完了返信の管理

### 5. イベントログと分析
- 全主要操作をイベントログとして記録
- 期限超過、抜けがちな投稿、未実行チェック項目を可視化
- 改善提案の生成と承認フロー

## 🛠 技術スタック

- **フロントエンド**: Next.js (PWA対応)
- **バックエンド**: Supabase (DB + 認証相当)
- **翻訳API**: Gemini API
- **デプロイ**: 未定（Vercel推奨）

## 📊 データモデル主要エンティティ

- `users` - ユーザー（かおり、まいちゃん、マキシム）
- `devices` - 端末ログイン管理
- `weeks` - 週インスタンス
- `tasks` - タスク（日本語・フランス語の両言語対応）
- `checklist_items` - チェック項目（最小作業単位）
- `comments` - コメント（双方向翻訳）
- `templates` - 週次テンプレート
- `glossary_terms` - 用語集
- `event_logs` - イベントログ
- `recommendations` - 改善提案

## 🚀 フェーズ計画

### フェーズ1（MVP）
- 週次テンプレート自動生成
- チェックリスト管理
- 翻訳と用語集
- イベントログ収集
- 簡易ダッシュボード

### フェーズ2（改善提案）
- ログから提案を生成（ルール + Gemini）
- 提案の承認フロー
- 承認後にテンプレートへ反映

### フェーズ3（半自動最適化）
- 期限の前倒し提案
- 追加されがちなチェック項目の自動候補化
- 担当割当の提案

## 📱 画面構成

### マキシム用画面
- 自分の作業一覧（自分担当のチェック項目のみ）
- 作業詳細（フランス語表示）

### かおり・まいちゃん用画面
- 今週の全体タスク一覧
- タスク詳細（編集・チェック項目管理）
- マキシム管理ビュー
- 週次テンプレート管理
- 営業日例外編集
- ダッシュボード（分析・提案）

## 🔐 認証方式

- 共通パスコードでログイン
- 初回ログイン時に端末の利用者を選択
- 端末に `user_id` を紐づけ、以降は自動ログイン扱い
- 管理者は端末の利用者切替が可能

## 📝 初期テンプレート例（週1営業・木曜基準）

1. **投稿: 営業告知**（営業日-7日 18:00）
2. **投稿: 取り置き案内**（営業日-4日 20:00）
3. **取り置き運用と集計**（営業日-3日 10:00）
4. **製造計画**（営業日前日 21:00）
5. **仕込み**（営業日当日 09:00）
6. **焼き**（営業日当日 10:30）
7. **開店準備**（営業日当日 13:00）
8. **閉店作業**（営業日当日 17:00）

## 📄 詳細仕様

詳細な要件定義は [要件定義書](./docs/requirements.md) を参照してください。

## 🎨 ブランドカラー

- **Primary Color**: `#205134` (深い緑色)
- **RGB**: `rgb(32, 81, 52)`

---

## 🚧 実装状況

### ✅ 実装済み機能

- [x] ログイン・ユーザー選択機能
- [x] ダッシュボード（かおり・まいちゃん用）
- [x] マイタスクページ（マキシム用、フランス語表示）
- [x] タスク詳細ページ（チェックリスト編集機能、コメント機能）
- [x] APIルート（タスク、チェックリスト、週生成、コメント）
- [x] Gemini API翻訳機能（日本語↔フランス語）
- [x] イベントログ収集機能
- [x] 週次テンプレート生成機能
- [x] 用語集管理（CRUD）
- [x] 営業日例外編集機能
- [x] 通知機能（基本実装）
- [x] 分析ダッシュボード
- [x] ログ学習による改善提案生成
- [x] 提案の承認・却下機能
- [x] 承認後のテンプレート自動反映

## 🛠 セットアップ手順

### 1. 環境変数の設定

`.env.local` ファイルを作成し、以下を設定してください：

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_ACCESS_TOKEN=your_supabase_personal_access_token  # For Management API (projects list)

# Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key

# App Configuration
APP_PASSCODE=1234
```

### 2. Supabaseデータベースのセットアップ

1. Supabaseプロジェクトを作成
2. `docs/supabase-schema.sql` を実行してスキーマを作成
3. 初期データ（ユーザー、用語集）が自動的に挿入されます

### 3. 初期テンプレートの作成

```bash
# APIを呼び出して初期テンプレートを作成
curl -X POST http://localhost:3000/api/templates/init
```

### 4. 開発サーバーの起動

```bash
npm install
npm run dev
```

## 🚀 デプロイ手順（Vercel）

### 1. Vercelプロジェクトの作成

1. [Vercel](https://vercel.com) にログイン
2. 「New Project」をクリック
3. GitHubリポジトリを選択（またはGitリポジトリをインポート）

### 2. 環境変数の設定

Vercelのプロジェクト設定で以下の環境変数を設定：

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key

# Cron Secret (週次自動生成用)
CRON_SECRET=your_random_secret_string

# App URL (自動生成される場合は不要)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### 3. Vercel Cron Jobsの設定

`vercel.json` に週次自動生成のcron設定が含まれています。
VercelのダッシュボードでCron Jobsが有効になっていることを確認してください。

### 4. Supabaseデータベースのセットアップ

1. Supabaseプロジェクトを作成
2. SQL Editorで `docs/supabase-schema.sql` を実行
3. 初期データ（ユーザー、用語集）が自動的に挿入されます

### 5. 初期テンプレートの作成

デプロイ後、以下のAPIを呼び出して初期テンプレートを作成：

```bash
curl -X POST https://your-app.vercel.app/api/templates/init
```

または、ブラウザで `/api/templates/init` にアクセスしてPOSTリクエストを送信

### 6. デプロイの確認

- ログインページが表示されること
- パスコードでログインできること
- タスク一覧が表示されること

## 📚 関連ドキュメント

- [要件定義書 v1.0](./docs/requirements.md) - 完全な要件定義
- [Supabaseスキーマ](./docs/supabase-schema.sql) - データベーススキーマ定義
- [Supabase MCP設定](./docs/supabase-mcp-setup.md) - Supabase MCP Serverのセットアップ
