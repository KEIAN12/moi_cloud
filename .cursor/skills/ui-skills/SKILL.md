---
name: ui-skills
description: UIコンポーネント、レイアウト、アニメーション、タイポグラフィの実装時に適用する制約。React、Next.js、Tailwind CSSを使用したUI開発時に使用。
license: MIT
compatibility: React, Next.js, Tailwind CSS, framer-motion
metadata:
  author: moi-cloud
  version: 1.0.0
allowed-tools: Read Write
---

# UI Skills

UIコンポーネント、レイアウト、アニメーション、タイポグラフィの実装時に適用する制約セット。

## 使用タイミング

- UIコンポーネントを作成・編集する時
- レイアウトやスタイリングを実装する時
- アニメーションを追加する時
- アクセシビリティを改善する時
- コードレビューでUI関連のコードを確認する時

## 使用方法

- `/ui-skills` - この会話中のUI作業に制約を適用
- `/ui-skills <file>` - ファイルをレビューし、違反箇所、理由、修正案を出力

## スタック

### 必須ルール
- Tailwind CSSのデフォルト値を使用（既存のカスタム値がある場合、または明示的に要求された場合を除く）
- JavaScriptアニメーションが必要な場合は`motion/react`（旧framer-motion）を使用
- クラスロジックには`cn`ユーティリティ（clsx + tailwind-merge）を使用

### 推奨
- エントランスやマイクロアニメーションには`tw-animate-css`を使用

## コンポーネント

### アクセシビリティ
- キーボードやフォーカス動作が必要な要素には、アクセシブルなコンポーネントプリミティブを使用（Base UI、React Aria、Radix）
- アイコンのみのボタンには必ず`aria-label`を追加
- キーボードやフォーカス動作を手動で再実装しない（明示的に要求された場合を除く）

### プリミティブの使用
- プロジェクトの既存コンポーネントプリミティブを優先的に使用
- 同じインタラクション面内でプリミティブシステムを混在させない
- 新しいプリミティブが必要な場合、スタックと互換性があればBase UIを優先

## インタラクション

### 必須
- 破壊的または不可逆的なアクションには`AlertDialog`を使用
- `h-screen`は使用せず、`h-dvh`を使用（モバイルブラウザのUIに対応）
- 固定要素には`safe-area-inset`を考慮
- エラーはアクションが発生した場所の近くに表示
- `input`や`textarea`でペーストをブロックしない

### 推奨
- ローディング状態には構造的なスケルトンを使用

## アニメーション

### 基本原則
- 明示的に要求されない限り、アニメーションを追加しない
- インタラクションのフィードバックは200msを超えない
- ループアニメーションは画面外で一時停止
- `prefers-reduced-motion`を尊重

### パフォーマンス
- コンポジタープロパティのみをアニメーション化（`transform`、`opacity`）
- レイアウトプロパティはアニメーション化しない（`width`、`height`、`top`、`left`、`margin`、`padding`）
- ペイントプロパティ（`background`、`color`）のアニメーションは避ける（小さなローカルUI（テキスト、アイコン）を除く）
- 大きな画像やフルスクリーン面のアニメーションは避ける

### イージング
- エントランスには`ease-out`を使用
- カスタムイージングカーブは明示的に要求された場合のみ導入

## タイポグラフィ

### 必須
- 見出しには`text-balance`、本文・段落には`text-pretty`を使用
- データ表示には`tabular-nums`を使用（数値の整列を改善）
- `letter-spacing`（`tracking-*`）は明示的に要求されない限り変更しない

### 推奨
- 密集したUIには`truncate`または`line-clamp`を使用

## レイアウト

### 必須
- 固定のz-indexスケールを使用（任意の`z-*`は使用しない）
  - Tailwindのz-indexスケール（`z-0`から`z-50`）を使用
  - カスタムスケールが必要な場合は設定ファイルで定義

### 推奨
- 正方形要素には`w-* + h-*`の代わりに`size-*`を使用

## パフォーマンス

### 禁止事項
- 大きな`blur()`や`backdrop-filter`面をアニメーション化しない
- アクティブなアニメーション外で`will-change`を適用しない
- レンダーロジックで表現できるものに`useEffect`を使用しない

## デザイン

### 禁止事項
- 明示的に要求されない限り、グラデーションを使用しない
- 紫色やマルチカラーのグラデーションは使用しない
- グロー効果を主要なアフォーダンスとして使用しない

### 必須
- 空状態には明確な次のアクションを1つ提供

### 推奨
- Tailwind CSSのデフォルトシャドウスケールを使用（明示的に要求された場合を除く）
- ビューごとにアクセントカラーの使用を1つに制限
- 新しいカラーを導入する前に、既存のテーマやTailwind CSSカラートークンを使用

## 実装例

### ✅ 良い例

```tsx
// h-dvhの使用
<div className="min-h-dvh bg-gray-50">

// aria-labelの追加
<Button variant="ghost" size="icon" aria-label="戻る">
  <ArrowLeft className="h-5 w-5" />
</Button>

// text-balance/text-prettyの使用
<h1 className="text-2xl font-bold text-balance">タイトル</h1>
<p className="text-pretty">本文テキスト</p>

// tabular-numsの使用
<div className="text-2xl font-bold tabular-nums">123</div>
```

### ❌ 悪い例

```tsx
// h-screenの使用（モバイルで問題）
<div className="min-h-screen">

// aria-labelなしのアイコンボタン
<Button variant="ghost" size="icon">
  <ArrowLeft />
</Button>

// アニメーション時間が長すぎる
transition={{ duration: 0.5 }} // 200msを超える

// レイアウトプロパティのアニメーション
animate={{ width: '100%' }} // パフォーマンス問題
```
