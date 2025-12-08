# AI Oekaki (AI お絵描き)

Voice-activated AI drawing application tailored for children.
Speak a prompt, and the AI generates a storybook-style illustration.

## Tech Stack

- **Frontend**: React, Vite, TailwindCSS
- **Backend**: Cloudflare Workers (Hono)
- **AI Models**:
    - **Prompt Refinement**: Google Gemini 2.0 Flash Lite
    - **Image Generation**: Google Imagen 3 (via Gemini API)

## Project Structure

- `apps/web`: Frontend application (Vite)
- `apps/api`: Backend application (Cloudflare Workers)

## Deployment

The application is deployed as a **Unified Cloudflare Worker**.
The API Worker serves both the backend logic and the frontend static assets.

### Deploy Command

```bash
# 1. Build Frontend
cd apps/web
pnpm run build

# 2. Deploy API (includes frontend assets)
cd ../api
pnpm run deploy
```

## Local Development

```bash
# Frontend
cd apps/web
pnpm dev

# Backend
cd apps/api
pnpm dev
```
