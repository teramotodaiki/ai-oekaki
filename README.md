# AI Oekaki (AI お絵描き)

Voice-activated AI drawing application tailored for children.
Speak a prompt, and the AI generates a storybook-style illustration.

## Tech Stack

- **Frontend**: React, Vite, TailwindCSS
- **Backend**: Cloudflare Workers (Hono)

## Project Structure

- `apps/web`: Frontend application (Vite)
- `apps/api`: Backend application (Cloudflare Workers)

## Deployment

The application is deployed as a **Unified Cloudflare Worker**.
The API Worker serves both the backend logic and the frontend static assets.

## Local Development

```bash
# Monorepo (recommended)
pnpm dev
```

### iPhone から動作確認したい場合

- 同じ Wi‑Fi に接続した状態で、iPhone の Safari から `http://<あなたのPCのIPアドレス>:8787` にアクセスしてください。
- Mac なら IP は `ipconfig getifaddr en0`（Wi‑Fi）で確認できます。
