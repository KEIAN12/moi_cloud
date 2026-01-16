# Supabase MCP Server セットアップガイド

## 概要

Supabase MCP Serverを使用すると、CursorやClaudeなどのAIツールから直接Supabaseのデータベースを操作できます。

## できること

- テーブルの設計とマイグレーションの管理
- SQLクエリでデータ取得とレポート実行
- 開発用データベースブランチの作成（実験的）
- プロジェクト設定の取得
- 新しいSupabaseプロジェクトの作成
- プロジェクトの一時停止と復元
- ログの取得（デバッグ用）
- データベーススキーマに基づくTypeScript型の生成

## セットアップ手順

### 1. Personal Access Token (PAT) の作成

1. [Supabase Dashboard](https://supabase.com/dashboard) にログイン
2. 右上のアカウントメニュー → **Account Settings**
3. **Access Tokens** セクションに移動
4. **Generate new token** をクリック
5. トークンに名前を付けて生成（例: "Cursor MCP"）
6. 生成されたトークンをコピー（**一度しか表示されません**）

### 2. MCP設定ファイルの更新

`.cursor/mcp.json` ファイルの `<personal-access-token>` を、上記で取得したトークンに置き換えます：

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--access-token",
        "sbp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
      ]
    }
  }
}
```

### 3. Cursorの再起動

設定を反映するためにCursorを再起動してください。

## 使用方法

設定が完了すると、CursorのAIエージェントが以下のような操作を実行できます：

- 「今週のタスクを取得して」
- 「usersテーブルに新しいユーザーを追加して」
- 「データベーススキーマからTypeScript型を生成して」
- 「マイグレーションファイルを作成して」

## セキュリティ注意事項

⚠️ **重要**: `.cursor/mcp.json` には機密情報（アクセストークン）が含まれます。

- `.gitignore` に追加して、リポジトリにコミットしないようにしてください
- チームで共有する場合は、環境変数やシークレット管理サービスを使用してください

## トラブルシューティング

### トークンが無効な場合

- トークンが期限切れになっていないか確認
- Supabase Dashboardで新しいトークンを生成

### MCPサーバーが認識されない場合

- Cursorを再起動
- `.cursor/mcp.json` のJSON構文が正しいか確認
- Cursor Settings → MCP でサーバーが表示されているか確認

## 参考リンク

- [Supabase MCP Server GitHub](https://github.com/supabase/mcp-server-supabase)
- [Supabase MCP ドキュメント](https://supabase.com/docs/guides/mcp)
- [MCP公式ドキュメント](https://modelcontextprotocol.io/)
