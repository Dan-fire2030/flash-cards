# CLAUDE.md

このファイルは、このリポジトリでコードを扱う際のClaude Code (claude.ai/code)へのガイダンスを提供します。

## プロジェクト概要

PWA機能、オフラインサポート、Supabaseバックエンドを備えたNext.js 15のフラッシュカードアプリケーションです。単語学習用に設計されており、カテゴリ管理、学習セッション、統計追跡、プッシュ通知などの機能を含みます。

## コマンド

### 開発
- `npm run dev` - 開発サーバーを起動 (http://localhost:3000)
- `npm run build` - 本番用ビルド
- `npm run start` - 本番サーバーを起動
- `npm run lint` - ESLintを実行

### データベース
- テストデータ作成: `node scripts/create-test-data.js`
- Supabaseマイグレーション: `supabase/migrations/`

## アーキテクチャ

### 技術スタック
- **フロントエンド**: Next.js 15.4.4 (App Router)、React 19、TypeScript
- **スタイリング**: Tailwind CSS v4
- **データベース**: Supabase (PostgreSQL)
- **認証**: Supabase Auth
- **プッシュ通知**: Firebase Cloud Messaging
- **PWA**: next-pwaによるオフラインサポート
- **チャート**: Rechartsによる統計表示

### ディレクトリ構造
- `/src/app/` - Next.js App RouterのページとAPIルート
  - APIルート: `/api/cards`、`/api/categories`、`/api/sync`
  - 主要ページ: cards、categories、study、stats、settings
- `/src/components/` - 再利用可能なReactコンポーネント
- `/src/contexts/` - Reactコンテキスト (AuthContext、OfflineContext)
- `/src/hooks/` - カスタムフック (生体認証、通知、オフライン機能)
- `/src/lib/` - ユーティリティライブラリ (Supabaseクライアント、Firebase設定)
- `/src/types/` - TypeScript型定義

### 主要データモデル (`/src/types/index.ts`)
- **Category**: parent_idによるツリー構造の階層型カテゴリ
- **Flashcard**: 単語カードと多肢選択式、画像添付対応
- **StudySession**: 学習進捗と正答率の追跡
- **StudyRecord**: 個別カードの回答記録

### データベーススキーマ
- **categories**: 親子関係を持つツリー構造
- **flashcards**: 表面/裏面テキスト、画像、正解/不正解カウント
- **study_sessions**: 日次学習追跡とパフォーマンス指標
- **study_records**: セッションごとの個別回答記録
- **user_preferences**: ユーザー設定と通知設定
- **notification_tokens**: プッシュ通知用FCMトークン

### 認証とセキュリティ
- Supabase Authによるユーザー管理
- `/src/middleware.ts`のミドルウェア (現在テストモード)
- パブリックパス: `/login`、`/signup`、`/forgot-password`、`/auth/callback`
- Web Authentication APIによる生体認証サポート

### オフライン・PWA機能
- 包括的なキャッシング戦略を持つService Worker
- ローカルデータストレージによるオフライン学習モード
- データ整合性のためのバックグラウンド同期
- 画像とフォントのキャッシュファースト戦略
- APIコールのネットワークファースト戦略（フォールバック付き）

### 必要な環境変数
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- プッシュ通知用のFirebase設定キー
- サーバーサイド通知用のFCMサービスアカウント

### 状態管理
- AuthContext: ユーザー認証状態
- OfflineContext: ネットワーク状態と同期管理
- オフラインカードデータ用のローカルストレージ
- PWAデータ永続化用のIndexedDB

### APIエンドポイント
- `/api/cards` - フラッシュカードのCRUD操作
- `/api/categories` - カテゴリ管理
- `/api/sync` - オフラインモードのデータ同期
- Supabase Edge Functions - スケジュール通知

### モバイル対応
- モバイルファーストデザインアプローチ
- タッチ最適化された学習インターフェース
- MobileNavコンポーネントによるレスポンシブナビゲーション
- モバイルデバイスへのPWAインストール対応