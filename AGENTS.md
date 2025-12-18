ユーザーへのメッセージ、Implemantation Plan、Walkthroughなど、ユーザー向けに書くものは必ず日本語で書くこと。
concept.md の仕様を正確に守って開発してください。

## 開発サーバー

`npm run dev` で起動して、 `http://localhost:8787` でアクセスしてください。

開発モードでは、API サーバー（Wrangler）が Vite 開発サーバー（ポート 5173）へのリクエストをプロキシします。

# 開発環境

このリポジトリは pnpm を使った monorepo 構成になっています。
依存パッケージのインストールは常に `pnpm install` で行うこと。

各パッケージの中でインストールしたり、 `npm install` しないように注意してください。
